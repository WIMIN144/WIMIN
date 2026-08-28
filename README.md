# dsh-zhipu-balance

English | [中文](README.zh.md)

**dsh-zhipu-balance** is a Zhipu (智谱 / BigModel) balance & usage panel for the
DeepSeek Harness web surface (`dsh web`), adapted from the community plugin
[dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel) (MIT) and
re-scoped to the Zhipu ecosystem:

- **Resource packs · API quota** — cash balance (console 财务总览 mirror:
  current / available / recharged / gift) plus per resource pack: balance /
  total / used bar / expiry (the console "我的资源包" list; falls back to
  account-level quota windows when the pack list is unavailable);
- **Coding Plan** — GLM Coding Plan 5-hour window, weekly window, monthly MCP
  lane usage;
- **Model usage** — best-effort per-model token usage over the last 24h.

The panel docks at the far RIGHT edge of the window: collapsed it is a slim
vertical tab (with a worst-state dot); clicking expands a right-side drawer;
▸ collapses again.

## Data sources

Endpoints verified by community tooling ([pi-glm-usage](https://github.com/frederick-wang/pi-glm-usage),
[glm-plan-usage2](https://github.com/zwen64657/glm-plan-usage2),
[dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel)) plus this
plugin's own probing (undocumented but stable):

| Endpoint | Purpose |
|---|---|
| `GET {base}/api/monitor/usage/quota/limit` | quota windows (API key) and plan windows (coding key) |
| `GET {base}/api/monitor/usage/model-usage?startTime=..&endTime=..` | per-model usage (naive Asia/Shanghai window params) |
| `GET {base}/api/biz/tokenAccounts/list/my?pageNum=1&pageSize=100&filterEnabled=false` | the console 资源包管理 backing API: per-pack total/balance/frozen/expiry (accepts API-key auth, verified live) |
| `GET {base}/api/biz/account/query-customer-account-report` | the console 财务总览 backing API: cash balance (current/available/recharged/gift/spend/frozen/credit) |

- Cash balance (¥) comes from the console 财务总览 reverse-engineered endpoint
  (first documented by this plugin; accepts API-key auth, verified live):
  `balance` = current, `availableBalance` = available, `rechargeAmount` =
  recharged, `giveAmount` = gift, `totalSpendAmount` = spend,
  `frozenBalance` = frozen, `creditStatus` = credit state.
- Pack row semantics (verified live): `tokensMagnitude` = total,
  `availableBalance` = spendable, `frozenBalance` = frozen,
  `consumeType` = TOKENS/TIMES, `status` = EFFECTIVE/NOTUSED/EXPIRED/CANCELLED.
  Used = total − available; only EFFECTIVE packs drive the status dot.
- The API key and the Coding Plan key hit the same quota endpoint with
  different field shapes; the plugin normalizes each kind separately.
- Auth is `Bearer <key>` first, falling back to the raw key on 401 (matching
  community tooling).

## Configuration needed

Store the keys in `$DSH_HOME/.credentials.yaml` (Windows default
`C:\Users\<you>\.dsh\.credentials.yaml`), version-1 layout:

```yaml
version: 1
refs:
  # Zhipu open-platform API key (open.bigmodel.cn → API Keys)
  ZHIPU_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx

  # GLM Coding Plan key (mainland; optional — the Coding Plan section shows a
  # not-configured error when absent, other sections keep working)
  ZAI_CODING_CN_API_KEY: xxxxxxxx.xxxxxxxxxxxxxxxx
```

Environment variables with the same names also work. Every refresh cycle
re-resolves credentials, so adding a key later needs no restart; the first
install does.

## Install

```sh
# link install from this directory (live source; edits apply after restart)
dsh plugin --profile web add "link:E:/working/dsh-zhipu-balance"

# or a file (snapshot) install
dsh plugin --profile web add "file:E:/working/dsh-zhipu-balance"

# restart dsh web (bundle layer and client module graph activate at boot)
```

The install command appends the package to the profile's `dsh.profile.bundles`;
the package's `cordis.patch.yml` mounts as a profile patch layer (row
`zhipu-balance`).

## Config (optional)

Every key has a default; override in the profile's `cordis.patch.yml`:

| Key | Meaning | Default |
|---|---|---|
| `refreshMs` | auto-refresh interval (≥ 5000) | `60000` |
| `apiRefs` | credential refs probed for the API row | `["ZHIPU_API_KEY", "GLM_API_KEY"]` |
| `apiBaseUrl` | upstream base for the API row | `https://open.bigmodel.cn` |
| `codingRefs` | credential refs probed for the Coding Plan row | `["ZAI_CODING_CN_API_KEY"]` |
| `codingBaseUrl` | Coding Plan upstream (global: `https://api.z.ai` + refs `ZAI_API_KEY`) | `https://open.bigmodel.cn` |
| `usageDetail` | fetch 24h per-model usage detail | `true` |
| `warnPercent` / `errorPercent` | usage warn/alert thresholds | `70` / `90` |

The in-panel ⚙ settings (browser localStorage only): refresh interval, section
visibility, threshold overrides, reset.

## Architecture & security

```
┌────────────── browser (lib/client.js) ──────────────┐
│  shell.overlay slot → right-edge tab / right drawer │
│  localStorage: interval · sections · thresholds     │
└──────────────┬──────────────────────────────────────┘
               │ loopback-only Connection RPC: /dsh-zhipu-balance
               │   specs (render hints, no credentials)
               │   fetch-all → normalized views
┌──────────────▼──────────────────────────────────────┐
│  host (lib/index.js)                                │
│  ctx.credentials → API keys (never reach browser)   │
│  Bearer (401 → raw key) → Zhipu endpoints           │
│  normalization → api / coding views + usage detail  │
└─────────────────────────────────────────────────────┘
```

- Keys resolve host-side only via `ctx.credentials`; the browser receives
  normalized views;
- the RPC channel is `{authority: 'loopback'}`;
- raw upstream JSON never leaves the host; one row failing never breaks the other;
- zero npm runtime dependencies (schemastery + cosmokit vendored, both MIT).

## Known limits

- the cash-balance endpoint is reverse-engineered from the console
  (undocumented): if Zhipu changes the `/api/biz/*` paths or fields, the cash
  row hides itself and every other section keeps working;
- `limits[]` field shapes vary by key type/account: the plugin normalizes
  `percentage`, `remaining`+`number`, and `currentValue`+`usage` shapes and
  puts raw fields into the hover tooltip; unrecognized shapes render as `—`;
- model usage detail is best-effort: shows "no data" when unavailable.

## Credits

- [wenzetan/dsh-quota-panel](https://github.com/wenzetan/dsh-quota-panel) —
  the direct blueprint (dual-face architecture, RPC contract, slot
  registration, settings UX; MIT);
- [frederick-wang/pi-glm-usage](https://github.com/frederick-wang/pi-glm-usage) —
  endpoint auth scheme and response semantics;
- [zwen64657/glm-plan-usage2](https://github.com/zwen64657/glm-plan-usage2) —
  window semantics (unit=3 → 5h, unit=6 → weekly, TIME_LIMIT → monthly MCP);
- [schemastery](https://github.com/shigma/schemastery) and
  [cosmokit](https://github.com/cosmokit/cosmokit) (both MIT) — vendored deps.

## License

MIT
