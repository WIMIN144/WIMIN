# dsh-zhipu-balance

[English](README.md) | 中文

**dsh-zhipu-balance** 是 DeepSeek Harness（DSH）网页端（`dsh web`）的**智谱余额/用量面板**，魔改自社区成熟插件 [dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel)（MIT）并重新聚焦智谱生态：

- **资源包 · API 额度** — 现金余额（控制台「财务总览」口径：当前/可用/累计充值/赠送）
  与账号下每个资源包的余额/总量/已用进度/到期时间
  （「我的资源包」列表；资源包查询失败时回退显示账号级额度窗口）；
- **Coding Plan** — GLM Coding Plan 的 5 小时窗口、周窗口、月度 MCP 车道用量；
- **模型用量** — 近 24 小时逐模型 token 用量明细（尽力而为）。

面板停靠在**窗口最右侧**：收起时是一个贴右缘的细长竖排标签页（带最差状态指示点），
点击展开为右侧抽屉；再点 ▸ 收起。

## 数据来源

社区工具（[pi-glm-usage](https://github.com/frederick-wang/pi-glm-usage)、
[glm-plan-usage2](https://github.com/zwen64657/glm-plan-usage2)、
[dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel)）实测确认的智谱用量监控接口
（未公开文档化但长期稳定）：

| 端点 | 用途 |
|---|---|
| `GET {base}/api/monitor/usage/quota/limit` | 额度/资源包（普通 Key）与套餐窗口（Coding Key） |
| `GET {base}/api/monitor/usage/model-usage?startTime=..&endTime=..` | 逐模型用量明细（Asia/Shanghai 本地时间窗） |
| `GET {base}/api/biz/tokenAccounts/list/my?pageNum=1&pageSize=100&filterEnabled=false` | 控制台「资源包管理」的数据源：每个资源包的总量/余额/冻结/到期（实测接受 API Key 认证） |
| `GET {base}/api/biz/account/query-customer-account-report` | 控制台「财务总览」的数据源：现金余额（当前/可用/充值/赠送/消费/冻结/信用） |

- 现金余额（¥）来自控制台「财务总览」的逆向接口（本插件首发实测：接受 API Key 认证），
  字段语义：`balance`=当前余额、`availableBalance`=可用余额、`rechargeAmount`=累计充值、
  `giveAmount`=赠送、`totalSpendAmount`=总消费、`frozenBalance`=冻结、`creditStatus`=信用状态。
- 资源包行字段语义（实测）：`tokensMagnitude`=总量、`availableBalance`=可用余额、
  `frozenBalance`=冻结、`consumeType`=TOKENS/TIMES、`status`=EFFECTIVE/NOTUSED/EXPIRED/CANCELLED；
  消耗 = 总量 − 可用余额，仅 `EFFECTIVE` 的包计入状态点着色。
- 普通 API Key 与 Coding Plan Key 返回同一端点的不同字段形态，插件按 Key 类型分别归一化。
- 认证先 `Bearer <key>`，401 时自动回退裸 Key（与社区工具行为一致）。

## 需要的配置

把 Key 写进 `$DSH_HOME/.credentials.yaml`（Windows 默认 `C:\Users\<你>\.dsh\.credentials.yaml`）：

```yaml
# 智谱开放平台 API Key（open.bigmodel.cn → API Keys）
ZHIPU_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx

# GLM Coding Plan Key（智谱国内站；如果没有 Coding Plan，此行可省略，
# 面板上 Coding Plan 板块会显示未配置错误，不影响其他板块）
ZAI_CODING_CN_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx
```

也支持同名环境变量。改完凭据**重启 `dsh web`** 即可（每个刷新周期都会重新探测凭据，新增 Key 后其实不用重启——但首次安装必须重启一次）。

## 安装

```sh
# 从本仓库目录以 link 方式安装（源码即生效副本，改完重启 dsh web 即可）
dsh plugin --profile web add "link:E:/working/dsh-zhipu-balance"

# 或者以 file 方式安装（复制快照进 profile）
dsh plugin --profile web add "file:E:/working/dsh-zhipu-balance"

# 重启 dsh web（bundle 层与 client 模块图在启动时生效）
```

安装命令会自动把包写入 profile 的 `dsh.profile.bundles`，包内的 `cordis.patch.yml`
随之作为一层 profile 补丁挂载（面板行 `zhipu-balance`）。

## 配置（可选）

所有键都有默认值，可在 profile 的 `cordis.patch.yml` 里覆盖面板行配置：

| 键 | 含义 | 默认值 |
|---|---|---|
| `refreshMs` | 自动刷新间隔（≥ 5000） | `60000` |
| `apiRefs` | API 行探测的凭据引用名 | `["ZHIPU_API_KEY", "GLM_API_KEY"]` |
| `apiBaseUrl` | API 行上游基址 | `https://open.bigmodel.cn` |
| `codingRefs` | Coding Plan 行探测的凭据引用名 | `["ZAI_CODING_CN_API_KEY"]` |
| `codingBaseUrl` | Coding Plan 上游基址（国际站填 `https://api.z.ai`，并把 refs 换成 `ZAI_API_KEY`） | `https://open.bigmodel.cn` |
| `usageDetail` | 是否拉取 24h 逐模型用量明细 | `true` |
| `warnPercent` / `errorPercent` | 用量预警/告警阈值 | `70` / `90` |

示例（国际站 Coding Plan）：

```yaml
- insert:
    - id: zhipu-balance
      name: 'dsh-zhipu-balance'
      config:
        codingRefs: [ZAI_API_KEY]
        codingBaseUrl: https://api.z.ai
```

前端 ⚙ 设置面板（仅存浏览器 localStorage）：自动刷新间隔、板块显示开关、阈值覆盖、「恢复默认」。

## 架构与安全

```
┌────────────── browser (lib/client.js) ──────────────┐
│  shell.overlay 槽位 → 右缘竖排标签 / 右侧抽屉       │
│  localStorage: 刷新间隔 · 板块开关 · 阈值           │
└──────────────┬──────────────────────────────────────┘
               │ 仅回环 Connection RPC: /dsh-zhipu-balance
               │   specs（渲染提示，不含凭据）
               │   fetch-all → 归一化视图
┌──────────────▼──────────────────────────────────────┐
│  host (lib/index.js)                                │
│  ctx.credentials → API Key（绝不进入浏览器）         │
│  Bearer（401 回退裸 Key）→ 智谱监控端点             │
│  归一化 → api / coding 视图模型 + 逐模型用量        │
└─────────────────────────────────────────────────────┘
```

- API Key 仅在宿主侧通过 `ctx.credentials` 解析，浏览器只收到归一化视图；
- RPC 通道 `{authority: 'loopback'}`，与 DSH 内建客户端通道同级；
- 上游原始 JSON 不出宿主；单行失败不影响另一行；
- 零 npm 运行时依赖（schemastery + cosmokit 均已 vendor，均 MIT）。

## 已知限制

- 现金余额接口为控制台逆向所得（未公开文档化）：智谱若调整 `/api/biz/*` 路径或字段，
  现金行会自动隐藏，其余板块不受影响；
- `limits[]` 的字段形态随 Key 类型/账号而异：插件对
  `percentage`、`remaining`+`number`、`currentValue`+`usage` 三种形态做了归一化，
  并把原始字段放进悬停提示（hover title），未识别的字段形态显示为 `—`；
- 模型用量明细是尽力而为：接口不可用或字段变化时该板块显示「暂无数据」。

## 致谢

- [wenzetan/dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel) ——
  本插件的直接蓝本（双面架构、RPC 契约、槽位注册、设置面板交互均继承自它，MIT）；
- [frederick-wang/pi-glm-usage](https://github.com/frederick-wang/pi-glm-usage) ——
  监控端点认证方案（Bearer/裸 Key 回退）与响应解析语义；
- [zwen64657/glm-plan-usage2](https://github.com/zwen64657/glm-plan-usage2) ——
  窗口语义映射（unit=3 → 5h、unit=6 → 周、TIME_LIMIT → MCP 月度）的实测依据；
- [schemastery](https://github.com/shigma/schemastery) 与
  [cosmokit](https://github.com/cosmokit/cosmokit)（均 MIT）—— vendor 运行时依赖。

## License

MIT
