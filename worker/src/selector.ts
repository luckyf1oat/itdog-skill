import type {
  BestState,
  IspCode,
  PendingCandidate,
  PendingMap,
  PolicyConfig,
  ProbeMetric,
  RegionBestMap,
} from "./types";

const STATE_LAST_BEST_KEY = "state:last_best";
const STATE_PENDING_KEY = "state:pending";

function pickBest(metrics: ProbeMetric[], minSamples: number): ProbeMetric | null {
  const candidates = metrics
    .filter((m) => m.samples >= minSamples)
    .sort((a, b) => a.latencyMs - b.latencyMs);
  return candidates[0] ?? null;
}

function shouldSwitch(
  current: BestState | undefined,
  challenger: ProbeMetric,
  thresholdMs: number,
): boolean {
  if (!current) return true;
  return current.latencyMs - challenger.latencyMs >= thresholdMs;
}

async function loadJson<T>(
  kv: { get(key: string): Promise<string | null> },
  key: string,
  fallback: T,
): Promise<T> {
  const raw = await kv.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadState(kv: {
  get(key: string): Promise<string | null>;
}): Promise<{ lastBest: RegionBestMap; pending: PendingMap }> {
  const [lastBest, pending] = await Promise.all([
    loadJson<RegionBestMap>(kv, STATE_LAST_BEST_KEY, {}),
    loadJson<PendingMap>(kv, STATE_PENDING_KEY, {}),
  ]);
  return { lastBest, pending };
}

export async function saveState(
  kv: { put(key: string, value: string): Promise<void> },
  lastBest: RegionBestMap,
  pending: PendingMap,
): Promise<void> {
  await Promise.all([
    kv.put(STATE_LAST_BEST_KEY, JSON.stringify(lastBest)),
    kv.put(STATE_PENDING_KEY, JSON.stringify(pending)),
  ]);
}

export function updateBestForPair(params: {
  region: string;
  isp: IspCode;
  metrics: ProbeMetric[];
  policy: PolicyConfig;
  lastBest: RegionBestMap;
  pending: PendingMap;
  nowIso: string;
}): void {
  const { region, isp, metrics, policy, lastBest, pending, nowIso } = params;

  const best = pickBest(metrics, policy.minSamples);
  if (!best) return;

  lastBest[region] ??= {};
  pending[region] ??= {};

  const current = lastBest[region][isp];
  if (!current) {
    lastBest[region][isp] = {
      ip: best.ip,
      latencyMs: best.latencyMs,
      streak: policy.requiredStreak,
      updatedAt: nowIso,
    };
    pending[region][isp] = undefined;
    return;
  }

  if (current.ip === best.ip) {
    lastBest[region][isp] = {
      ...current,
      latencyMs: best.latencyMs,
      updatedAt: nowIso,
    };
    pending[region][isp] = undefined;
    return;
  }

  if (!shouldSwitch(current, best, policy.switchThresholdMs)) {
    pending[region][isp] = undefined;
    return;
  }

  const previousPending: PendingCandidate | undefined = pending[region][isp];
  const nextStreak =
    previousPending && previousPending.ip === best.ip
      ? previousPending.streak + 1
      : 1;

  if (nextStreak >= policy.requiredStreak) {
    lastBest[region][isp] = {
      ip: best.ip,
      latencyMs: best.latencyMs,
      streak: nextStreak,
      updatedAt: nowIso,
    };
    pending[region][isp] = undefined;
    return;
  }

  pending[region][isp] = {
    ip: best.ip,
    latencyMs: best.latencyMs,
    streak: nextStreak,
  };
}

export function buildDnsTargets(lastBest: RegionBestMap): {
  ct: string[];
  cu: string[];
  cm: string[];
  cf: string[];
} {
  const ct = new Set<string>();
  const cu = new Set<string>();
  const cm = new Set<string>();

  for (const byIsp of Object.values(lastBest)) {
    if (byIsp.ct?.ip) ct.add(byIsp.ct.ip);
    if (byIsp.cu?.ip) cu.add(byIsp.cu.ip);
    if (byIsp.cm?.ip) cm.add(byIsp.cm.ip);
  }

  const cf = new Set<string>([...ct, ...cu, ...cm]);
  return {
    ct: [...ct],
    cu: [...cu],
    cm: [...cm],
    cf: [...cf],
  };
}
