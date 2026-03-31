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
const CONFIG_TARGETS_KEY = "config:targets";
const CONFIG_OUTPUT_KEY = "config:output";

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

interface ConfigPayload {
  targets: { targets: string[] };
  output: {
    ctRecord: string;
    cuRecord: string;
    cmRecord: string;
    cfRecord: string;
    ttl: number;
    proxied: boolean;
  };
}

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function loadJsonFromConfigKV<T>(env: Env, key: string): Promise<T | null> {
  const raw = await env.CONFIG_KV.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

function defaultOutputConfig(env: Env): ConfigPayload["output"] {
  return {
    ctRecord: env.CT_RECORD ?? "ct.example.com",
    cuRecord: env.CU_RECORD ?? "cu.example.com",
    cmRecord: env.CM_RECORD ?? "cm.example.com",
    cfRecord: env.CF_RECORD ?? "cf.example.com",
    ttl: toInt(env.DNS_TTL, 60),
    proxied: toBool(env.DNS_PROXIED, false),
  };
}

async function loadPanelConfig(env: Env): Promise<ConfigPayload> {
  const targets =
    (await loadJsonFromConfigKV<{ targets: string[] }>(env, CONFIG_TARGETS_KEY)) ??
    { targets: [] };
  const output =
    (await loadJsonFromConfigKV<ConfigPayload["output"]>(env, CONFIG_OUTPUT_KEY)) ??
    defaultOutputConfig(env);

  return { targets, output };
}

function validateConfigPayload(payload: ConfigPayload): void {
  if (!Array.isArray(payload.targets?.targets) || payload.targets.targets.length === 0) {
    throw new Error("targets.targets 必须为非空数组");
  }

  const o = payload.output;
  if (!o.ctRecord || !o.cuRecord || !o.cmRecord || !o.cfRecord) {
    throw new Error("output 的 ctRecord/cuRecord/cmRecord/cfRecord 不能为空");
  }
  if (!Number.isFinite(o.ttl) || o.ttl <= 0) {
    throw new Error("output.ttl 必须为正数");
  }
}

async function savePanelConfig(env: Env, payload: ConfigPayload): Promise<void> {
  validateConfigPayload(payload);

  await env.CONFIG_KV.put(CONFIG_TARGETS_KEY, JSON.stringify(payload.targets));
  await env.CONFIG_KV.put(CONFIG_OUTPUT_KEY, JSON.stringify(payload.output));
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
    if (url.pathname === "/api/config" && request.method === "GET") {
      const payload = await loadPanelConfig(env);
      return jsonResponse({ ok: true, ...payload });
    }
    if (url.pathname === "/api/config" && request.method === "POST") {
      try {
        const payload = (await request.json()) as ConfigPayload;
        await savePanelConfig(env, payload);
        const latest = await loadPanelConfig(env);
        return jsonResponse({ ok: true, ...latest });
      } catch (error) {
        const message = error instanceof Error ? error.message : "保存配置失败";
        return new Response(
          JSON.stringify({ ok: false, error: message }, null, 2),
          {
            status: 400,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }
    }
    if (url.pathname === "/run") {
      const payload = await runScheduled(env);
      return jsonResponse(payload);
    }
    return new Response("Not Found", { status: 404 });
  },
};
