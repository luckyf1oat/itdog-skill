# itdog Workers 自动优选与 DNS 同步

该目录提供一个可部署到 Cloudflare Workers 的实现：

- 定时执行 itdog 批量测速
- 按 `地区 x 三网(ct/cu/cm)` 选择最优 IP
- 自动同步到 4 个域名：
  - `ct.example.com`（电信最优集合）
  - `cu.example.com`（联通最优集合）
  - `cm.example.com`（移动最优集合）
  - `cf.example.com`（全部最优全集）

---

## 1. 准备

1. 创建 2 个 KV namespace：
   - `CONFIG_KV`（配置）
   - `STATE_KV`（状态）
2. 将 `worker/wrangler.toml` 中 KV id 替换成实际值。
3. 设置 Secrets：

```bash
wrangler secret put CF_API_TOKEN
wrangler secret put CF_ZONE_ID
```

4. 设置输出域名（可在 wrangler.toml 的 `[vars]` 或 dashboard 环境变量中配置）：
   - `CT_RECORD`
   - `CU_RECORD`
   - `CM_RECORD`
   - `CF_RECORD`
   - `DNS_TTL`（默认 60）
   - `DNS_PROXIED`（默认 false）

---

## 2. 写入 KV 配置

写入以下配置 key：

- `config:targets`（候选优选域名）
- `config:policy`（可选，策略参数）
- `config:output`（可选，解析域名与 DNS 参数）

可直接使用 `examples/` 目录的模板。

示例（Windows PowerShell 可把单引号替换为双引号）：

```bash
wrangler kv key put --binding=CONFIG_KV "config:targets" "$(cat worker/examples/config.targets.json)"
wrangler kv key put --binding=CONFIG_KV "config:policy" "$(cat worker/examples/config.policy.json)"
```

---

## 3. 本地与部署

```bash
cd worker
npm install
npm run dev
```

访问面板：

- `GET /`：简易前端面板（查看当前聚合 IP、最近同步结果）

接口：

- `GET /run`：立即执行一轮测速+同步
- `GET /health`：健康检查
- `GET /api/state`：读取当前状态（含最近一次执行快照）
- `GET /api/config`：读取当前配置（targets/output）
- `POST /api/config`：保存配置到 `CONFIG_KV`

> 现在支持在 `/` 前端面板直接编辑并保存两项配置：
> 1) 优选域名（targets）
> 2) 解析域名（output 的 ct/cu/cm/cf）
>
> 系统会自动使用**国内全部 itdog 节点**参与优选，并将结果聚合写入 4 个域名。

部署：

```bash
npm run deploy
```

---

## 4. 运行逻辑说明

1. 系统内置国内全部 itdog 节点（ct/cu/cm），自动逐节点执行测速。
2. 使用 `config:targets` 对候选域名批量测速。
3. 对每个 `节点 x 运营商` 选延迟最低 IP。
4. 使用防抖策略：
   - `switchThresholdMs`：最小改善阈值（ms）
   - `requiredStreak`：连续领先轮数才切换
5. 汇总后写 DNS：
   - `ctRecord` <- 所有地区 ct 最优 IP 去重集合
   - `cuRecord` <- 所有地区 cu 最优 IP 去重集合
   - `cmRecord` <- 所有地区 cm 最优 IP 去重集合
   - `cfRecord` <- ct+cu+cm 全部去重集合

状态保存在 `STATE_KV`：

- `state:last_best`
- `state:pending`

---

## 5. 注意事项

- itdog 反爬常量（`TASK_TOKEN_SECRET` 等）可能随时间变化，如出现全量失败需更新协议参数。
- 建议先用较低频率 Cron（如 30 分钟）观察 1-2 天，再缩短周期。
- DNS 同步采用“集合比较，不变不写；变更后重建该名称下全部 A 记录”的策略。

---

## 6. GitHub Actions 自动部署

仓库已包含工作流：`.github/workflows/deploy-worker.yml`

触发方式：

- push 到 `main` / `master` 且变更 `worker/**`
- 手动触发 `workflow_dispatch`

请在 GitHub 仓库设置以下 Actions Secrets：

- `CLOUDFLARE_API_TOKEN`（可部署 Worker 且可管理 KV/脚本）
- `CLOUDFLARE_ACCOUNT_ID`

可选配置（GitHub Actions Variables）：

- `CONFIG_KV_TITLE`（默认 `itdog-workers-optimizer-config`）
- `STATE_KV_TITLE`（默认 `itdog-workers-optimizer-state`）

然后确保 `worker/wrangler.toml` 中：

- `name` 为你的 Worker 名称
- 两个 KV namespace id 已替换为真实值

工作流会自动执行：

1. `npm ci`
2. 调用 Cloudflare API 自动“查找或创建”两个 KV namespace，并把 id 写入 `wrangler.toml`
3. `npm run typecheck`
4. `wrangler deploy`
