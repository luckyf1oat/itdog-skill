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
const STATE_RUN_PROGRESS = "state:run_progress";
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

interface RunProgressPayload {
  running: boolean;
  runId: string;
  totalSteps: number;
  completedSteps: number;
  phase: string;
  message: string;
  percent: number;
  startedAt: string;
  finishedAt?: string;
  error?: string;
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
  const [latestRaw, progressRaw] = await Promise.all([
    env.STATE_KV.get(STATE_LAST_RUN_PAYLOAD),
    env.STATE_KV.get(STATE_RUN_PROGRESS),
  ]);
  const latest = latestRaw ? (JSON.parse(latestRaw) as Record<string, unknown>) : null;
  const progress = progressRaw
    ? (JSON.parse(progressRaw) as RunProgressPayload)
    : null;

  return {
    ok: true,
    timestamp: (latest?.timestamp as string) ?? null,
    selected,
    dns: (latest?.dns as Record<string, unknown>) ?? null,
    progress,
    state,
  };
}

async function saveRunProgress(
  env: Env,
  progress: RunProgressPayload,
): Promise<void> {
  await env.STATE_KV.put(STATE_RUN_PROGRESS, JSON.stringify(progress));
}

async function getRunProgress(env: Env): Promise<RunProgressPayload | null> {
  const raw = await env.STATE_KV.get(STATE_RUN_PROGRESS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunProgressPayload;
  } catch {
    return null;
  }
}

async function runScheduled(env: Env, runId = new Date().toISOString()): Promise<RunPayload> {
  const cfg = await loadRuntimeConfig(env);
  const state = await loadState(env.STATE_KV);
  const nowIso = new Date().toISOString();

  const jobs = Object.entries(cfg.regions).flatMap(([region, regionCfg]) =>
    ISP_LIST.map((isp) => ({ region, isp, nodes: regionCfg[isp] ?? [] })).filter(
      (item) => item.nodes.length > 0,
    ),
  );

  const totalSteps = jobs.length + 4;
  let completedSteps = 0;

  await saveRunProgress(env, {
    running: true,
    runId,
    totalSteps,
    completedSteps,
    phase: "测速",
    message: "开始执行全节点测速",
    percent: 0,
    startedAt: nowIso,
  });

  for (const job of jobs) {
    try {
      const metrics = await probeBatchPing(
        cfg.targets,
        job.nodes,
        cfg.policy.wsTimeoutSec,
      );
      updateBestForPair({
        region: job.region,
        isp: job.isp,
        metrics,
        policy: cfg.policy,
        lastBest: state.lastBest,
        pending: state.pending,
        nowIso,
      });
    } catch (error) {
      console.error(`测速失败 region=${job.region} isp=${job.isp}`, error);
    }

    completedSteps += 1;
    await saveRunProgress(env, {
      running: true,
      runId,
      totalSteps,
      completedSteps,
      phase: "测速",
      message: `测速进度 ${completedSteps}/${jobs.length}`,
      percent: Math.round((completedSteps / totalSteps) * 100),
      startedAt: nowIso,
    });
  }

  await saveState(env.STATE_KV, state.lastBest, state.pending);

  const dnsTargets = buildDnsTargets(state.lastBest);
  const output = cfg.output;
  await saveRunProgress(env, {
    running: true,
    runId,
    totalSteps,
    completedSteps,
    phase: "DNS",
    message: "同步 DNS: ct",
    percent: Math.round((completedSteps / totalSteps) * 100),
    startedAt: nowIso,
  });
  const ct = await syncARecordSet(env, output.ctRecord, dnsTargets.ct, output);
  completedSteps += 1;

  await saveRunProgress(env, {
    running: true,
    runId,
    totalSteps,
    completedSteps,
    phase: "DNS",
    message: "同步 DNS: cu",
    percent: Math.round((completedSteps / totalSteps) * 100),
    startedAt: nowIso,
  });
  const cu = await syncARecordSet(env, output.cuRecord, dnsTargets.cu, output);
  completedSteps += 1;

  await saveRunProgress(env, {
    running: true,
    runId,
    totalSteps,
    completedSteps,
    phase: "DNS",
    message: "同步 DNS: cm",
    percent: Math.round((completedSteps / totalSteps) * 100),
    startedAt: nowIso,
  });
  const cm = await syncARecordSet(env, output.cmRecord, dnsTargets.cm, output);
  completedSteps += 1;

  await saveRunProgress(env, {
    running: true,
    runId,
    totalSteps,
    completedSteps,
    phase: "DNS",
    message: "同步 DNS: cf",
    percent: Math.round((completedSteps / totalSteps) * 100),
    startedAt: nowIso,
  });
  const cf = await syncARecordSet(env, output.cfRecord, dnsTargets.cf, output);
  completedSteps += 1;

  const result = {
    ct,
    cu,
    cm,
    cf,
  };

  const payload: RunPayload = {
    ok: true,
    timestamp: nowIso,
    dns: result,
    selected: dnsTargets,
  };

  await env.STATE_KV.put(STATE_LAST_RUN_PAYLOAD, JSON.stringify(payload));
  await saveRunProgress(env, {
    running: false,
    runId,
    totalSteps,
    completedSteps,
    phase: "完成",
    message: "执行完成",
    percent: 100,
    startedAt: nowIso,
    finishedAt: new Date().toISOString(),
  });
  return payload;
}

async function triggerManualRun(
  env: Env,
  ctx: ExecutionContext,
): Promise<{ ok: boolean; started: boolean; message: string; runId?: string }> {
  const current = await getRunProgress(env);
  if (current?.running) {
    return {
      ok: true,
      started: false,
      message: `已有任务在执行（${current.completedSteps}/${current.totalSteps}）`,
      runId: current.runId,
    };
  }

  const runId = `manual-${Date.now()}`;
  ctx.waitUntil(
    runScheduled(env, runId).catch(async (error) => {
      const nowIso = new Date().toISOString();
      const partial = await getRunProgress(env);
      await saveRunProgress(env, {
        running: false,
        runId,
        totalSteps: partial?.totalSteps ?? 0,
        completedSteps: partial?.completedSteps ?? 0,
        phase: "失败",
        message: "执行失败",
        percent: partial?.percent ?? 0,
        startedAt: partial?.startedAt ?? nowIso,
        finishedAt: nowIso,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error("manual run 执行失败", error);
    }),
  );

  return { ok: true, started: true, message: "任务已开始", runId };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await runScheduled(env, `cron-${Date.now()}`);
    } catch (error) {
      console.error("scheduled 执行失败", error);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      const payload = await triggerManualRun(env, ctx);
      return jsonResponse(payload);
    }
    return new Response("Not Found", { status: 404 });
  },
};
