import { loadRuntimeConfig } from "./config";
import { syncARecordSet } from "./dns";
import { probeBatchPing } from "./itdog";
import { jsonResponse, renderPanelHtml } from "./panel";
import {
  buildDnsTargets,
  loadState,
  saveState,
  updateBestForPair,
} from "./selector";
import type { Env, IspCode } from "./types";

const ISP_LIST: IspCode[] = ["ct", "cu", "cm"];
const STATE_LAST_RUN_PAYLOAD = "state:last_run_payload";

interface RunPayload {
  ok: boolean;
  timestamp: string;
  dns: {
    ct: { changed: boolean; current: string[] };
    cu: { changed: boolean; current: string[] };
    cm: { changed: boolean; current: string[] };
    cf: { changed: boolean; current: string[] };
  };
  selected: {
    ct: string[];
    cu: string[];
    cm: string[];
    cf: string[];
  };
}

async function buildStatePayload(env: Env): Promise<Record<string, unknown>> {
  const state = await loadState(env.STATE_KV);
  const selected = buildDnsTargets(state.lastBest);
  const latestRaw = await env.STATE_KV.get(STATE_LAST_RUN_PAYLOAD);
  const latest = latestRaw ? (JSON.parse(latestRaw) as Record<string, unknown>) : null;

  return {
    ok: true,
    timestamp: (latest?.timestamp as string) ?? null,
    selected,
    dns: (latest?.dns as Record<string, unknown>) ?? null,
    state,
  };
}

async function runScheduled(env: Env): Promise<RunPayload> {
  const cfg = await loadRuntimeConfig(env);
  const state = await loadState(env.STATE_KV);
  const nowIso = new Date().toISOString();

  for (const [region, regionCfg] of Object.entries(cfg.regions)) {
    for (const isp of ISP_LIST) {
      const nodes = regionCfg[isp];
      if (!nodes?.length) continue;

      try {
        const metrics = await probeBatchPing(
          cfg.targets,
          nodes,
          cfg.policy.wsTimeoutSec,
        );
        updateBestForPair({
          region,
          isp,
          metrics,
          policy: cfg.policy,
          lastBest: state.lastBest,
          pending: state.pending,
          nowIso,
        });
      } catch (error) {
        console.error(`测速失败 region=${region} isp=${isp}`, error);
      }
    }
  }

  await saveState(env.STATE_KV, state.lastBest, state.pending);

  const dnsTargets = buildDnsTargets(state.lastBest);
  const output = cfg.output;
  const result = {
    ct: await syncARecordSet(env, output.ctRecord, dnsTargets.ct, output),
    cu: await syncARecordSet(env, output.cuRecord, dnsTargets.cu, output),
    cm: await syncARecordSet(env, output.cmRecord, dnsTargets.cm, output),
    cf: await syncARecordSet(env, output.cfRecord, dnsTargets.cf, output),
  };

  const payload: RunPayload = {
    ok: true,
    timestamp: nowIso,
    dns: result,
    selected: dnsTargets,
  };

  await env.STATE_KV.put(STATE_LAST_RUN_PAYLOAD, JSON.stringify(payload));
  return payload;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await runScheduled(env);
    } catch (error) {
      console.error("scheduled 执行失败", error);
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(renderPanelHtml(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (url.pathname === "/health") {
      return new Response("ok");
    }
    if (url.pathname === "/api/state") {
      const payload = await buildStatePayload(env);
      return jsonResponse({ ok: true, ...payload });
    }
    if (url.pathname === "/run") {
      const payload = await runScheduled(env);
      return jsonResponse(payload);
    }
    return new Response("Not Found", { status: 404 });
  },
};
