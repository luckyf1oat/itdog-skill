var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node_modules/blueimp-md5/js/md5.js
var require_md5 = __commonJS({
  "node_modules/blueimp-md5/js/md5.js"(exports, module) {
    init_modules_watch_stub();
    (function($) {
      "use strict";
      function safeAdd(x, y) {
        var lsw = (x & 65535) + (y & 65535);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
      }
      __name(safeAdd, "safeAdd");
      function bitRotateLeft(num, cnt) {
        return num << cnt | num >>> 32 - cnt;
      }
      __name(bitRotateLeft, "bitRotateLeft");
      function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
      }
      __name(md5cmn, "md5cmn");
      function md5ff(a, b, c, d, x, s, t) {
        return md5cmn(b & c | ~b & d, a, b, x, s, t);
      }
      __name(md5ff, "md5ff");
      function md5gg(a, b, c, d, x, s, t) {
        return md5cmn(b & d | c & ~d, a, b, x, s, t);
      }
      __name(md5gg, "md5gg");
      function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t);
      }
      __name(md5hh, "md5hh");
      function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t);
      }
      __name(md5ii, "md5ii");
      function binlMD5(x, len) {
        x[len >> 5] |= 128 << len % 32;
        x[(len + 64 >>> 9 << 4) + 14] = len;
        var i;
        var olda;
        var oldb;
        var oldc;
        var oldd;
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        for (i = 0; i < x.length; i += 16) {
          olda = a;
          oldb = b;
          oldc = c;
          oldd = d;
          a = md5ff(a, b, c, d, x[i], 7, -680876936);
          d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
          c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
          b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
          a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
          d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
          c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
          b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
          a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
          d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
          c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
          b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
          a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
          d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
          c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
          b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
          a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
          d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
          c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
          b = md5gg(b, c, d, a, x[i], 20, -373897302);
          a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
          d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
          c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
          b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
          a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
          d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
          c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
          b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
          a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
          d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
          c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
          b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
          a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
          d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
          c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
          b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
          a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
          d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
          c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
          b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
          a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
          d = md5hh(d, a, b, c, x[i], 11, -358537222);
          c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
          b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
          a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
          d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
          c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
          b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
          a = md5ii(a, b, c, d, x[i], 6, -198630844);
          d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
          c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
          b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
          a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
          d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
          c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
          b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
          a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
          d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
          c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
          b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
          a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
          d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
          c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
          b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
          a = safeAdd(a, olda);
          b = safeAdd(b, oldb);
          c = safeAdd(c, oldc);
          d = safeAdd(d, oldd);
        }
        return [a, b, c, d];
      }
      __name(binlMD5, "binlMD5");
      function binl2rstr(input) {
        var i;
        var output = "";
        var length32 = input.length * 32;
        for (i = 0; i < length32; i += 8) {
          output += String.fromCharCode(input[i >> 5] >>> i % 32 & 255);
        }
        return output;
      }
      __name(binl2rstr, "binl2rstr");
      function rstr2binl(input) {
        var i;
        var output = [];
        output[(input.length >> 2) - 1] = void 0;
        for (i = 0; i < output.length; i += 1) {
          output[i] = 0;
        }
        var length8 = input.length * 8;
        for (i = 0; i < length8; i += 8) {
          output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << i % 32;
        }
        return output;
      }
      __name(rstr2binl, "rstr2binl");
      function rstrMD5(s) {
        return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
      }
      __name(rstrMD5, "rstrMD5");
      function rstrHMACMD5(key, data) {
        var i;
        var bkey = rstr2binl(key);
        var ipad = [];
        var opad = [];
        var hash;
        ipad[15] = opad[15] = void 0;
        if (bkey.length > 16) {
          bkey = binlMD5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
          ipad[i] = bkey[i] ^ 909522486;
          opad[i] = bkey[i] ^ 1549556828;
        }
        hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binlMD5(opad.concat(hash), 512 + 128));
      }
      __name(rstrHMACMD5, "rstrHMACMD5");
      function rstr2hex(input) {
        var hexTab = "0123456789abcdef";
        var output = "";
        var x;
        var i;
        for (i = 0; i < input.length; i += 1) {
          x = input.charCodeAt(i);
          output += hexTab.charAt(x >>> 4 & 15) + hexTab.charAt(x & 15);
        }
        return output;
      }
      __name(rstr2hex, "rstr2hex");
      function str2rstrUTF8(input) {
        return unescape(encodeURIComponent(input));
      }
      __name(str2rstrUTF8, "str2rstrUTF8");
      function rawMD5(s) {
        return rstrMD5(str2rstrUTF8(s));
      }
      __name(rawMD5, "rawMD5");
      function hexMD5(s) {
        return rstr2hex(rawMD5(s));
      }
      __name(hexMD5, "hexMD5");
      function rawHMACMD5(k, d) {
        return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d));
      }
      __name(rawHMACMD5, "rawHMACMD5");
      function hexHMACMD5(k, d) {
        return rstr2hex(rawHMACMD5(k, d));
      }
      __name(hexHMACMD5, "hexHMACMD5");
      function md52(string, key, raw) {
        if (!key) {
          if (!raw) {
            return hexMD5(string);
          }
          return rawMD5(string);
        }
        if (!raw) {
          return hexHMACMD5(key, string);
        }
        return rawHMACMD5(key, string);
      }
      __name(md52, "md5");
      if (typeof define === "function" && define.amd) {
        define(function() {
          return md52;
        });
      } else if (typeof module === "object" && module.exports) {
        module.exports = md52;
      } else {
        $.md5 = md52;
      }
    })(exports);
  }
});

// .wrangler/tmp/bundle-8L8U6U/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-8L8U6U/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();

// src/config.ts
init_modules_watch_stub();
function toInt(value, fallback) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
__name(toInt, "toInt");
function toBool(value, fallback) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
__name(toBool, "toBool");
async function loadJsonFromKV(kv, key) {
  const text = await kv.get(key);
  if (!text) return null;
  return JSON.parse(text);
}
__name(loadJsonFromKV, "loadJsonFromKV");
function validateRegions(regions) {
  for (const [region, cfg] of Object.entries(regions)) {
    if (!cfg.ct?.length || !cfg.cu?.length || !cfg.cm?.length) {
      throw new Error(`regions \u914D\u7F6E\u9519\u8BEF: ${region} \u5FC5\u987B\u5305\u542B ct/cu/cm \u4E14\u4E0D\u80FD\u4E3A\u7A7A\u6570\u7EC4`);
    }
  }
}
__name(validateRegions, "validateRegions");
async function loadRuntimeConfig(env) {
  const targetsCfg = await loadJsonFromKV(
    env.CONFIG_KV,
    "config:targets"
  );
  const regionsCfg = await loadJsonFromKV(
    env.CONFIG_KV,
    "config:regions"
  );
  const policyCfg = await loadJsonFromKV(
    env.CONFIG_KV,
    "config:policy"
  );
  if (!targetsCfg?.targets?.length) {
    throw new Error("\u7F3A\u5C11 config:targets \u6216 targets \u4E3A\u7A7A");
  }
  if (!regionsCfg?.regions || !Object.keys(regionsCfg.regions).length) {
    throw new Error("\u7F3A\u5C11 config:regions \u6216 regions \u4E3A\u7A7A");
  }
  validateRegions(regionsCfg.regions);
  const policy = {
    switchThresholdMs: policyCfg?.switchThresholdMs ?? toInt(env.POLICY_DEFAULT_SWITCH_THRESHOLD_MS, 15),
    requiredStreak: policyCfg?.requiredStreak ?? toInt(env.POLICY_DEFAULT_REQUIRED_STREAK, 2),
    minSamples: policyCfg?.minSamples ?? toInt(env.POLICY_DEFAULT_MIN_SAMPLES, 1),
    wsTimeoutSec: policyCfg?.wsTimeoutSec ?? toInt(env.POLICY_DEFAULT_WS_TIMEOUT_SEC, 10)
  };
  const output = {
    ctRecord: env.CT_RECORD ?? "ct.example.com",
    cuRecord: env.CU_RECORD ?? "cu.example.com",
    cmRecord: env.CM_RECORD ?? "cm.example.com",
    cfRecord: env.CF_RECORD ?? "cf.example.com",
    ttl: toInt(env.DNS_TTL, 60),
    proxied: toBool(env.DNS_PROXIED, false)
  };
  return {
    targets: targetsCfg.targets,
    regions: regionsCfg.regions,
    policy,
    output
  };
}
__name(loadRuntimeConfig, "loadRuntimeConfig");

// src/dns.ts
init_modules_watch_stub();
function authHeaders(env) {
  return {
    Authorization: `Bearer ${env.CF_API_TOKEN}`,
    "Content-Type": "application/json"
  };
}
__name(authHeaders, "authHeaders");
function zoneBase(env) {
  return `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}`;
}
__name(zoneBase, "zoneBase");
async function listARecords(env, fqdn) {
  const url = `${zoneBase(env)}/dns_records?type=A&name=${encodeURIComponent(fqdn)}`;
  const resp = await fetch(url, { headers: authHeaders(env) });
  const data = await resp.json();
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`\u67E5\u8BE2 DNS \u8BB0\u5F55\u5931\u8D25: ${fqdn}, ${message}`);
  }
  return data.result ?? [];
}
__name(listARecords, "listARecords");
async function deleteRecord(env, recordId) {
  const url = `${zoneBase(env)}/dns_records/${recordId}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(env)
  });
  const data = await resp.json();
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`\u5220\u9664 DNS \u8BB0\u5F55\u5931\u8D25: ${recordId}, ${message}`);
  }
}
__name(deleteRecord, "deleteRecord");
async function createARecord(env, fqdn, ip, ttl, proxied) {
  const url = `${zoneBase(env)}/dns_records`;
  const payload = {
    type: "A",
    name: fqdn,
    content: ip,
    ttl,
    proxied
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: authHeaders(env),
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  if (!resp.ok || !data.success) {
    const message = data.errors?.map((e) => e.message).join("; ") || "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`\u521B\u5EFA DNS \u8BB0\u5F55\u5931\u8D25: ${fqdn} -> ${ip}, ${message}`);
  }
}
__name(createARecord, "createARecord");
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const item of b) {
    if (!sa.has(item)) return false;
  }
  return true;
}
__name(sameSet, "sameSet");
async function syncARecordSet(env, fqdn, wantedIps, outputCfg) {
  const uniqueWanted = [...new Set(wantedIps)].sort();
  const currentRecords = await listARecords(env, fqdn);
  const currentIps = currentRecords.map((r) => r.content).sort();
  if (sameSet(uniqueWanted, currentIps)) {
    return { changed: false, current: currentIps };
  }
  await Promise.all(currentRecords.map((r) => deleteRecord(env, r.id)));
  await Promise.all(
    uniqueWanted.map(
      (ip) => createARecord(env, fqdn, ip, outputCfg.ttl, outputCfg.proxied)
    )
  );
  return { changed: true, current: uniqueWanted };
}
__name(syncARecordSet, "syncARecordSet");

// src/itdog.ts
init_modules_watch_stub();
var import_blueimp_md5 = __toESM(require_md5(), 1);
var TASK_TOKEN_SECRET = "token_20230313000136kwyktxb0tgspm00yo5";
var GUARD_XOR_SUFFIX = "PTNo2n3Ev5";
var DEFAULT_HEADERS = {
  "content-type": "application/x-www-form-urlencoded",
  origin: "https://www.itdog.cn",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};
function xorEncrypt(input, key) {
  const mergedKey = key + GUARD_XOR_SUFFIX;
  let output = "";
  for (let i = 0; i < input.length; i += 1) {
    output += String.fromCharCode(
      input.charCodeAt(i) ^ mergedKey.charCodeAt(i % mergedKey.length)
    );
  }
  return output;
}
__name(xorEncrypt, "xorEncrypt");
function generateGuardret(guard) {
  const key = guard.slice(0, 8);
  const tail = guard.length > 12 ? Number.parseInt(guard.slice(12), 10) : 0;
  const value = Number.isNaN(tail) ? 16 : tail * 2 + 16;
  const encrypted = xorEncrypt(String(value), key);
  return btoa(encrypted);
}
__name(generateGuardret, "generateGuardret");
function generateTaskToken(taskId) {
  const digest = (0, import_blueimp_md5.default)(taskId + TASK_TOKEN_SECRET);
  return digest.slice(8, -8);
}
__name(generateTaskToken, "generateTaskToken");
function extract(content, pattern) {
  const m = content.match(pattern);
  return m?.[1] ?? null;
}
__name(extract, "extract");
function parseSetCookie(setCookie) {
  if (!setCookie) return {};
  const out = {};
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
__name(parseSetCookie, "parseSetCookie");
function cookieHeader(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}
__name(cookieHeader, "cookieHeader");
async function postForm(url, formData, cookies, referer) {
  const headers = {
    ...DEFAULT_HEADERS,
    referer,
    cookie: cookieHeader(cookies)
  };
  const body = new URLSearchParams(formData).toString();
  const resp = await fetch(url, { method: "POST", headers, body });
  const cookieMap = parseSetCookie(resp.headers.get("set-cookie"));
  Object.assign(cookies, cookieMap);
  return await resp.text();
}
__name(postForm, "postForm");
async function runTaskAndCollect(wssUrl, taskId, timeoutSec) {
  const taskToken = generateTaskToken(taskId);
  const ws = new WebSocket(wssUrl);
  const messages = [];
  return await new Promise((resolve, reject) => {
    let timer = null;
    const sendAuth = /* @__PURE__ */ __name(() => {
      ws.send(JSON.stringify({ task_id: taskId, task_token: taskToken }));
    }, "sendAuth");
    const resetTimer = /* @__PURE__ */ __name(() => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          sendAuth();
          resetTimer();
        } catch (error) {
          reject(error);
        }
      }, timeoutSec * 1e3);
    }, "resetTimer");
    ws.addEventListener("open", () => {
      sendAuth();
      resetTimer();
    });
    ws.addEventListener("message", (event) => {
      resetTimer();
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "finished") {
          if (timer !== null) clearTimeout(timer);
          ws.close();
          resolve(messages);
          return;
        }
        messages.push(data);
      } catch {
      }
    });
    ws.addEventListener("error", () => {
      if (timer !== null) clearTimeout(timer);
      reject(new Error("WebSocket \u8FDE\u63A5\u5F02\u5E38"));
    });
    ws.addEventListener("close", () => {
      if (timer !== null) clearTimeout(timer);
    });
  });
}
__name(runTaskAndCollect, "runTaskAndCollect");
function aggregateMetrics(rows) {
  const buckets = /* @__PURE__ */ new Map();
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
    samples: count
  }));
}
__name(aggregateMetrics, "aggregateMetrics");
async function probeBatchPing(hosts, nodeIds, timeoutSec) {
  const cookies = {};
  const postUrl = "https://www.itdog.cn/batch_ping/";
  const formData = {
    host: hosts.join("\r\n"),
    node_id: nodeIds.join(","),
    cidr_filter: "true",
    gateway: "last"
  };
  const firstHtml = await postForm(postUrl, formData, cookies, postUrl);
  if (cookies.guard) {
    cookies.guardret = generateGuardret(cookies.guard);
  }
  const html = await postForm(postUrl, formData, cookies, postUrl);
  const content = html || firstHtml;
  const err = extract(content, /err_tip_more\("<li>(.*)<\/li>"\)/);
  if (err) {
    throw new Error(`itdog \u8FD4\u56DE\u9519\u8BEF: ${err}`);
  }
  const wssUrl = extract(content, /var wss_url='(.*)';/);
  const taskId = extract(content, /var task_id='(.*)';/);
  if (!wssUrl || !taskId) {
    throw new Error("\u65E0\u6CD5\u4ECE itdog \u54CD\u5E94\u63D0\u53D6 wss_url/task_id");
  }
  const wsRows = await runTaskAndCollect(wssUrl, taskId, timeoutSec);
  return aggregateMetrics(wsRows);
}
__name(probeBatchPing, "probeBatchPing");

// src/selector.ts
init_modules_watch_stub();
var STATE_LAST_BEST_KEY = "state:last_best";
var STATE_PENDING_KEY = "state:pending";
function pickBest(metrics, minSamples) {
  const candidates = metrics.filter((m) => m.samples >= minSamples).sort((a, b) => a.latencyMs - b.latencyMs);
  return candidates[0] ?? null;
}
__name(pickBest, "pickBest");
function shouldSwitch(current, challenger, thresholdMs) {
  if (!current) return true;
  return current.latencyMs - challenger.latencyMs >= thresholdMs;
}
__name(shouldSwitch, "shouldSwitch");
async function loadJson(kv, key, fallback) {
  const raw = await kv.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
__name(loadJson, "loadJson");
async function loadState(kv) {
  const [lastBest, pending] = await Promise.all([
    loadJson(kv, STATE_LAST_BEST_KEY, {}),
    loadJson(kv, STATE_PENDING_KEY, {})
  ]);
  return { lastBest, pending };
}
__name(loadState, "loadState");
async function saveState(kv, lastBest, pending) {
  await Promise.all([
    kv.put(STATE_LAST_BEST_KEY, JSON.stringify(lastBest)),
    kv.put(STATE_PENDING_KEY, JSON.stringify(pending))
  ]);
}
__name(saveState, "saveState");
function updateBestForPair(params) {
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
      updatedAt: nowIso
    };
    pending[region][isp] = void 0;
    return;
  }
  if (current.ip === best.ip) {
    lastBest[region][isp] = {
      ...current,
      latencyMs: best.latencyMs,
      updatedAt: nowIso
    };
    pending[region][isp] = void 0;
    return;
  }
  if (!shouldSwitch(current, best, policy.switchThresholdMs)) {
    pending[region][isp] = void 0;
    return;
  }
  const previousPending = pending[region][isp];
  const nextStreak = previousPending && previousPending.ip === best.ip ? previousPending.streak + 1 : 1;
  if (nextStreak >= policy.requiredStreak) {
    lastBest[region][isp] = {
      ip: best.ip,
      latencyMs: best.latencyMs,
      streak: nextStreak,
      updatedAt: nowIso
    };
    pending[region][isp] = void 0;
    return;
  }
  pending[region][isp] = {
    ip: best.ip,
    latencyMs: best.latencyMs,
    streak: nextStreak
  };
}
__name(updateBestForPair, "updateBestForPair");
function buildDnsTargets(lastBest) {
  const ct = /* @__PURE__ */ new Set();
  const cu = /* @__PURE__ */ new Set();
  const cm = /* @__PURE__ */ new Set();
  for (const byIsp of Object.values(lastBest)) {
    if (byIsp.ct?.ip) ct.add(byIsp.ct.ip);
    if (byIsp.cu?.ip) cu.add(byIsp.cu.ip);
    if (byIsp.cm?.ip) cm.add(byIsp.cm.ip);
  }
  const cf = /* @__PURE__ */ new Set([...ct, ...cu, ...cm]);
  return {
    ct: [...ct],
    cu: [...cu],
    cm: [...cm],
    cf: [...cf]
  };
}
__name(buildDnsTargets, "buildDnsTargets");

// src/index.ts
var ISP_LIST = ["ct", "cu", "cm"];
async function runScheduled(env) {
  const cfg = await loadRuntimeConfig(env);
  const state = await loadState(env.STATE_KV);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const [region, regionCfg] of Object.entries(cfg.regions)) {
    for (const isp of ISP_LIST) {
      const nodes = regionCfg[isp];
      if (!nodes?.length) continue;
      try {
        const metrics = await probeBatchPing(
          cfg.targets,
          nodes,
          cfg.policy.wsTimeoutSec
        );
        updateBestForPair({
          region,
          isp,
          metrics,
          policy: cfg.policy,
          lastBest: state.lastBest,
          pending: state.pending,
          nowIso
        });
      } catch (error) {
        console.error(`\u6D4B\u901F\u5931\u8D25 region=${region} isp=${isp}`, error);
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
    cf: await syncARecordSet(env, output.cfRecord, dnsTargets.cf, output)
  };
  return new Response(
    JSON.stringify(
      {
        ok: true,
        timestamp: nowIso,
        dns: result,
        selected: dnsTargets
      },
      null,
      2
    ),
    { headers: { "content-type": "application/json; charset=utf-8" } }
  );
}
__name(runScheduled, "runScheduled");
var src_default = {
  async scheduled(_event, env) {
    try {
      await runScheduled(env);
    } catch (error) {
      console.error("scheduled \u6267\u884C\u5931\u8D25", error);
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response("ok");
    }
    if (url.pathname === "/run") {
      return runScheduled(env);
    }
    return new Response("Not Found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-8L8U6U/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-8L8U6U/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
