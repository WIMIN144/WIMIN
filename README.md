# dsh-zhipu-balance

English | [中文](README.zh.md)

**dsh-zhipu-balance** is a Zhipu (智谱 / BigModel) balance & usage panel for the
DeepSeek Harness web surface (`dsh web`), adapted from the community plugin
[dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel) (MIT) and
re-scoped to the Zhipu ecosystem.

## Features

- **Call mode** — switch between API Key (`/api/paas/v4`, pay-as-you-go) and
  Coding Plan (`/api/coding/paas/v4`, subscription quota): the host half hot-
  updates the `llm-pi-ai` provider `baseURL` through the dsh settings service,
  no restart needed; the panel shows only the matching section. "Follow
  config" leaves `settings.yaml` untouched.
- **Model usage** (top section) — fed by the console expense-bill APIs, which
  book near-real-time:
  - first row combines balance (left) and month-to-date spend (right);
  - "This month" / "Today" sub-sections list per-model tokens and settlement
    amounts, pricing tiers merged;
  - embedded **spend alert**: crossing a manual threshold (month tokens /
    month ¥) turns the tab dot amber; with "stop calls at threshold" checked,
    the host parks the call endpoint on a loopback refuse port — new calls
    fail fast at zero cost until the guard is lifted.
- **Resource packs** — balance / total / progress bar / expiry per pack;
  depleted (0 left) and expired/cancelled packs sink into a collapsed
  "已失效 (inactive)" sub-section.
- **Coding Plan** — 5-hour window, weekly window, monthly MCP lane; embedded
  warn/error percent thresholds with colored progress bars.
- **Collapsed tab** — right-edge vertical tab with a status dot: green =
  callable (balance > 0 / data healthy), amber = spend alert hit, red = guard
  active or balance exhausted, gray = unknown. Optionally **draggable** with
  position memory.

## Data sources

Undocumented console endpoints, stable in practice; all accept API Key Bearer
auth (raw-key fallback on 401):

| Endpoint | Purpose |
|---|---|
| `GET {base}/api/monitor/usage/quota/limit` | quota/packs (plain key) and plan windows (coding key) |
| `GET {base}/api/biz/tokenAccounts/list/my` | resource pack list (total / balance / frozen / expiry / status) |
| `GET {base}/api/biz/account/query-customer-account-report` | cash balance (console finance mirror) |
| `GET {base}/api/finance/chartBill/product/{YYYY-MM}` | current-month bill rows per product (tokens + settlement amount) |
| `GET {base}/api/finance/expenseBill/expenseBillListByDay?billingMonth={YYYY-MM}` | per-order daily rows (aggregated for today) |

Call-endpoint switching goes through the dsh settings service
(`settings.update("llm-pi-ai", …)` deep-merges `baseURL` only); `llm-pi-ai`
picks it up live.

## Install

```sh
dsh plugin --profile web add "link:E:/working/dsh-zhipu-balance"
# or: dsh plugin --profile web add "file:E:/working/dsh-zhipu-balance"
```

Credentials go into `$DSH_HOME/.credentials.yaml` (or same-named env vars):

```yaml
ZHIPU_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx         # API Key mode (packs / balance / bills)
ZAI_CODING_CN_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx # Coding Plan mode (optional)
```

## Configuration (optional)

All keys have defaults; override the panel row config in the profile's
`cordis.patch.yml`:

| Key | Meaning | Default |
|---|---|---|
| `refreshMs` | auto-refresh interval (≥ 5000) | `60000` |
| `apiRefs` | credential refs probed for the API row | `["ZHIPU_API_KEY", "GLM_API_KEY"]` |
| `apiBaseUrl` | upstream base (monitor/bills share it) | `https://open.bigmodel.cn` |
| `codingRefs` | credential refs probed for the coding row | `["ZAI_CODING_CN_API_KEY"]` |
| `codingBaseUrl` | coding plan base (global: `https://api.z.ai`) | `https://open.bigmodel.cn` |
| `usageDetail` | fetch model usage (month/today bills) | `true` |
| `warnPercent` / `errorPercent` | coding-window warn/error thresholds % | `70` / `90` |

Browser-side preferences (call mode, thresholds, fold states, tab position,
white background) live in `localStorage` and stay local to that browser.

## Development

```sh
npm run check   # node --check lib/index.js lib/client.js
```

Host-half changes (`lib/index.js`) need a `dsh web` restart; the client script
(`lib/client.js`) hot-reloads via dsh's built-in HMR.
