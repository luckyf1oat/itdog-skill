import md5 from "blueimp-md5";
import type { ProbeMetric } from "./types";

const TASK_TOKEN_SECRET = "token_20230313000136kwyktxb0tgspm00yo5";
const GUARD_XOR_SUFFIX = "PTNo2n3Ev5";

const DEFAULT_HEADERS: Record<string, string> = {
  "content-type": "application/x-www-form-urlencoded",
  origin: "https://www.itdog.cn",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

function xorEncrypt(input: string, key: string): string {
  const mergedKey = key + GUARD_XOR_SUFFIX;
  let output = "";
  for (let i = 0; i < input.length; i += 1) {
    output += String.fromCharCode(
      input.charCodeAt(i) ^ mergedKey.charCodeAt(i % mergedKey.length),
    );
  }
  return output;
}

function generateGuardret(guard: string): string {
  const key = guard.slice(0, 8);
  const tail = guard.length > 12 ? Number.parseInt(guard.slice(12), 10) : 0;
  const value = Number.isNaN(tail) ? 16 : tail * 2 + 16;
  const encrypted = xorEncrypt(String(value), key);
  return btoa(encrypted);
}

function generateTaskToken(taskId: string): string {
  const digest = md5(taskId + TASK_TOKEN_SECRET);
  return digest.slice(8, -8);
}

function extract(content: string, pattern: RegExp): string | null {
  const m = content.match(pattern);
  return m?.[1] ?? null;
}

function parseSetCookie(setCookie: string | null): Record<string, string> {
  if (!setCookie) return {};
  const out: Record<string, string> = {};
  const parts = setCookie.split(/,(?=[^;]+?=)/g);
  for (const chunk of parts) {
    const first = chunk.split(";")[0]?.trim();
    if (!first) continue;
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    out[first.slice(0, eq)] = first.slice(eq + 1);
  }
  return out;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function postForm(
  url: string,
  formData: Record<string, string>,
  cookies: Record<string, string>,
  referer: string,
): Promise<string> {
  const headers = {
    ...DEFAULT_HEADERS,
    referer,
    cookie: cookieHeader(cookies),
  };
  const body = new URLSearchParams(formData).toString();
  const resp = await fetch(url, { method: "POST", headers, body });
  const cookieMap = parseSetCookie(resp.headers.get("set-cookie"));
  Object.assign(cookies, cookieMap);
  return await resp.text();
}

async function runTaskAndCollect(
  wssUrl: string,
  taskId: string,
  timeoutSec: number,
): Promise<Record<string, unknown>[]> {
  const taskToken = generateTaskToken(taskId);
  const ws = new WebSocket(wssUrl);
  const messages: Record<string, unknown>[] = [];

  return await new Promise((resolve, reject) => {
    let timer: number | null = null;

    const sendAuth = () => {
      ws.send(JSON.stringify({ task_id: taskId, task_token: taskToken }));
    };

    const resetTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          sendAuth();
          resetTimer();
        } catch (error) {
          reject(error);
        }
      }, timeoutSec * 1000) as unknown as number;
    };

    ws.addEventListener("open", () => {
      sendAuth();
      resetTimer();
    });

    ws.addEventListener("message", (event) => {
      resetTimer();
      try {
        const data = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (data.type === "finished") {
          if (timer !== null) clearTimeout(timer);
          ws.close();
          resolve(messages);
          return;
        }
        messages.push(data);
      } catch {
        // 非 JSON 帧忽略
      }
    });

    ws.addEventListener("error", () => {
      if (timer !== null) clearTimeout(timer);
      reject(new Error("WebSocket 连接异常"));
    });

    ws.addEventListener("close", () => {
      if (timer !== null) clearTimeout(timer);
    });
  });
}

function aggregateMetrics(rows: Record<string, unknown>[]): ProbeMetric[] {
  const buckets = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const ip = String(row.ip ?? "").trim();
    const result = String(row.result ?? "").trim();
    const latency = Number.parseFloat(result);
    if (!ip || Number.isNaN(latency)) continue;

    const prev = buckets.get(ip) ?? { total: 0, count: 0 };
    prev.total += latency;
    prev.count += 1;
    buckets.set(ip, prev);
  }

  return [...buckets.entries()].map(([ip, { total, count }]) => ({
    ip,
    latencyMs: total / count,
    samples: count,
  }));
}

export async function probeBatchPing(
  hosts: string[],
  nodeIds: string[],
  timeoutSec: number,
): Promise<ProbeMetric[]> {
  const cookies: Record<string, string> = {};
  const postUrl = "https://www.itdog.cn/batch_ping/";
  const formData = {
    host: hosts.join("\r\n"),
    node_id: nodeIds.join(","),
    cidr_filter: "true",
    gateway: "last",
  };

  const firstHtml = await postForm(postUrl, formData, cookies, postUrl);
  if (cookies.guard) {
    cookies.guardret = generateGuardret(cookies.guard);
  }

  const html = await postForm(postUrl, formData, cookies, postUrl);
  const content = html || firstHtml;

  const err = extract(content, /err_tip_more\("<li>(.*)<\/li>"\)/);
  if (err) {
    throw new Error(`itdog 返回错误: ${err}`);
  }

  const wssUrl = extract(content, /var wss_url='(.*)';/);
  const taskId = extract(content, /var task_id='(.*)';/);
  if (!wssUrl || !taskId) {
    throw new Error("无法从 itdog 响应提取 wss_url/task_id");
  }

  const wsRows = await runTaskAndCollect(wssUrl, taskId, timeoutSec);
  return aggregateMetrics(wsRows);
}
