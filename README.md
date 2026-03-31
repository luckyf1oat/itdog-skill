# 🐕 clawdbot-skill-itdog

> Clawdbot Skill: itdog.cn 网络测速工具

[![Clawdbot Skill](https://img.shields.io/badge/Clawdbot-Skill-purple.svg)](https://github.com/clawdbot/clawdbot)
[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

这是一个 [Clawdbot](https://github.com/clawdbot/clawdbot) 技能插件，提供 itdog.cn 网络测速功能。纯 Python 实现，无需浏览器，支持从全国/海外节点进行 Ping 测试和 HTTP 网站测速。

此外，仓库现已包含一个 **Cloudflare Workers 自动优选子项目**（`worker/`）：

- 定时执行 itdog 批量测速
- 按地区与三网（ct/cu/cm）选优
- 自动同步到 4 个 DNS 记录（ct/cu/cm/cf）
- 提供简易前端面板（`/`）查看状态并手动触发
- 支持 GitHub Actions 自动部署

## 📦 安装

```bash
clawdbot skill add 6Kmfi6HP/clawdbot-skill-itdog
```

或手动克隆到 skills 目录：
```bash
cd ~/.clawdbot/skills
git clone https://github.com/6Kmfi6HP/clawdbot-skill-itdog.git itdog
```

## ✨ 功能特性

- 🌍 **Batch Ping** - 从多个节点批量 Ping 测试 IP/域名
- 🌐 **HTTP 测速** - 测试网站在各节点的响应时间
- 🔒 **反爬虫处理** - 自动处理 guard/guardret Cookie
- ⚡ **实时结果** - 通过 WebSocket 实时接收测速数据
- 📊 **多节点支持** - 覆盖三大运营商 + 海外节点

## 🎯 触发词

在 Clawdbot 中使用以下关键词触发此技能：

- `itdog`
- `网络测速`
- `ping测试`
- `批量ping`
- `http测速`
- `cloudflare优选`
- `延迟测试`

## 💬 使用示例

```
用户: 帮我用 itdog 测试一下 1.1.1.1 的延迟

Clawdbot: 🚀 发起 Batch Ping 测试...
目标: 1.1.1.1 (Cloudflare DNS)
节点: 北京电信、北京联通、北京移动

✅ 北京电信: 85ms
✅ 北京移动: 226ms
✅ 北京联通: 287ms

📊 测试完成
```

## 📍 常用节点

| 节点组 | 节点 ID | 说明 |
|--------|---------|------|
| 北京三网 | `1310,1273,1250` | 电信/联通/移动 |
| 上海三网 | `1227,1254,1249` | 电信/联通/移动 |
| 广深三网 | `1169,1278,1290` | 电信/联通/移动 |
| 海外节点 | `1315,1316,1213` | 香港/新加坡/日本 |

完整节点列表见 [references/nodes.md](references/nodes.md)

## 📖 API 文档

### `batch_ping(host, node_id, callback, **kwargs)`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| host | str / list | - | IP/域名，支持 CIDR |
| node_id | str | - | 节点 ID，逗号分隔 |
| callback | callable | - | 结果回调函数 |
| cidr_filter | bool | True | 过滤网络/广播地址 |
| gateway | str | "last" | 网关位置 |
| timeout | int | 10 | WebSocket 超时(秒) |

**回调数据格式:**
```python
{
    'ip': '1.1.1.1',
    'result': '85',           # 延迟(ms)
    'node_id': '1310',
    'task_num': 1,
    'address': 'cloudflare.com'
}
```

### `http_test(url, callback, **kwargs)`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | str | - | 测试 URL |
| callback | callable | - | 结果回调函数 |
| check_mode | str | "fast" | 检测模式 |
| method | str | "get" | HTTP 方法 |
| timeout | int | 10 | WebSocket 超时(秒) |

**回调数据格式:**
```python
{
    'name': '北京电信',
    'ip': '220.181.111.1',
    'all_time': '0.050',      # 总耗时(秒)
    'dns_time': '0.005',
    'connect_time': '0.005',
    'download_time': '0.023',
    'http_code': 200,
    'address': '中国/北京/电信'
}
```

## 🎯 使用场景

### Cloudflare CDN 优选

```python
from scripts.itdog_client import ItdogClient

client = ItdogClient()
results = []

def collect(r):
    if r.get('result') and r['result'].isdigit():
        results.append({
            'ip': r['ip'],
            'latency': int(r['result']),
            'location': r.get('address', '')
        })

# 测试多个 Cloudflare IP
client.batch_ping(
    ["104.16.0.1", "104.17.0.1", "172.67.0.1"],
    "1310,1273,1250",
    collect
)

# 按延迟排序，选择最优 IP
for r in sorted(results, key=lambda x: x['latency'])[:3]:
    print(f"{r['ip']}: {r['latency']}ms")
```

## ⚠️ 注意事项

1. **节点可用性**: 海外节点可能临时不可用，建议优先使用国内节点
2. **请求频率**: 避免高频请求，以免被限制
3. **常量更新**: `TASK_TOKEN_SECRET` 等常量可能需要定期更新

## 🔧 技术细节

详见 [references/api.md](references/api.md)

## ☁️ Worker 自动优选（新增）

`worker/` 目录提供 Cloudflare Workers 版本实现，适合做 Cloudflare IP 自动优选与 DNS 回写。

### 快速开始

```bash
cd worker
npm install
npm run dev
```

访问：

- `GET /`：前端面板
- `GET /run`：立即执行一轮
- `GET /api/state`：读取状态快照

### 自动部署（GitHub Actions）

仓库内置工作流：`.github/workflows/deploy-worker.yml`

触发条件：

- push 到 `main/master` 且变更 `worker/**`
- 手动触发 `workflow_dispatch`

需要在仓库 Secrets 配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

可选 GitHub Actions Variables：

- `CONFIG_KV_TITLE`（默认 `itdog-workers-optimizer-config`）
- `STATE_KV_TITLE`（默认 `itdog-workers-optimizer-state`）

更详细配置与 KV 写入步骤请查看：[`worker/README.md`](worker/README.md)

## 📄 License

MIT License

## 🙏 致谢

- [itdog.cn](https://www.itdog.cn) - 提供测速服务
- [Clawdbot](https://github.com/clawdbot/clawdbot) - AI Agent 框架
