# dsh-zhipu-balance

[English](README.md) | 中文

**dsh-zhipu-balance** 是 DeepSeek Harness（DSH）网页端（`dsh web`）的**智谱余额/用量面板**，
魔改自社区成熟插件 [dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel)（MIT）
并重新聚焦智谱生态。

## 功能

- **调用模式** — 在 API Key（`/api/paas/v4`，按量计费）与 Coding Plan
  （`/api/coding/paas/v4`，订阅额度）之间一键切换：宿主端经 dsh settings 服务
  热更新 `llm-pi-ai` 的 provider `baseURL`，无需重启；面板同步只显示对应板块。
  「跟随配置」不改动 `settings.yaml`。
- **模型用量**（面板首节）— 数据取自控制台账单接口，实时出账：
  - 首行合并显示 余额（左）与 当月消费（右）；
  - 「当月」「当日」子节按模型合并计费档位，列出 tokens 与结算金额；
  - 内嵌 **API 消耗预警** 配置：达到手动阈值（当月 Token / 当月消费 ¥）状态点变黄，
    勾选「达到阈值同步停止调用」后，宿主端把调用地址临时指向本机拒绝端口——
    新调用立即失败、不计费，解除后自动恢复。
- **资源包** — 每个资源包的余额/总量/进度条/到期时间；已用完或已过期/已作废的包
  沉到底部「已失效」子节，默认折叠。
- **Coding Plan** — 5 小时窗口、周窗口、月度 MCP 车道用量；内嵌**预警阈值**
  （预警 % / 告警 %）配置，着色进度条。
- **折叠条** — 贴右缘竖排标签，状态点：绿=可调用（余额 > 0 / 数据正常），
  黄=达到消耗预警，红=守卫停用或余额耗尽，灰=数据未知。设置里可开启**拖动**，
  位置记忆。

## 数据来源

控制台逆向接口（未公开文档化但稳定；实测均接受 API Key Bearer 认证，
401 时自动回退裸 Key）：

| 端点 | 用途 |
|---|---|
| `GET {base}/api/monitor/usage/quota/limit` | 额度/资源包（普通 Key）与套餐窗口（Coding Key） |
| `GET {base}/api/biz/tokenAccounts/list/my` | 资源包列表（总量/余额/冻结/到期/状态） |
| `GET {base}/api/biz/account/query-customer-account-report` | 现金余额（财务总览口径） |
| `GET {base}/api/finance/chartBill/product/{YYYY-MM}` | 当月账单按产品行（tokens + 结算金额） |
| `GET {base}/api/finance/expenseBill/expenseBillListByDay?billingMonth={YYYY-MM}` | 按订单日明细（当日内汇总） |

模型调用地址切换通过 dsh settings 服务（`settings.update("llm-pi-ai", …)` 深合并
只改 `baseURL`），`llm-pi-ai` 热监听即时生效。

## 安装

```sh
# 从本仓库目录以 link 方式安装（源码即生效副本，宿主端改完重启 dsh web 即可）
dsh plugin --profile web add "link:E:/working/dsh-zhipu-balance"

# 或者以 file 方式安装（复制快照进 profile）
dsh plugin --profile web add "file:E:/working/dsh-zhipu-balance"
```

需要的凭据写进 `$DSH_HOME/.credentials.yaml`（Windows 默认
`C:\Users\<你>\.dsh\.credentials.yaml`，也支持同名环境变量）：

```yaml
ZHIPU_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx         # API Key 模式（资源包/余额/账单）
ZAI_CODING_CN_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx # Coding Plan 模式（没有可省略）
```

## 配置（可选）

所有键都有默认值，可在 profile 的 `cordis.patch.yml` 里覆盖面板行配置：

| 键 | 含义 | 默认值 |
|---|---|---|
| `refreshMs` | 自动刷新间隔（≥ 5000） | `60000` |
| `apiRefs` | API 行探测的凭据引用名 | `["ZHIPU_API_KEY", "GLM_API_KEY"]` |
| `apiBaseUrl` | API 行上游基址（监控/账单同源） | `https://open.bigmodel.cn` |
| `codingRefs` | Coding Plan 行探测的凭据引用名 | `["ZAI_CODING_CN_API_KEY"]` |
| `codingBaseUrl` | Coding Plan 上游基址（国际站填 `https://api.z.ai`） | `https://open.bigmodel.cn` |
| `usageDetail` | 是否拉取模型用量（当月/当日账单） | `true` |
| `warnPercent` / `errorPercent` | Coding 窗口预警/告警阈值 % | `70` / `90` |

浏览器端偏好（调用模式、预警阈值、折叠状态、拖动位置、白色背景等）存
`localStorage`，仅本浏览器生效。

## 开发

```sh
npm run check   # node --check lib/index.js lib/client.js
```

宿主端 `lib/index.js` 改动需重启 `dsh web`；前端 `lib/client.js` 由 dsh 内置
HMR 自动热替换。
