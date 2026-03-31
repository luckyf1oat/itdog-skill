import type { Env, OutputRecordsConfig } from "./types";

interface DnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
}

interface CfListResponse {
  success: boolean;
  result: DnsRecord[];
  errors?: Array<{ message: string }>;
}

interface CfMutationResponse {
  success: boolean;
  errors?: Array<{ message: string }>;
}

function authHeaders(env: Env): Record<string, string> {
  return {
    Authorization: `Bearer ${env.CF_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function zoneBase(env: Env): string {
  return `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}`;
}

async function listARecords(env: Env, fqdn: string): Promise<DnsRecord[]> {
  const url = `${zoneBase(env)}/dns_records?type=A&name=${encodeURIComponent(fqdn)}`;
  const resp = await fetch(url, { headers: authHeaders(env) });
  const data = (await resp.json()) as CfListResponse;
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "未知错误";
    throw new Error(`查询 DNS 记录失败: ${fqdn}, ${message}`);
  }
  return data.result ?? [];
}

async function deleteRecord(env: Env, recordId: string): Promise<void> {
  const url = `${zoneBase(env)}/dns_records/${recordId}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(env),
  });
  const data = (await resp.json()) as CfMutationResponse;
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "未知错误";
    throw new Error(`删除 DNS 记录失败: ${recordId}, ${message}`);
  }
}

async function createARecord(
  env: Env,
  fqdn: string,
  ip: string,
  ttl: number,
  proxied: boolean,
): Promise<void> {
  const url = `${zoneBase(env)}/dns_records`;
  const payload = {
    type: "A",
    name: fqdn,
    content: ip,
    ttl,
    proxied,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: authHeaders(env),
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as CfMutationResponse;
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "未知错误";
    throw new Error(`创建 DNS 记录失败: ${fqdn} -> ${ip}, ${message}`);
  }
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const item of b) {
    if (!sa.has(item)) return false;
  }
  return true;
}

export async function syncARecordSet(
  env: Env,
  fqdn: string,
  wantedIps: string[],
  outputCfg: OutputRecordsConfig,
): Promise<{ changed: boolean; current: string[] }> {
  const uniqueWanted = [...new Set(wantedIps)].sort();
  const currentRecords = await listARecords(env, fqdn);
  const currentIps = currentRecords.map((r) => r.content).sort();

  if (sameSet(uniqueWanted, currentIps)) {
    return { changed: false, current: currentIps };
  }

  await Promise.all(currentRecords.map((r) => deleteRecord(env, r.id)));
  await Promise.all(
    uniqueWanted.map((ip) =>
      createARecord(env, fqdn, ip, outputCfg.ttl, outputCfg.proxied),
    ),
  );

  return { changed: true, current: uniqueWanted };
}
