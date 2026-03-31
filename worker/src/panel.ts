interface PanelPayload {
  ok: boolean;
  timestamp?: string | null;
  progress?: {
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
    logs?: string[];
  } | null;
  selected?: {
    ct: string[];
    cu: string[];
    cm: string[];
    cf: string[];
  };
  dns?: Record<string, { changed: boolean; current: string[] }> | null;
  state?: unknown;
}

export function renderPanelHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>itdog Workers 面板</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; margin: 24px; color: #111; }
    h1 { margin: 0 0 16px; }
    .toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
    button { border: 1px solid #ddd; padding: 8px 12px; border-radius: 8px; background: #fff; cursor: pointer; }
    button:hover { background: #f5f5f5; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
    .muted { color: #6b7280; font-size: 13px; }
    .progress-wrap { margin-top: 8px; }
    .progress-track { width: 100%; height: 12px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
    .progress-bar { height: 100%; width: 0%; background: #2563eb; transition: width .2s ease; }
    .console-box { background: #0b1020; color: #d1fae5; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; border-radius: 8px; padding: 10px; min-height: 120px; max-height: 260px; overflow: auto; white-space: pre-wrap; }
    code { background: #f3f4f6; padding: 2px 5px; border-radius: 6px; }
    ul { margin: 6px 0 0 18px; }
    .err { color: #dc2626; }
  </style>
</head>
<body>
  <h1>itdog Workers 控制面板</h1>
  <div class="toolbar">
    <button id="refreshBtn">刷新状态</button>
    <button id="runBtn">立即执行一轮</button>
    <span id="status" class="muted"></span>
  </div>

  <div class="card">
    <div><strong>最近执行时间：</strong><span id="ts">-</span></div>
    <div class="progress-wrap">
      <div><strong>执行进度：</strong><span id="progressText" class="muted">未开始</span></div>
      <div class="progress-track"><div id="progressBar" class="progress-bar"></div></div>
      <div id="progressMeta" class="muted" style="margin-top:6px;"></div>
    </div>
  </div>

  <div class="card">
    <strong>当前聚合 IP</strong>
    <div id="selected"></div>
  </div>

  <div class="card">
    <strong>最近 DNS 同步结果</strong>
    <div id="dns"></div>
  </div>

  <div class="card">
    <strong>实时控制台输出</strong>
    <div id="console" class="console-box">(暂无日志)</div>
  </div>

  <div class="card">
    <strong>配置管理（保存到 CONFIG_KV）</strong>
    <div class="muted">仅需两项：优选域名 + 解析域名（系统自动覆盖国内全部节点）</div>
    <div style="margin-top:10px;">
      <div><strong>1) 优选域名（每行一个）</strong></div>
      <textarea id="cfgTargets" style="width:100%;min-height:100px;margin:6px 0 10px;"></textarea>

      <div><strong>2) 解析域名</strong></div>
      <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;margin:6px 0 10px;">
        <label for="ctRecord">电信(ct)</label><input id="ctRecord" style="padding:6px 8px;" />
        <label for="cuRecord">联通(cu)</label><input id="cuRecord" style="padding:6px 8px;" />
        <label for="cmRecord">移动(cm)</label><input id="cmRecord" style="padding:6px 8px;" />
        <label for="cfRecord">全集(cf)</label><input id="cfRecord" style="padding:6px 8px;" />
      </div>

      <button id="saveCfgBtn">保存配置</button>
    </div>
  </div>

  <script>
    let outputExtra = { ttl: 60, proxied: false };
    let progressTimer = null;
    let serverConsoleLogs = [];
    let localConsoleLogs = [];

    function renderConsole() {
      const consoleEl = document.getElementById('console');
      const merged = [...serverConsoleLogs, ...localConsoleLogs].slice(-300);
      if (!merged.length) {
        consoleEl.textContent = '(暂无日志)';
      } else {
        consoleEl.textContent = merged.join('\\n');
      }
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    function appendConsoleLine(line) {
      const prefix = '[' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '] ';
      localConsoleLogs.push(prefix + '[UI] ' + line);
      if (localConsoleLogs.length > 120) localConsoleLogs.shift();
      renderConsole();
    }

    function setProgress(progress) {
      const bar = document.getElementById('progressBar');
      const text = document.getElementById('progressText');
      const meta = document.getElementById('progressMeta');

      if (!progress) {
        bar.style.width = '0%';
        text.textContent = '未开始';
        meta.textContent = '';
        serverConsoleLogs = [];
        renderConsole();
        return;
      }

      const percent = Math.max(0, Math.min(100, Number(progress.percent || 0)));
      bar.style.width = percent + '%';
      text.textContent = progress.running
        ? ('进行中 ' + percent + '%')
        : (progress.phase === '失败' ? '执行失败' : '已完成 100%');
      meta.textContent = (progress.message || '') + '（' + (progress.completedSteps || 0) + '/' + (progress.totalSteps || 0) + '）' + (progress.error ? ('，错误：' + progress.error) : '');

      serverConsoleLogs = Array.isArray(progress.logs) ? progress.logs : [];
      renderConsole();
    }

    async function loadState() {
      const status = document.getElementById('status');
      status.textContent = '加载中...';
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        render(data);
        status.textContent = '已更新';
      } catch (e) {
        status.innerHTML = '<span class="err">加载失败</span>';
        appendConsoleLine('状态刷新失败');
      }
    }

    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || '加载配置失败');
        const targets = (data.targets && Array.isArray(data.targets.targets)) ? data.targets.targets : [];
        document.getElementById('cfgTargets').value = targets.join('\\n');

        const output = data.output || {};
        document.getElementById('ctRecord').value = output.ctRecord || '';
        document.getElementById('cuRecord').value = output.cuRecord || '';
        document.getElementById('cmRecord').value = output.cmRecord || '';
        document.getElementById('cfRecord').value = output.cfRecord || '';
        outputExtra = {
          ttl: Number.isFinite(output.ttl) ? output.ttl : 60,
          proxied: !!output.proxied,
        };
      } catch (e) {
        const status = document.getElementById('status');
        status.innerHTML = '<span class="err">配置加载失败</span>';
      }
    }

    function listHtml(items) {
      if (!items || items.length === 0) return '<span class="muted">(空)</span>';
      return '<ul>' + items.map(i => '<li><code>' + i + '</code></li>').join('') + '</ul>';
    }

    function render(payload) {
      document.getElementById('ts').textContent = payload.timestamp || '-';
      setProgress(payload.progress || null);

      const sel = payload.selected || {};
      document.getElementById('selected').innerHTML = [
        '<div><strong>ct</strong>' + listHtml(sel.ct || []) + '</div>',
        '<div><strong>cu</strong>' + listHtml(sel.cu || []) + '</div>',
        '<div><strong>cm</strong>' + listHtml(sel.cm || []) + '</div>',
        '<div><strong>cf</strong>' + listHtml(sel.cf || []) + '</div>',
      ].join('');

      const dns = payload.dns || {};
      const keys = ['ct', 'cu', 'cm', 'cf'];
      document.getElementById('dns').innerHTML = keys.map(k => {
        const item = dns[k];
        if (!item) return '<div><strong>' + k + '</strong>: <span class="muted">暂无</span></div>';
        return '<div><strong>' + k + '</strong>: ' + (item.changed ? '已变更' : '无变更') + listHtml(item.current || []) + '</div>';
      }).join('');
    }

    document.getElementById('refreshBtn').addEventListener('click', loadState);
    document.getElementById('runBtn').addEventListener('click', async () => {
      const status = document.getElementById('status');
      status.textContent = '任务启动中...';
      appendConsoleLine('已发送执行请求');
      try {
        const res = await fetch('/run');
        const data = await res.json();
        if (data.started) {
          status.textContent = '任务已启动，正在执行...';
          appendConsoleLine('任务已启动，等待后端进度...');
        } else {
          status.textContent = data.message || '已有任务正在执行';
          appendConsoleLine(data.message || '已有任务正在执行');
        }
        await loadState();
      } catch {
        status.innerHTML = '<span class="err">执行失败</span>';
        appendConsoleLine('执行请求失败');
      }
    });

    document.getElementById('saveCfgBtn').addEventListener('click', async () => {
      const status = document.getElementById('status');
      status.textContent = '保存配置中...';
      try {
        const targetLines = document.getElementById('cfgTargets').value
          .split(/\\r?\\n/)
          .map(s => s.trim())
          .filter(Boolean);
        const payload = {
          targets: { targets: targetLines },
          output: {
            ctRecord: document.getElementById('ctRecord').value.trim(),
            cuRecord: document.getElementById('cuRecord').value.trim(),
            cmRecord: document.getElementById('cmRecord').value.trim(),
            cfRecord: document.getElementById('cfRecord').value.trim(),
            ttl: outputExtra.ttl,
            proxied: outputExtra.proxied,
          },
        };
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || '保存失败');
        }
        status.textContent = '配置已保存';
      } catch (e) {
        status.innerHTML = '<span class="err">保存失败：' + (e && e.message ? e.message : '请检查配置') + '</span>';
      }
    });

    loadState();
    loadConfig();
    progressTimer = setInterval(loadState, 3000);
  </script>
</body>
</html>`;
}

export function jsonResponse(payload: PanelPayload): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
