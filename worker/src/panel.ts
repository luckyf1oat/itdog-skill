interface PanelPayload {
  ok: boolean;
  timestamp?: string | null;
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
  </div>

  <div class="card">
    <strong>当前聚合 IP</strong>
    <div id="selected"></div>
  </div>

  <div class="card">
    <strong>最近 DNS 同步结果</strong>
    <div id="dns"></div>
  </div>

  <script>
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
      }
    }

    function listHtml(items) {
      if (!items || items.length === 0) return '<span class="muted">(空)</span>';
      return '<ul>' + items.map(i => '<li><code>' + i + '</code></li>').join('') + '</ul>';
    }

    function render(payload) {
      document.getElementById('ts').textContent = payload.timestamp || '-';

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
      status.textContent = '执行中...';
      try {
        const res = await fetch('/run');
        const data = await res.json();
        render(data);
        status.textContent = '执行完成';
      } catch {
        status.innerHTML = '<span class="err">执行失败</span>';
      }
    });

    loadState();
  </script>
</body>
</html>`;
}

export function jsonResponse(payload: PanelPayload): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
