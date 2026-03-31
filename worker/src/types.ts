export type IspCode = "ct" | "cu" | "cm";

export interface RegionNodeConfig {
  ct?: string[];
  cu?: string[];
  cm?: string[];
}

export interface TargetsConfig {
  targets: string[];
}

export interface RegionsConfig {
  regions: Record<string, RegionNodeConfig>;
}

export interface PolicyConfig {
  switchThresholdMs: number;
  requiredStreak: number;
  minSamples: number;
  wsTimeoutSec: number;
  maxConcurrency: number;
}

export interface OutputRecordsConfig {
  ctRecord: string;
  cuRecord: string;
  cmRecord: string;
  cfRecord: string;
  ttl: number;
  proxied: boolean;
}

export interface RuntimeConfig {
  targets: string[];
  regions: Record<string, RegionNodeConfig>;
  policy: PolicyConfig;
  output: OutputRecordsConfig;
}

export interface ProbeMetric {
  ip: string;
  latencyMs: number;
  samples: number;
}

export interface BestState {
  ip: string;
  latencyMs: number;
  streak: number;
  updatedAt: string;
}

export interface RegionBestMap {
  [region: string]: Partial<Record<IspCode, BestState>>;
}

export interface Env {
  CONFIG_KV: KVLike;
  STATE_KV: KVLike;

  CF_API_TOKEN: string;
  CF_ZONE_ID: string;

  POLICY_DEFAULT_SWITCH_THRESHOLD_MS: string;
  POLICY_DEFAULT_REQUIRED_STREAK: string;
  POLICY_DEFAULT_MIN_SAMPLES: string;
  POLICY_DEFAULT_WS_TIMEOUT_SEC: string;
  POLICY_DEFAULT_MAX_CONCURRENCY?: string;

  CT_RECORD?: string;
  CU_RECORD?: string;
  CM_RECORD?: string;
  CF_RECORD?: string;
  DNS_TTL?: string;
  DNS_PROXIED?: string;
}

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface PendingCandidate {
  ip: string;
  latencyMs: number;
  streak: number;
}

export interface PendingMap {
  [region: string]: Partial<Record<IspCode, PendingCandidate>>;
}
