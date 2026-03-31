import type {
  Env,
  KVLike,
  OutputRecordsConfig,
  PolicyConfig,
  RegionNodeConfig,
  RuntimeConfig,
} from "./types";

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function loadJsonFromKV<T>(
  kv: KVLike,
  key: string,
): Promise<T | null> {
  const text = await kv.get(key);
  if (!text) return null;
  return JSON.parse(text) as T;
}

function validateRegions(regions: Record<string, RegionNodeConfig>): void {
  for (const [region, cfg] of Object.entries(regions)) {
    if (!cfg.ct?.length || !cfg.cu?.length || !cfg.cm?.length) {
      throw new Error(`regions 配置错误: ${region} 必须包含 ct/cu/cm 且不能为空数组`);
    }
  }
}

export async function loadRuntimeConfig(env: Env): Promise<RuntimeConfig> {
  const targetsCfg = await loadJsonFromKV<{ targets: string[] }>(
    env.CONFIG_KV,
    "config:targets",
  );
  const regionsCfg = await loadJsonFromKV<{ regions: Record<string, RegionNodeConfig> }>(
    env.CONFIG_KV,
    "config:regions",
  );
  const policyCfg = await loadJsonFromKV<Partial<PolicyConfig>>(
    env.CONFIG_KV,
    "config:policy",
  );
  const outputCfg = await loadJsonFromKV<Partial<OutputRecordsConfig>>(
    env.CONFIG_KV,
    "config:output",
  );

  if (!targetsCfg?.targets?.length) {
    throw new Error("缺少 config:targets 或 targets 为空");
  }
  if (!regionsCfg?.regions || !Object.keys(regionsCfg.regions).length) {
    throw new Error("缺少 config:regions 或 regions 为空");
  }

  validateRegions(regionsCfg.regions);

  const policy: PolicyConfig = {
    switchThresholdMs:
      policyCfg?.switchThresholdMs ??
      toInt(env.POLICY_DEFAULT_SWITCH_THRESHOLD_MS, 15),
    requiredStreak:
      policyCfg?.requiredStreak ?? toInt(env.POLICY_DEFAULT_REQUIRED_STREAK, 2),
    minSamples:
      policyCfg?.minSamples ?? toInt(env.POLICY_DEFAULT_MIN_SAMPLES, 1),
    wsTimeoutSec:
      policyCfg?.wsTimeoutSec ?? toInt(env.POLICY_DEFAULT_WS_TIMEOUT_SEC, 10),
  };

  const output: OutputRecordsConfig = {
    ctRecord: outputCfg?.ctRecord ?? env.CT_RECORD ?? "ct.example.com",
    cuRecord: outputCfg?.cuRecord ?? env.CU_RECORD ?? "cu.example.com",
    cmRecord: outputCfg?.cmRecord ?? env.CM_RECORD ?? "cm.example.com",
    cfRecord: outputCfg?.cfRecord ?? env.CF_RECORD ?? "cf.example.com",
    ttl: outputCfg?.ttl ?? toInt(env.DNS_TTL, 60),
    proxied: outputCfg?.proxied ?? toBool(env.DNS_PROXIED, false),
  };

  return {
    targets: targetsCfg.targets,
    regions: regionsCfg.regions,
    policy,
    output,
  };
}
