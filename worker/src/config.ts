import type {
  Env,
  KVLike,
  OutputRecordsConfig,
  PolicyConfig,
  RuntimeConfig,
} from "./types";

const CN_CT_NODE_IDS = [
  "1168", "1134", "1124", "1129", "1312", "1127", "1131", "1228",
  "1136", "1311", "1138", "1151", "1307", "1123", "1310", "1128",
  "1319", "1214", "1132", "1320", "1169", "1170", "1308", "1227",
  "1313", "1137", "1306", "1135", "1305", "1218", "1274", "1304",
];

const CN_CU_NODE_IDS = [
  "1252", "1259", "1301", "1296", "1276", "1303", "1254", "1298",
  "1267", "1264", "1300", "1299", "1260", "1253", "1302", "1255",
  "1262", "1265", "1263", "1258", "1257", "1275", "1277", "1273",
  "1266", "1278", "1256", "1268", "1297", "1226", "1261",
];

const CN_CM_NODE_IDS = [
  "1279", "1237", "1243", "1288", "1249", "1233", "1246", "1294",
  "1295", "1293", "1286", "1287", "1283", "1245", "1291", "1250",
  "1280", "1285", "1248", "1292", "1289", "1242", "1290", "1281",
  "1318", "1244", "1284", "1247", "1321", "1282",
];

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

function buildAllCnRegions(): RuntimeConfig["regions"] {
  const regions: RuntimeConfig["regions"] = {};

  for (const nodeId of CN_CT_NODE_IDS) {
    regions[`ct_${nodeId}`] = { ct: [nodeId] };
  }
  for (const nodeId of CN_CU_NODE_IDS) {
    regions[`cu_${nodeId}`] = { cu: [nodeId] };
  }
  for (const nodeId of CN_CM_NODE_IDS) {
    regions[`cm_${nodeId}`] = { cm: [nodeId] };
  }

  return regions;
}

export async function loadRuntimeConfig(env: Env): Promise<RuntimeConfig> {
  const targetsCfg = await loadJsonFromKV<{ targets: string[] }>(
    env.CONFIG_KV,
    "config:targets",
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
    regions: buildAllCnRegions(),
    policy,
    output,
  };
}
