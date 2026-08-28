/**
 * dsh-zhipu-balance — client half (browser bundle, served at
 * /plugins/dsh-zhipu-balance/client.js through the `dsh.client` manifest).
 *
 * Right-edge collapsible panel for Zhipu (智谱) balances, derived from the
 * community plugin `dsh-quota-panel` (MIT) interaction model:
 *
 *   - collapsed: a slim vertical tab docked at the RIGHT edge of the window
 *     ("智谱余额" + worst-state dot). Click to expand.
 *   - expanded: a right-side drawer with per-section rows (each section title
 *     toggles its body up/down, persisted in localStorage):
 *       「资源包 · API 额度」 per resource pack (used bar, remaining/total,
 *        expiry, status; falls back to account quota windows when the pack
 *        list is unavailable)
 *       「模型用量」     24h per-model token usage (best effort)
 *       「Coding Plan」 5h / weekly / MCP-monthly usage windows with credit
 *        remaining / total amounts
 *     plus refresh (↻), settings (⚙) and collapse (▸) in the header.
 *
 * Data arrives over the loopback Connection RPC channel `/dsh-zhipu-balance`
 * (endpoints `specs` / `fetch-all`) owned by the host half; API keys never
 * reach the browser. Threshold judgement and coloring happen here from spec
 * hints. Settings persist to localStorage only. Styling follows the Harness
 * design tokens so the panel tracks the light/dark product theme.
 */
window.__ModuleLoader__.load({
	id: "dsh-zhipu-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");

		var CHANNEL = "/dsh-zhipu-balance";
		var STORAGE_KEY = "dsh-zhipu-balance:settings";
		var NS = "zhipu-balance";

		var inject = ["slots", "timer", "connection", "locale"];

		/** i18n dictionaries registered into the shell locale service. */
		var DICT = {
			zh: {
				title: "智谱余额",
				tab: "智谱余额",
				expand: "展开智谱余额面板",
				collapse: "收起",
				refresh: "刷新",
				openSettings: "设置",
				closeSettings: "关闭设置",
				sectionApi: "API 额度 · 资源包",
				sectionPacks: "资源包 · API 额度",
				cashBalance: "现金余额",
				cashAvailable: "可用 ¥{n}",
				cashRecharge: "充值 ¥{n}",
				cashGift: "赠送 ¥{n}",
				cashFrozen: "冻结 ¥{n}",
				cashCredit: "信用 ¥{n}",
				creditNotOpen: "信用未开通",
				packsEmpty: "账号下暂无资源包",
				packsFailed: "资源包查询失败",
				expiresOn: "{date} 到期",
				packGive: "赠送",
				packFrozen: "冻结 {n}",
				statusNotused: "未生效",
				statusExpired: "已过期",
				statusCancelled: "已作废",
				sectionCoding: "Coding Plan",
				sectionUsage: "模型用量 · 近 24 小时",
				apiNoData: "暂无额度条目",
				fetchFailed: "查询失败",
				loadFailed: "无法读取配置",
				noCredential: "未配置 Key",
				planLabel: "套餐",
				used: "已用 {pct}%",
				remaining: "剩 {remaining} / 共 {total}",
				remainingOnly: "剩 {remaining}",
				noWinData: "无数据",
				winRolling: "5h 窗口",
				winWeekly: "周窗口",
				winMonthly: "月度 MCP",
				resetIn: "{time}后重置",
				usageEmpty: "暂无模型用量数据",
				settingsInterval: "刷新间隔",
				settingsAutoRefresh: "自动刷新",
				followConfig: "跟随配置",
				secondsSuffix: "{n} 秒",
				minutesSuffix: "{n} 分钟",
				settingsThresholds: "预警阈值",
				warnPercent: "预警 %",
				errorPercent: "告警 %",
				sections: "显示板块",
				showApi: "API 额度",
				showCoding: "Coding Plan",
				showUsage: "模型用量",
				localOnly: "设置仅保存在本浏览器",
				resetDefaults: "恢复默认",
				updatedAt: "更新于 {time}"
			},
			en: {
				title: "Zhipu balance",
				tab: "Zhipu",
				expand: "Expand Zhipu balance panel",
				collapse: "Collapse",
				refresh: "Refresh",
				openSettings: "Settings",
				closeSettings: "Close settings",
				sectionApi: "API quota · resource packs",
				sectionPacks: "Resource packs · API quota",
				cashBalance: "Cash balance",
				cashAvailable: "avail ¥{n}",
				cashRecharge: "topped ¥{n}",
				cashGift: "gift ¥{n}",
				cashFrozen: "frozen ¥{n}",
				cashCredit: "credit ¥{n}",
				creditNotOpen: "credit not enabled",
				packsEmpty: "No resource packs on this account",
				packsFailed: "Resource pack query failed",
				expiresOn: "expires {date}",
				packGive: "gift",
				packFrozen: "frozen {n}",
				statusNotused: "not started",
				statusExpired: "expired",
				statusCancelled: "cancelled",
				sectionCoding: "Coding Plan",
				sectionUsage: "Model usage · 24h",
				apiNoData: "No quota entries",
				fetchFailed: "Query failed",
				loadFailed: "Failed to load config",
				noCredential: "Key not configured",
				planLabel: "Plan",
				used: "Used {pct}%",
				remaining: "Left {remaining} / {total}",
				remainingOnly: "Left {remaining}",
				noWinData: "no data",
				winRolling: "5h window",
				winWeekly: "Weekly",
				winMonthly: "Monthly MCP",
				resetIn: "resets in {time}",
				usageEmpty: "No model usage data",
				settingsInterval: "Refresh interval",
				settingsAutoRefresh: "Auto refresh",
				followConfig: "Follow config",
				secondsSuffix: "{n}s",
				minutesSuffix: "{n} min",
				settingsThresholds: "Thresholds",
				warnPercent: "Warn %",
				errorPercent: "Alert %",
				sections: "Sections",
				showApi: "API quota",
				showCoding: "Coding Plan",
				showUsage: "Model usage",
				localOnly: "Stored in this browser only",
				resetDefaults: "Reset defaults",
				updatedAt: "Updated {time}"
			}
		};

		// The shell overlay layer renders at z-index 20; body-mounted third-party
		// panels commonly sit at 1000+. Lift the layer so the drawer stays visible
		// (same approach as dsh-quota-panel).
		var OVERLAY_LIFT_CSS = '[class*="overlayLayer"]{z-index:1150 !important;}';

		var CSS = [
			'#dsh-zhipu-balance{font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif);font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary,#1b1b1c)}',
			'#dzb-tab{position:fixed;right:0;top:42%;transform:translateY(-50%);z-index:900;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 7px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-right:none;border-radius:10px 0 0 10px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:var(--dsw-shadow-lv2,0 4px 12px rgba(15,17,21,.08));cursor:pointer;font:inherit;letter-spacing:.14em;writing-mode:vertical-rl;color:var(--dsw-alias-label-primary,#1b1b1c);transition:background-color 120ms ease,padding-right 120ms ease;touch-action:none}',
			'#dzb-tab:hover{background:var(--dsw-alias-bg-overlay,#ebeef2);padding-right:10px}',
			'#dzb-tab .dzb-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-static-neutral-bluish-400,#adb2b8);writing-mode:horizontal-tb}',
			'#dzb-tab .dzb-dot.state-ok{background:var(--dsw-static-green-500,#22c55e)}',
			'#dzb-tab .dzb-dot.state-warn{background:var(--dsw-static-amber-500,#f59e0b)}',
			'#dzb-tab .dzb-dot.state-error{background:var(--dsw-static-red-500,#ef4444)}',
			'#dzb-panel{position:fixed;right:0;top:0;bottom:0;width:340px;max-width:92vw;z-index:900;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);border-left:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));box-shadow:var(--dsw-shadow-lv3,-8px 0 24px rgba(15,17,21,.08));animation:dzb-slide-in 180ms ease}',
			'@keyframes dzb-slide-in{from{transform:translateX(24px);opacity:.4}to{transform:translateX(0);opacity:1}}',
			'#dzb-panel .dzb-header{flex:none;display:flex;align-items:center;gap:4px;padding:12px 12px 12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06))}',
			'#dzb-panel .dzb-title{flex:1;font-weight:600;font-size:14px}',
			'#dzb-panel .dzb-icon{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;font-size:14px;line-height:1;transition:background-color 120ms ease,color 120ms ease}',
			'#dzb-panel .dzb-icon:hover{background:var(--dsw-alias-bg-overlay,#ebeef2);color:var(--dsw-alias-label-primary,#1b1b1c)}',
			'#dzb-panel .dzb-icon.is-active{background:var(--dsw-alias-bg-overlay,#ebeef2);color:var(--dsw-alias-label-primary,#1b1b1c)}',
			'#dzb-panel .dzb-icon.is-loading{pointer-events:none;opacity:.55}',
			'#dzb-panel .dzb-body{flex:1;overflow-y:auto;padding:8px 16px 16px}',
			'#dzb-panel .dzb-section{padding:10px 0 4px}',
			'#dzb-panel .dzb-section-title{display:flex;align-items:baseline;gap:6px;font-weight:600;font-size:12px;color:var(--dsw-alias-label-secondary,#61666b);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}',
			'#dzb-panel .dzb-section-title.dzb-toggle{cursor:pointer;user-select:none;border-radius:6px;padding:2px 4px;margin-left:-4px;margin-right:-4px;transition:background-color 120ms ease}',
			'#dzb-panel .dzb-section-title.dzb-toggle:hover{background:var(--dsw-alias-bg-overlay,#ebeef2)}',
			'#dzb-panel .dzb-chevron{flex:none;font-size:10px;line-height:1;transform:translateY(-1px)}',
			'#dzb-panel .dzb-plan{font-weight:400;font-size:11px;color:var(--dsw-alias-label-tertiary,#8f959c);letter-spacing:0;text-transform:none}',
			'#dzb-panel .dzb-row{padding:7px 0}',
			'#dzb-panel .dzb-row-head{display:flex;align-items:baseline;gap:8px}',
			'#dzb-panel .dzb-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
			'#dzb-panel .dzb-row-value{flex:none;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,#61666b)}',
			'#dzb-panel .dzb-row-value.state-warn{color:var(--dsw-static-amber-500,#f59e0b)}',
			'#dzb-panel .dzb-row-value.state-error{color:var(--dsw-static-red-500,#ef4444)}',
			'#dzb-panel .dzb-bar{margin-top:5px;height:4px;border-radius:2px;background:var(--dsw-alias-bg-overlay,#ebeef2);overflow:hidden}',
			'#dzb-panel .dzb-bar-fill{height:100%;border-radius:2px;background:var(--dsw-static-neutral-bluish-400,#adb2b8)}',
			'#dzb-panel .dzb-bar-fill.state-ok{background:var(--dsw-static-green-500,#22c55e)}',
			'#dzb-panel .dzb-bar-fill.state-warn{background:var(--dsw-static-amber-500,#f59e0b)}',
			'#dzb-panel .dzb-bar-fill.state-error{background:var(--dsw-static-red-500,#ef4444)}',
			'#dzb-panel .dzb-sub{margin-top:4px;font-size:11px;color:var(--dsw-alias-label-tertiary,#8f959c)}',
			'#dzb-panel .dzb-error{padding:8px 10px;border:1px solid var(--dsw-static-red-500,#ef4444);border-radius:8px;color:var(--dsw-static-red-500,#ef4444);font-size:12px;margin:6px 0;word-break:break-all}',
			'#dzb-panel .dzb-hint{padding:8px 0;font-size:12px;color:var(--dsw-alias-label-tertiary,#8f959c)}',
			'#dzb-panel .dzb-divider{height:1px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.06));margin:6px 0}',
			'#dzb-panel .dzb-footer{flex:none;padding:10px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06));font-size:11px;color:var(--dsw-alias-label-tertiary,#8f959c)}',
			'#dzb-panel .dzb-settings{padding:4px 0 12px}',
			'#dzb-panel .dzb-setting-title{font-weight:600;font-size:12px;color:var(--dsw-alias-label-secondary,#61666b);margin:12px 0 6px}',
			'#dzb-panel .dzb-setting-row{display:flex;align-items:center;gap:8px;padding:4px 0}',
			'#dzb-panel .dzb-setting-name{flex:1;font-size:12px}',
			'#dzb-panel select,#dzb-panel input[type=number]{font:inherit;font-size:12px;padding:4px 6px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#1b1b1c);width:110px}',
			'#dzb-panel input[type=checkbox]{accent-color:var(--dsw-alias-label-primary,#1b1b1c)}',
			'#dzb-panel .dzb-setting-reset{font:inherit;font-size:12px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}',
			'#dzb-panel .dzb-setting-reset:hover{background:var(--dsw-alias-bg-overlay,#ebeef2)}'
		].join("\n");

		/** Read persisted settings; always returns a fresh object. */
		function readSettings() {
			var base = { hidden: {}, collapsed: {}, refreshMs: null, warnPercent: null, errorPercent: null };
			try {
				var raw = globalThis.localStorage.getItem(STORAGE_KEY);
				if (!raw) return base;
				var parsed = JSON.parse(raw);
				if (!parsed || typeof parsed !== "object") return base;
				return {
					hidden: parsed.hidden && typeof parsed.hidden === "object" ? parsed.hidden : {},
					collapsed: parsed.collapsed && typeof parsed.collapsed === "object" ? parsed.collapsed : {},
					refreshMs: typeof parsed.refreshMs === "number" ? parsed.refreshMs : null,
					warnPercent: typeof parsed.warnPercent === "number" ? parsed.warnPercent : null,
					errorPercent: typeof parsed.errorPercent === "number" ? parsed.errorPercent : null
				};
			} catch (err) {
				return base;
			}
		}

		function writeSettings(settings) {
			try {
				globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			} catch (err) { /* storage unavailable — settings stay in memory */ }
		}

		/** Status bucket from a used-percent value and thresholds. */
		function statusOf(percent, warn, error) {
			if (percent === null || percent === undefined || !isFinite(percent)) return "muted";
			if (percent >= error) return "error";
			if (percent >= warn) return "warn";
			return "ok";
		}

		/** Thousands separators. */
		function fmtNum(value) {
			var n = Number(value);
			if (!isFinite(n)) return "?";
			return n.toLocaleString("en-US");
		}

		/** Compact token formatting (万 / 亿). */
		function fmtTokens(value) {
			var n = Number(value);
			if (!isFinite(n)) return "?";
			if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + "亿";
			if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(1) + "万";
			return String(n);
		}

		/** Human countdown until an ISO reset time. */
		function fmtCountdown(iso) {
			if (!iso) return null;
			var delta = new Date(iso).getTime() - Date.now();
			if (!isFinite(delta) || delta <= 0) return null;
			var minutes = Math.round(delta / 60000);
			if (minutes < 1) return "<1 分钟";
			if (minutes < 60) return minutes + " 分钟";
			var hours = Math.floor(minutes / 60);
			var rest = minutes % 60;
			if (hours < 48) return rest > 0 ? hours + " 小时 " + rest + " 分" : hours + " 小时";
			return Math.round(hours / 24) + " 天";
		}

		/** One quota/resource-pack entry row inside the API section. */
		function EntryRow(t, entry, warn, error) {
			var pct = entry.percent;
			var state = statusOf(pct, warn, error);
			var head = [
				React.createElement("span", { key: "label", className: "dzb-row-label", title: entry.hover || entry.label }, entry.label)
			];
			if (pct !== null && pct !== undefined) {
				head.push(React.createElement("span", { key: "value", className: "dzb-row-value state-" + state }, t("used", { pct: String(pct) })));
			} else {
				head.push(React.createElement("span", { key: "value", className: "dzb-row-value" }, "—"));
			}
			var children = [React.createElement("div", { key: "head", className: "dzb-row-head" }, head)];
			if (pct !== null && pct !== undefined) {
				children.push(React.createElement("div", { key: "bar", className: "dzb-bar" },
					React.createElement("div", { className: "dzb-bar-fill state-" + state, style: { width: Math.min(100, Math.max(0, pct)) + "%" } })));
			}
			var subBits = [];
			if (entry.remainingText !== null && entry.remainingText !== undefined) {
				subBits.push(entry.totalText !== null && entry.totalText !== undefined
					? t("remaining", { remaining: fmtNum(entry.remainingText), total: fmtNum(entry.totalText) })
					: t("remainingOnly", { remaining: fmtNum(entry.remainingText) }));
			}
			var countdown = fmtCountdown(entry.resetsAt);
			if (countdown) subBits.push(t("resetIn", { time: countdown }));
			if (subBits.length > 0) children.push(React.createElement("div", { key: "sub", className: "dzb-sub" }, subBits.join(" · ")));
			return React.createElement("div", { key: entry.label, className: "dzb-row" }, children);
		}

		/** Unit-aware pack amount: tokens compact, per-count with 次. */
		function fmtPackAmount(value, unit) {
			var n = Number(value);
			if (!isFinite(n)) return "?";
			if (unit === "times") return fmtNum(n) + " 次";
			if (unit === "tokens") return fmtTokens(n);
			return fmtNum(n);
		}

		/** Two-decimal currency formatting. */
		function fmtYuan(value) {
			var n = Number(value);
			if (!isFinite(n)) return "?";
			return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		}

		/** The cash-balance row (console 财务总览 mirror). */
		function CashRow(t, cash) {
			var head = [
				React.createElement("span", { key: "label", className: "dzb-row-label" }, t("cashBalance")),
				React.createElement("span", { key: "value", className: "dzb-row-value" }, "¥" + fmtYuan(cash.balance))
			];
			var children = [React.createElement("div", { key: "head", className: "dzb-row-head" }, head)];
			var subBits = [];
			if (cash.available !== null && cash.available !== undefined) subBits.push(t("cashAvailable", { n: fmtYuan(cash.available) }));
			if (cash.recharge !== null && cash.recharge !== undefined) subBits.push(t("cashRecharge", { n: fmtYuan(cash.recharge) }));
			if (cash.gift > 0) subBits.push(t("cashGift", { n: fmtYuan(cash.gift) }));
			if (cash.frozen > 0) subBits.push(t("cashFrozen", { n: fmtYuan(cash.frozen) }));
			if (cash.creditStatus === "NOT_OPEN" || cash.creditStatus === "CLOSED") subBits.push(t("creditNotOpen"));
			else if (cash.credit !== null && cash.credit !== undefined) subBits.push(t("cashCredit", { n: fmtYuan(cash.credit) }));
			if (subBits.length > 0) children.push(React.createElement("div", { key: "sub", className: "dzb-sub" }, subBits.join(" · ")));
			return React.createElement("div", { key: "cash", className: "dzb-row" }, children);
		}

		/** Localized status suffix for a non-effective pack. */
		function packStatusText(t, status) {
			if (status === "NOTUSED") return t("statusNotused");
			if (status === "EXPIRED") return t("statusExpired");
			if (status === "CANCELLED") return t("statusCancelled");
			return null;
		}

		/** One resource-pack row: name, used bar, balance/expiry sub-line. */
		function PackRow(t, pack, warn, error) {
			var pct = pack.percent;
			var state = statusOf(pct, warn, error);
			var hoverBits = [];
			if (pack.scene) hoverBits.push(pack.scene);
			if (pack.models) hoverBits.push(pack.models);
			var head = [
				React.createElement("span", { key: "label", className: "dzb-row-label", title: hoverBits.join("\n") || pack.name }, pack.name),
				React.createElement("span", { key: "value", className: "dzb-row-value state-" + state },
					pct === null || pct === undefined ? "—" : t("used", { pct: String(pct) }))
			];
			var children = [React.createElement("div", { key: "head", className: "dzb-row-head" }, head)];
			if (pct !== null && pct !== undefined) {
				children.push(React.createElement("div", { key: "bar", className: "dzb-bar" },
					React.createElement("div", { className: "dzb-bar-fill state-" + state, style: { width: Math.min(100, Math.max(0, pct)) + "%" } })));
			}
			var subBits = [];
			if (pack.available !== null && pack.available !== undefined && pack.total !== null && pack.total !== undefined) {
				subBits.push("剩 " + fmtPackAmount(pack.available, pack.unit) + " / " + fmtPackAmount(pack.total, pack.unit));
			} else if (pack.available !== null && pack.available !== undefined) {
				subBits.push("剩 " + fmtPackAmount(pack.available, pack.unit));
			}
			if (pack.frozen && pack.frozen > 0) subBits.push(t("packFrozen", { n: fmtPackAmount(pack.frozen, pack.unit) }));
			if (pack.expiresAt) {
				var expiryText = t("expiresOn", { date: new Date(pack.expiresAt).toLocaleDateString() });
				var countdown = fmtCountdown(pack.expiresAt);
				subBits.push(countdown && countdown.indexOf("天") >= 0 ? expiryText + "（" + countdown + "）" : expiryText);
			}
			var statusText = packStatusText(t, pack.status);
			if (statusText) subBits.push(statusText);
			else if (pack.type === "give") subBits.push(t("packGive"));
			if (subBits.length > 0) children.push(React.createElement("div", { key: "sub", className: "dzb-sub" }, subBits.join(" · ")));
			return React.createElement("div", { key: pack.name + String(pack.expiresAt ?? ""), className: "dzb-row" }, children);
		}

		/** One coding-plan window row (5h / weekly / monthly MCP). */
		function WindowRow(t, label, win, warn, error) {
			var pct = win ? win.percent : null;
			var state = statusOf(pct, warn, error);
			var head = [
				React.createElement("span", { key: "label", className: "dzb-row-label" }, label),
				React.createElement("span", { key: "value", className: "dzb-row-value state-" + state },
					pct === null || pct === undefined ? t("noWinData") : t("used", { pct: String(pct) }))
			];
			var children = [React.createElement("div", { key: "head", className: "dzb-row-head" }, head)];
			if (pct !== null && pct !== undefined) {
				children.push(React.createElement("div", { key: "bar", className: "dzb-bar" },
					React.createElement("div", { className: "dzb-bar-fill state-" + state, style: { width: Math.min(100, Math.max(0, pct)) + "%" } })));
			}
			var subBits = [];
			if (win && win.remaining !== null && win.remaining !== undefined) {
				subBits.push(win.total !== null && win.total !== undefined
					? t("remaining", { remaining: fmtNum(win.remaining), total: fmtNum(win.total) })
					: t("remainingOnly", { remaining: fmtNum(win.remaining) }));
			}
			var countdown = win ? fmtCountdown(win.resetsAt) : null;
			if (countdown) subBits.push(t("resetIn", { time: countdown }));
			if (subBits.length > 0) children.push(React.createElement("div", { key: "sub", className: "dzb-sub" }, subBits.join(" · ")));
			return React.createElement("div", { key: label, className: "dzb-row" }, children);
		}

		/**
		 * Section header with an optional plan badge. When `fold` is provided
		 * ({ key, collapsed, onToggle }) the title toggles its section body.
		 */
		function SectionTitle(label, plan, fold) {
			var children = [];
			if (fold) {
				children.push(React.createElement("span", { key: "chev", className: "dzb-chevron" }, fold.collapsed ? "▸" : "▾"));
			}
			children.push(React.createElement("span", { key: "t" }, label));
			if (plan) {
				var shown = plan.length > 40 ? plan.slice(0, 40) + "…" : plan;
				children.push(React.createElement("span", { key: "p", className: "dzb-plan" }, shown));
			}
			if (fold) {
				return React.createElement("div", {
					className: "dzb-section-title dzb-toggle",
					role: "button", tabIndex: 0, "aria-expanded": fold.collapsed ? "false" : "true",
					onClick: fold.onToggle,
					onKeyDown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fold.onToggle(); } }
				}, children);
			}
			return React.createElement("div", { className: "dzb-section-title" }, children);
		}

		/** The settings drawer body. */
		function SettingsPanel(props) {
			var t = props.t;
			var settings = props.settings;
			var onChange = props.onChange;
			var specs = props.specs;
			var REFRESH_CHOICES = ["", "15000", "30000", "60000", "120000", "300000"];
			var intervalOptions = [React.createElement("option", { key: "follow", value: "" }, t("followConfig"))];
			for (var i = 1; i < REFRESH_CHOICES.length; i++) {
				var ms = Number(REFRESH_CHOICES[i]);
				var label = ms < 60000 ? t("secondsSuffix", { n: String(ms / 1000) }) : t("minutesSuffix", { n: String(ms / 60000) });
				intervalOptions.push(React.createElement("option", { key: String(ms), value: String(ms) }, label));
			}
			var visible = specs ? specs.rows : [{ id: "api" }, { id: "coding" }];
			var sectionChecks = visible.map(function (spec) {
				var names = { api: t("showApi"), coding: t("showCoding") };
				return React.createElement("div", { key: spec.id, className: "dzb-setting-row" },
					React.createElement("span", { className: "dzb-setting-name" }, names[spec.id] || spec.id),
					React.createElement("input", {
						type: "checkbox",
						checked: !settings.hidden[spec.id],
						onChange: function (e) {
							var next = Object.assign({}, settings.hidden);
							if (e.target.checked) delete next[spec.id];
							else next[spec.id] = true;
							onChange(Object.assign({}, settings, { hidden: next }));
						}
					}));
			});
			return React.createElement("div", { className: "dzb-settings" },
				React.createElement("div", { className: "dzb-setting-title" }, t("settingsInterval")),
				React.createElement("div", { className: "dzb-setting-row" },
					React.createElement("span", { className: "dzb-setting-name" }, t("settingsAutoRefresh")),
					React.createElement("select", {
						value: settings.refreshMs === null ? "" : String(settings.refreshMs),
						onChange: function (e) {
							onChange(Object.assign({}, settings, { refreshMs: e.target.value === "" ? null : Number(e.target.value) }));
						}
					}, intervalOptions)),
				React.createElement("div", { className: "dzb-setting-title" }, t("sections")),
				sectionChecks,
				React.createElement("div", { className: "dzb-setting-title" }, t("settingsThresholds")),
				React.createElement("div", { className: "dzb-setting-row" },
					React.createElement("span", { className: "dzb-setting-name" }, t("warnPercent")),
					React.createElement("input", {
						type: "number", min: 1, max: 99,
						value: settings.warnPercent === null ? "" : String(settings.warnPercent),
						placeholder: String(props.defaults.warnPercent),
						onChange: function (e) {
							var v = Number(e.target.value);
							onChange(Object.assign({}, settings, { warnPercent: e.target.value === "" ? null : (isFinite(v) ? Math.min(99, Math.max(1, Math.round(v))) : null) }));
						}
					})),
				React.createElement("div", { className: "dzb-setting-row" },
					React.createElement("span", { className: "dzb-setting-name" }, t("errorPercent")),
					React.createElement("input", {
						type: "number", min: 1, max: 100,
						value: settings.errorPercent === null ? "" : String(settings.errorPercent),
						placeholder: String(props.defaults.errorPercent),
						onChange: function (e) {
							var v = Number(e.target.value);
							onChange(Object.assign({}, settings, { errorPercent: e.target.value === "" ? null : (isFinite(v) ? Math.min(100, Math.max(1, Math.round(v))) : null) }));
						}
					})),
				React.createElement("div", { className: "dzb-setting-row", style: { justifyContent: "space-between", marginTop: "8px" } },
					React.createElement("span", { className: "dzb-setting-name", style: { color: "var(--dsw-alias-label-tertiary,#8f959c)" } }, t("localOnly")),
					React.createElement("button", {
						className: "dzb-setting-reset", type: "button",
						onClick: function () { onChange({ hidden: {}, collapsed: {}, refreshMs: null, warnPercent: null, errorPercent: null }); }
					}, t("resetDefaults"))));
		}

		function apply(ctx) {
			ctx.effect(function () {
				var tag = document.createElement("style");
				tag.dataset.plugin = "dsh-zhipu-balance";
				tag.textContent = CSS;
				document.head.append(tag);
				var lift = document.createElement("style");
				lift.dataset.plugin = "dsh-zhipu-balance";
				lift.dataset.role = "overlay-lift";
				lift.textContent = OVERLAY_LIFT_CSS;
				document.head.append(lift);
				return function () { tag.remove(); lift.remove(); };
			}, "dsh-zhipu-balance: styles");

			function Panel(props) {
				var t = props.t;
				var specsState = React.useState(null);
				var specs = specsState[0], setSpecs = specsState[1];
				var dataState = React.useState({});
				var dataById = dataState[0], setDataById = dataState[1];
				var errState = React.useState(null);
				var loadError = errState[0], setLoadError = errState[1];
				var atState = React.useState(null);
				var fetchedAt = atState[0], setFetchedAt = atState[1];
				var expState = React.useState(false);
				var expanded = expState[0], setExpanded = expState[1];
				var setOpen = React.useState(false);
				var settingsOpen = setOpen[0], setSettingsOpen = setOpen[1];
				var refreshingState = React.useState(false);
				var refreshing = refreshingState[0], setRefreshing = refreshingState[1];
				var settingsState = React.useState(readSettings);
				var settings = settingsState[0];
				var updateSettings = function (next) {
					writeSettings(next);
					settingsState[1](next);
				};
				var warn = settings.warnPercent !== null && specs && specs.warnPercent !== undefined ? settings.warnPercent : (specs ? specs.warnPercent : 70);
				var error = settings.errorPercent !== null && specs && specs.errorPercent !== undefined ? settings.errorPercent : (specs ? specs.errorPercent : 90);
				if (settings.warnPercent !== null) warn = settings.warnPercent;
				if (settings.errorPercent !== null) error = settings.errorPercent;

				var call = function (endpoint, payload) {
					return ctx.connection.rpc.call(CHANNEL, endpoint, payload);
				};

				var loadSpecs = function () {
					return call("specs", null).then(function (result) {
						if (result && result.ok === true && result.value && Array.isArray(result.value.rows)) {
							setSpecs(result.value);
						} else {
							setLoadError(result && result.error ? result.error.message : t("loadFailed"));
						}
					}).catch(function (e) {
						setLoadError(String((e && e.message) || e));
					});
				};

				var load = function () {
					return call("fetch-all", null).then(function (result) {
						if (result && result.ok === true && result.value && Array.isArray(result.value.rows)) {
							var map = {};
							for (var i = 0; i < result.value.rows.length; i++) map[result.value.rows[i].id] = result.value.rows[i];
							setDataById(map);
							setFetchedAt(result.value.fetchedAt || Date.now());
							setLoadError(null);
						} else {
							setLoadError(result && result.error ? result.error.message : t("fetchFailed"));
						}
					}).catch(function (e) {
						setLoadError(String((e && e.message) || e));
					});
				};

				var refreshAll = function () {
					if (refreshing) return;
					setRefreshing(true);
					(specs ? Promise.resolve() : loadSpecs()).then(load).then(function () {
						setRefreshing(false);
					}, function () { setRefreshing(false); });
				};

				React.useEffect(function () { loadSpecs().then(load); }, []);

				var effectiveMs = settings.refreshMs !== null && settings.refreshMs !== undefined
					? settings.refreshMs
					: (specs ? specs.refreshMs : 60000);

				React.useEffect(function () {
					return ctx.interval(function () {
						if (!document.hidden) load();
					}, effectiveMs);
				}, [effectiveMs]);

				React.useEffect(function () {
					var onVisible = function () { if (!document.hidden) load(); };
					document.addEventListener("visibilitychange", onVisible);
					return function () { document.removeEventListener("visibilitychange", onVisible); };
				}, []);

				// ── derive view state ────────────────────────────────────
				var apiData = dataById.api;
				var codingData = dataById.coding;
				var apiView = apiData && apiData.view ? apiData.view : null;
				var apiError = apiData && apiData.error ? apiData.error : null;
				var codingView = codingData && codingData.view ? codingData.view : null;
				var codingError = codingData && codingData.error ? codingData.error : null;

				var worst = "muted";
				["ok", "warn", "error"].forEach(function (level) {
					var scan = function (pct) {
						if (statusOf(pct, warn, error) === level) worst = level;
					};
					if (apiView && !settings.hidden.api) {
						if (apiView.packs) apiView.packs.forEach(function (p) { scan(p.percent); });
						apiView.entries.forEach(function (e) { scan(e.percent); });
					}
					if (codingView && !settings.hidden.coding) {
						["rolling", "weekly", "monthly"].forEach(function (k) {
							if (codingView.windows[k]) scan(codingView.windows[k].percent);
						});
					}
				});
				if (apiError && !settings.hidden.api) worst = "error";
				if (codingError && !settings.hidden.coding && worst !== "error") worst = "warn";

				// ── collapsed: right-edge vertical tab ───────────────────
				if (!expanded) {
					return React.createElement("div", { id: "dsh-zhipu-balance" },
						React.createElement("button", {
							id: "dzb-tab", type: "button", "aria-label": t("expand"), "aria-expanded": "false",
							onClick: function () { setExpanded(true); }
						},
							React.createElement("span", { className: "dzb-dot state-" + worst }),
							React.createElement("span", null, t("tab"))));
				}

				// ── expanded: right-side drawer ──────────────────────────
				var body = [];
				if (settingsOpen) {
					body.push(React.createElement(SettingsPanel, {
						key: "settings", t: t, settings: settings, onChange: updateSettings,
						specs: specs,
						defaults: { warnPercent: specs ? specs.warnPercent : 70, errorPercent: specs ? specs.errorPercent : 90 }
					}));
				} else if (loadError !== null) {
					body.push(React.createElement("div", { key: "err", className: "dzb-error" }, String(loadError)));
				} else {
					var collapsedMap = settings.collapsed || {};
					var toggleSection = function (key) {
						var next = Object.assign({}, collapsedMap);
						if (next[key]) delete next[key];
						else next[key] = true;
						updateSettings(Object.assign({}, settings, { collapsed: next }));
					};
					var foldOf = function (key) {
						return { key: key, collapsed: !!collapsedMap[key], onToggle: function () { toggleSection(key); } };
					};
					if (!settings.hidden.api) {
						var apiChildren = [];
						var showPacks = false;
						if (apiError) {
							apiChildren.push(React.createElement("div", { key: "err", className: "dzb-error" }, apiError));
						} else if (!apiView) {
							apiChildren.push(React.createElement("div", { key: "hint", className: "dzb-hint" }, t("fetchFailed")));
						} else {
							if (apiView.cash) apiChildren.push(CashRow(t, apiView.cash));
							var packs = apiView.packs;
							if (packs && packs.length > 0) {
								showPacks = true;
								for (var pi = 0; pi < packs.length; pi++) {
									apiChildren.push(PackRow(t, packs[pi], warn, error));
								}
							} else {
								// Packs unavailable or empty: surface why, then fall back
								// to the account-level quota windows.
								if (apiView.packsError) {
									apiChildren.push(React.createElement("div", { key: "packerr", className: "dzb-error" },
										t("packsFailed") + "：" + apiView.packsError));
								} else if (packs) {
									apiChildren.push(React.createElement("div", { key: "packempty", className: "dzb-hint" }, t("packsEmpty")));
								}
								if (apiView.entries.length > 0) {
									if (apiChildren.length > 0) apiChildren.push(React.createElement("div", { key: "pdiv", className: "dzb-divider" }));
									for (var ei = 0; ei < apiView.entries.length; ei++) {
										apiChildren.push(EntryRow(t, apiView.entries[ei], warn, error));
									}
								} else if (!apiView.packsError && !packs) {
									apiChildren.push(React.createElement("div", { key: "hint", className: "dzb-hint" }, t("apiNoData")));
								}
							}
							if (apiView.detail) {
								var usageChildren = [];
								for (var m = 0; m < apiView.detail.length; m++) {
									var model = apiView.detail[m];
									usageChildren.push(React.createElement("div", { key: model.name, className: "dzb-row" },
										React.createElement("div", { className: "dzb-row-head" },
											React.createElement("span", { className: "dzb-row-label" }, model.name),
											React.createElement("span", { className: "dzb-row-value" }, fmtTokens(model.tokens)))));
								}
								body.push(React.createElement("div", { key: "usage", className: "dzb-section" },
									SectionTitle(t("sectionUsage"), null, foldOf("usage")),
									!collapsedMap.usage
										? (usageChildren.length > 0 ? usageChildren : React.createElement("div", { className: "dzb-hint" }, t("usageEmpty")))
										: null));
							}
						}
						body.push(React.createElement("div", { key: "api", className: "dzb-section" },
							SectionTitle(showPacks ? t("sectionPacks") : t("sectionApi"), apiView ? apiView.plan : null, foldOf("api")),
							!collapsedMap.api ? apiChildren : null));
					}
					if (!settings.hidden.coding) {
						var codingChildren = [];
						if (codingError) codingChildren.push(React.createElement("div", { key: "err", className: "dzb-error" }, codingError));
						else if (!codingView) codingChildren.push(React.createElement("div", { key: "hint", className: "dzb-hint" }, t("fetchFailed")));
						else {
							var winLabels = { rolling: t("winRolling"), weekly: t("winWeekly"), monthly: t("winMonthly") };
							["rolling", "weekly", "monthly"].forEach(function (k) {
								if (codingView.windows[k]) codingChildren.push(WindowRow(t, winLabels[k], codingView.windows[k], warn, error));
							});
							if (codingChildren.length === 0) codingChildren.push(React.createElement("div", { key: "hint", className: "dzb-hint" }, t("apiNoData")));
						}
						body.push(React.createElement("div", { key: "coding", className: "dzb-section" },
							SectionTitle(t("sectionCoding"), codingView ? codingView.plan : null, foldOf("coding")),
							!collapsedMap.coding ? codingChildren : null));
					}
					if (settings.hidden.api && settings.hidden.coding) {
						body.push(React.createElement("div", { key: "empty", className: "dzb-hint" }, t("loadFailed")));
					}
				}

				return React.createElement("div", { id: "dsh-zhipu-balance" },
					React.createElement("div", { id: "dzb-panel" },
						React.createElement("div", { className: "dzb-header" },
							React.createElement("div", { className: "dzb-title" }, t("title")),
							React.createElement("button", {
								className: "dzb-icon" + (refreshing ? " is-loading" : ""), type: "button",
								"aria-label": t("refresh"), disabled: refreshing,
								onClick: function () { refreshAll(); }
							}, "↻"),
							React.createElement("button", {
								className: "dzb-icon" + (settingsOpen ? " is-active" : ""), type: "button",
								"aria-label": settingsOpen ? t("closeSettings") : t("openSettings"),
								"aria-expanded": settingsOpen ? "true" : "false",
								onClick: function () { setSettingsOpen(!settingsOpen); }
							}, "⚙"),
							React.createElement("button", {
								className: "dzb-icon", type: "button", "aria-label": t("collapse"),
								onClick: function () { setExpanded(false); }
							}, "▸")),
						React.createElement("div", { className: "dzb-body" }, body),
						React.createElement("div", { className: "dzb-footer" },
							fetchedAt !== null ? t("updatedAt", { time: new Date(fetchedAt).toLocaleTimeString() }) : "")));
			}

			ctx.effect(function () {
				return ctx.locale.register(NS, DICT);
			}, "dsh-zhipu-balance: dictionaries");
			var t = ctx.locale.bind(NS);
			ctx.slots.inject("shell.overlay", function () {
				return ctx.slots.register(
					{ name: "shell.overlay", id: "dsh-zhipu-balance", order: 90, label: function () { return t("title"); }, locale: NS },
					function (props) { return React.createElement(Panel, { t: props.t }); });
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
