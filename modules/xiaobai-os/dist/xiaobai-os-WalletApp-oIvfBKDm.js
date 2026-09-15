/* eslint-disable */
import { E as ne, F as Z, H as se, J as re, K as h, M as s, P as q, Q as i, V as z, X as T, Y as M, b as k, f as _, g as r, h as b, k as ie, l as ue, m as B, o as oe, p as e, u as V, v as D, y } from "./xiaobai-os-runtime-dom.esm-bundler-BcM9c-Z9.js";
import { t as de } from "./xiaobai-os-AppDialog-CI-E933W.js";
var ce = {
  class: "wallet-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.7",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
  focusable: "false"
}, ve = ["d"], me = /* @__PURE__ */ k({
  __name: "WalletIcon",
  props: { name: {} },
  setup(t) {
    const o = {
      wallet: "M4 6h14a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v2M20 11h-5v5h5M17 13.5h.1",
      refresh: "M20 5v6h-6M4 19v-6h6M6 7a7 7 0 0 1 12-1l2 5M4 13l2 5a7 7 0 0 0 12-1",
      income: "M12 4v16m-6-6 6 6 6-6",
      expense: "M12 20V4m-6 6 6-6 6 6",
      transfer: "M3 8h18m-5-5 5 5-5 5M21 16H3m5-5-5 5 5 5",
      shop: "M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2",
      bank: "M3 8h18L12 2 3 8Zm2 3v7m7-7v7m7-7v7M3 21h18",
      tasks: "M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h3",
      game: "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm1 4h.1m9.9 0h.1M12 12h.1M7 17h.1m9.9 0h.1",
      gift: "M3 8h18v5H3V8Zm2 5v8h14v-8M12 8v13M12 8C2 8 7 0 12 8Zm0 0c10 0 5-8 0 0Z",
      receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
      next: "m9 5 7 7-7 7",
      close: "m6 6 12 12M6 18 18 6"
    };
    return (a, l) => (s(), r("svg", ce, [e("path", { d: o[t.name] || o.receipt }, null, 8, ve)]));
  }
}), $ = me, fe = { class: "wallet-ui-header" }, be = { class: "wallet-brand" }, pe = ["disabled"], he = /* @__PURE__ */ k({
  __name: "WalletAppHeader",
  props: {
    refreshing: { type: Boolean },
    disabled: { type: Boolean }
  },
  emits: ["refresh"],
  setup(t) {
    return (o, a) => (s(), r("header", fe, [
      e("span", be, [y($, { name: "wallet" })]),
      a[1] || (a[1] = e("h1", { class: "wallet-ui-title" }, "钱包", -1)),
      a[2] || (a[2] = e("span", { class: "wallet-header-context" }, "当前聊天", -1)),
      e("button", {
        type: "button",
        class: "wallet-icon-button",
        disabled: t.disabled,
        "aria-label": "刷新钱包",
        onClick: a[0] || (a[0] = (l) => o.$emit("refresh"))
      }, [y($, {
        name: "refresh",
        class: T({ "is-spinning": t.refreshing })
      }, null, 8, ["class"])], 8, pe)
    ]));
  }
}), ye = he, ge = {
  class: "wallet-pocket",
  "aria-labelledby": "wallet-balance-title"
}, we = { class: "wallet-balance" }, _e = { class: "wallet-balance-chip" }, $e = ["aria-label"], ke = {
  class: "wallet-pocket-clasp",
  "aria-hidden": "true"
}, Me = /* @__PURE__ */ k({
  __name: "WalletBalanceCard",
  props: {
    balance: {},
    currency: {},
    status: {}
  },
  setup(t) {
    const o = t, a = _(() => ({
      ready: "账目就绪",
      loading: "正在准备",
      saving: "正在保存",
      unconfirmed: "保存待确认",
      conflict: "账目已冻结",
      blocked: "暂时不可用"
    })[o.status]);
    return (l, v) => (s(), r("section", ge, [v[2] || (v[2] = e("div", {
      class: "wallet-pocket-cards",
      "aria-hidden": "true"
    }, [e("span"), e("span")], -1)), e("div", we, [
      e("header", null, [v[0] || (v[0] = e("span", { id: "wallet-balance-title" }, "可用余额", -1)), e("span", _e, [e("i", { class: T(`is-${t.status}`) }, null, 2), D(i(a.value), 1)])]),
      e("div", {
        class: "wallet-balance-value",
        "aria-label": t.status === "loading" ? "余额正在读取" : `${t.balance.toLocaleString("zh-CN")} ${t.currency}`
      }, [v[1] || (v[1] = e("small", null, "¤", -1)), e("strong", null, i(t.status === "loading" ? "—" : t.balance.toLocaleString("zh-CN")), 1)], 8, $e),
      e("footer", null, [e("span", null, i(t.currency) + " · 日常收支", 1), e("span", ke, [y($, { name: "wallet" })])])
    ])]));
  }
}), Ce = Me, We = {
  class: "wallet-ui-notice-icon",
  "aria-hidden": "true"
}, xe = { class: "wallet-ui-notice-copy" }, Be = { key: 0 }, Te = /* @__PURE__ */ k({
  __name: "WalletNotice",
  props: {
    title: {},
    message: { default: "" },
    tone: { default: "info" }
  },
  setup(t) {
    return (o, a) => (s(), r("aside", {
      class: T(["wallet-ui-notice", `is-${t.tone}`]),
      role: "status"
    }, [e("span", We, [Z(o.$slots, "icon", {}, () => [a[0] || (a[0] = D("!", -1))])]), e("div", xe, [
      e("strong", null, i(t.title), 1),
      t.message ? (s(), r("p", Be, i(t.message), 1)) : b("", !0),
      Z(o.$slots, "default")
    ])], 2));
  }
}), Se = Te, Ie = { class: "wallet-ui-empty" }, Ne = {
  key: 0,
  class: "wallet-ui-empty-icon",
  "aria-hidden": "true"
}, Ee = { key: 1 }, Ve = /* @__PURE__ */ k({
  __name: "WalletEmpty",
  props: {
    title: {},
    message: { default: "" }
  },
  setup(t) {
    return (o, a) => (s(), r("div", Ie, [
      o.$slots.icon ? (s(), r("span", Ne, [Z(o.$slots, "icon")])) : b("", !0),
      e("strong", null, i(t.title), 1),
      t.message ? (s(), r("p", Ee, i(t.message), 1)) : b("", !0)
    ]));
  }
}), De = Ve;
function Q(t) {
  return `${t.direction === "income" ? "+" : t.direction === "expense" ? "−" : ""}${t.amount.toLocaleString("zh-CN")}`;
}
var G = {
  income: "收入",
  expense: "支出",
  transfer: "系统划转"
};
function J(t) {
  return {
    economy: "gift",
    bank: "bank",
    shop: "shop",
    tasks: "tasks",
    game: "game"
  }[t.sourceDomain] || t.direction;
}
var Ae = {
  class: "wallet-row-mark",
  "aria-hidden": "true"
}, Le = { class: "wallet-row-copy" }, He = { class: "wallet-row-value" }, qe = /* @__PURE__ */ k({
  __name: "WalletTransactionRow",
  props: { transaction: {} },
  emits: ["open"],
  setup(t) {
    const o = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !1
    });
    return (a, l) => (s(), r("li", null, [e("button", {
      type: "button",
      class: T(["wallet-row", `is-${t.transaction.direction}`]),
      onClick: l[0] || (l[0] = (v) => a.$emit("open", t.transaction))
    }, [
      e("span", Ae, [y($, { name: M(J)(t.transaction) }, null, 8, ["name"])]),
      e("span", Le, [e("strong", null, i(t.transaction.title), 1), e("small", null, i(t.transaction.source) + " · " + i(M(o).format(t.transaction.createdAt)), 1)]),
      e("span", He, [e("strong", null, i(M(Q)(t.transaction)), 1), e("small", null, i(M(G)[t.transaction.direction]), 1)])
    ], 2)]));
  }
}), Fe = qe, Ze = {
  class: "wallet-filters",
  "aria-label": "账单类型"
}, ze = ["aria-pressed", "onClick"], Re = {
  key: 0,
  class: "wallet-ledger-caption"
}, Ue = {
  key: 1,
  class: "wallet-ui-empty",
  role: "status"
}, Oe = { class: "wallet-ui-list" }, je = { class: "wallet-ledger-foot" }, Qe = {
  key: 0,
  class: "wallet-load-error",
  role: "alert"
}, Ge = ["disabled"], Je = {
  key: 2,
  class: "wallet-ledger-end"
}, Ke = /* @__PURE__ */ k({
  __name: "WalletTransactionList",
  props: {
    transactions: {},
    hasMore: { type: Boolean },
    loadingMore: { type: Boolean },
    loading: { type: Boolean },
    error: {}
  },
  emits: ["loadMore", "open"],
  setup(t) {
    const o = t, a = h("all"), l = [
      {
        id: "all",
        label: "全部"
      },
      {
        id: "income",
        label: "收入"
      },
      {
        id: "expense",
        label: "支出"
      },
      {
        id: "transfer",
        label: "划转"
      }
    ], v = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }), C = _(() => {
      const p = [];
      for (const d of o.transactions) {
        if (a.value !== "all" && d.direction !== a.value) continue;
        const c = v.format(d.createdAt), g = p.at(-1);
        g?.date === c ? g.transactions.push(d) : p.push({
          date: c,
          transactions: [d]
        });
      }
      return p;
    });
    return (p, d) => (s(), r("div", null, [
      e("div", Ze, [(s(), r(V, null, q(l, (c) => e("button", {
        key: c.id,
        type: "button",
        "aria-pressed": a.value === c.id,
        onClick: (g) => a.value = c.id
      }, i(c.label), 9, ze)), 64))]),
      a.value === "transfer" ? (s(), r("p", Re, "系统账户间的划转，不计入你的个人收支。")) : b("", !0),
      t.loading ? (s(), r("div", Ue, [y($, {
        name: "refresh",
        class: "is-spinning"
      }), d[2] || (d[2] = e("strong", null, "正在准备你的钱包…", -1))])) : (s(), r(V, { key: 2 }, [
        C.value.length ? b("", !0) : (s(), B(De, {
          key: 0,
          title: t.hasMore ? "已加载的账目中暂无匹配项" : "这里还没有账目",
          message: "每一笔已确认的资金流动，都会记在这里。"
        }, {
          icon: z(() => [y($, { name: "receipt" })]),
          _: 1
        }, 8, ["title"])),
        (s(!0), r(V, null, q(C.value, (c) => (s(), r("section", {
          key: c.transactions[0].id,
          class: "wallet-day-group"
        }, [e("h3", null, i(c.date), 1), e("ol", Oe, [(s(!0), r(V, null, q(c.transactions, (g) => (s(), B(Fe, {
          key: g.id,
          transaction: g,
          onOpen: d[0] || (d[0] = (x) => p.$emit("open", x))
        }, null, 8, ["transaction"]))), 128))])]))), 128)),
        e("div", je, [t.error ? (s(), r("p", Qe, i(t.error), 1)) : b("", !0), t.hasMore ? (s(), r("button", {
          key: 1,
          type: "button",
          class: "wallet-ui-text-button",
          disabled: t.loadingMore,
          onClick: d[1] || (d[1] = (c) => p.$emit("loadMore"))
        }, [D(i(t.loadingMore ? "正在读取…" : "查看更早的账单"), 1), y($, { name: "next" })], 8, Ge)) : t.transactions.length ? (s(), r("span", Je, "每一笔，都有来处")) : b("", !0)])
      ], 64))
    ]));
  }
}), Pe = Ke, Xe = { class: "wallet-row-mark" }, Ye = {
  key: 0,
  class: "wallet-receipt-note"
}, et = {
  key: 0,
  class: "wallet-ledger-caption"
}, tt = /* @__PURE__ */ k({
  __name: "WalletTransactionDetail",
  props: { transaction: {} },
  emits: ["close"],
  setup(t) {
    const o = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: !1
    });
    return (a, l) => (s(), B(de, {
      class: "wallet-receipt",
      "aria-label": "账单详情",
      onClose: l[1] || (l[1] = (v) => a.$emit("close"))
    }, {
      default: z(() => [
        e("header", null, [l[2] || (l[2] = e("span", null, "账单详情", -1)), e("button", {
          type: "button",
          class: "wallet-icon-button",
          "aria-label": "关闭账单详情",
          autofocus: "",
          onClick: l[0] || (l[0] = (v) => a.$emit("close"))
        }, [y($, { name: "close" })])]),
        e("div", { class: T(["wallet-receipt-hero", `is-${t.transaction.direction}`]) }, [
          e("span", Xe, [y($, { name: M(J)(t.transaction) }, null, 8, ["name"])]),
          e("h2", null, i(t.transaction.title), 1),
          e("strong", null, [D(i(M(Q)(t.transaction)), 1), l[3] || (l[3] = e("small", null, "小白币", -1))]),
          e("span", null, i(M(G)[t.transaction.direction]), 1)
        ], 2),
        e("dl", null, [
          e("div", null, [l[4] || (l[4] = e("dt", null, "来自", -1)), e("dd", null, i(t.transaction.source), 1)]),
          e("div", null, [l[5] || (l[5] = e("dt", null, "发生时间", -1)), e("dd", null, i(M(o).format(t.transaction.createdAt)), 1)]),
          e("div", null, [l[6] || (l[6] = e("dt", null, "账目序号", -1)), e("dd", null, "#" + i(t.transaction.sequence), 1)]),
          t.transaction.note ? (s(), r("div", Ye, [l[7] || (l[7] = e("dt", null, "备注", -1)), e("dd", null, i(t.transaction.note), 1)])) : b("", !0)
        ]),
        t.transaction.direction === "transfer" ? (s(), r("p", et, "这笔资金在系统账户之间流转，不是你的收入或支出。")) : b("", !0),
        l[8] || (l[8] = e("footer", null, "小白 OS · 当前聊天账本", -1))
      ]),
      _: 1
    }));
  }
}), at = tt, lt = { class: "wallet-ui-app wallet-app" }, nt = { class: "wallet-ui-scroll" }, st = {
  class: "wallet-balance-editor",
  "aria-label": "修改小白币余额"
}, rt = ["disabled"], it = ["disabled"], ut = { class: "wallet-balance-actions" }, ot = ["disabled"], dt = ["disabled"], ct = {
  key: 0,
  role: "alert"
}, vt = {
  key: 2,
  role: "status"
}, mt = ["disabled"], ft = ["disabled"], bt = {
  class: "wallet-ledger",
  "aria-labelledby": "wallet-ledger-title"
}, pt = { class: "wallet-ui-section-title" }, F = 35e3, ht = /* @__PURE__ */ k({
  __name: "WalletApp",
  props: {
    bridge: {},
    initialState: {}
  },
  setup(t) {
    const o = t, a = h(structuredClone(re(o.initialState))), l = h(!1), v = h(!1), C = h(!1), p = h(""), d = h(!1), c = h(""), g = h("");
    let x = !0;
    const w = h(""), S = h(""), I = h(null);
    let R = () => {
    }, m = 0;
    const N = _(() => a.value.status === "unconfirmed"), W = _(() => d.value || l.value || a.value.status === "loading" || a.value.status === "saving"), U = _(() => /^\d+$/.test(p.value.trim()) && Number.isSafeInteger(Number(p.value))), O = _(() => W.value || N.value || a.value.status === "conflict"), K = _(() => !!(a.value.message || w.value)), P = _(() => w.value || a.value.status === "conflict" || a.value.status === "blocked" ? "danger" : N.value ? "warning" : "info"), X = _(() => a.value.status === "conflict" ? "账本发生冲突" : a.value.status === "blocked" ? "钱包暂时无法读取" : "账本状态");
    function A(u) {
      const n = u instanceof Error ? u.message : String(u);
      return n.includes("聊天已切换") ? "聊天已切换，请重新打开钱包。" : n === "host_request_timeout" ? "读取等待超时，请稍后重新读取。" : "钱包数据暂时无法读取，请稍后重试。";
    }
    function L() {
      return { chatIdentity: a.value.chatIdentity };
    }
    function Y() {
      p.value = String(a.value.balance), c.value = "", g.value = "", C.value = !0;
    }
    async function ee() {
      if (W.value || a.value.status !== "ready" || !U.value) return;
      const u = a.value.chatIdentity;
      d.value = !0, c.value = "";
      try {
        const n = await o.bridge.request("wallet/set-balance", {
          chatIdentity: u,
          balance: Number(p.value),
          expectedBalance: a.value.balance,
          expectedTransactionCount: a.value.transactionCount,
          actionId: crypto.randomUUID()
        }, F);
        if (!x || u !== a.value.chatIdentity) return;
        E(n.result), C.value = !1, g.value = "余额已保存";
      } catch (n) {
        if (!x || u !== a.value.chatIdentity) return;
        const f = n instanceof Error ? n.message : String(n);
        c.value = f.includes("余额") || f.includes("聊天") ? f : "修改未确认，请重新读取或核实保存结果后再试。";
      } finally {
        x && (d.value = !1);
      }
    }
    function E(u) {
      a.value = structuredClone(u), l.value = !1, v.value = !1, w.value = "", S.value = "";
    }
    async function j() {
      if (W.value || N.value || a.value.status === "conflict") return;
      const u = ++m;
      l.value = !0, w.value = "";
      try {
        const n = await o.bridge.request("wallet/refresh", L(), F);
        u === m && E(n.result);
      } catch (n) {
        u === m && (w.value = A(n));
      } finally {
        u === m && (l.value = !1);
      }
    }
    async function te() {
      if (W.value) return;
      const u = ++m;
      l.value = !0, w.value = "";
      try {
        const n = await o.bridge.request("wallet/confirm-save", L(), F);
        u === m && E(n.result.state);
      } catch (n) {
        u === m && (w.value = A(n));
      } finally {
        u === m && (l.value = !1);
      }
    }
    async function ae() {
      const u = a.value.nextCursor;
      if (!u || v.value || W.value) return;
      const n = m;
      v.value = !0, S.value = "";
      try {
        const f = await o.bridge.request("wallet/load-more", {
          ...L(),
          beforeSequence: u
        });
        if (n !== m) return;
        const le = new Set(a.value.transactions.map((H) => H.id));
        a.value.transactions.push(...f.result.transactions.filter((H) => !le.has(H.id))), a.value.nextCursor = f.result.nextCursor, a.value.hasMore = f.result.hasMore;
      } catch {
        n === m && (S.value = "更多流水暂时无法读取，请稍后重试。");
      } finally {
        n === m && (v.value = !1);
      }
    }
    return ie(() => {
      R = o.bridge.subscribe((u) => {
        u.type === "wallet/state" && (m += 1, E(u.payload.state)), u.type === "wallet/error" && (w.value = A(u.payload?.message || ""));
      });
    }), ne(() => {
      x = !1, m += 1, R();
    }), (u, n) => (s(), r("main", lt, [
      y(ye, {
        refreshing: l.value,
        disabled: O.value,
        onRefresh: j
      }, null, 8, ["refreshing", "disabled"]),
      e("div", nt, [
        y(Ce, {
          balance: a.value.balance,
          currency: a.value.currency,
          status: a.value.status
        }, null, 8, [
          "balance",
          "currency",
          "status"
        ]),
        e("section", st, [C.value ? (s(), r("form", {
          key: 1,
          onSubmit: ue(ee, ["prevent"])
        }, [
          n[4] || (n[4] = e("label", { for: "wallet-new-balance" }, "新的小白币余额", -1)),
          se(e("input", {
            id: "wallet-new-balance",
            "onUpdate:modelValue": n[0] || (n[0] = (f) => p.value = f),
            type: "text",
            inputmode: "numeric",
            autocomplete: "off",
            disabled: d.value,
            "aria-describedby": "wallet-balance-help"
          }, null, 8, it), [[oe, p.value]]),
          n[5] || (n[5] = e("small", { id: "wallet-balance-help" }, "输入 0 或正整数，保存后立即生效。", -1)),
          e("div", ut, [e("button", {
            type: "submit",
            class: "wallet-ui-text-button",
            disabled: !U.value || W.value || a.value.status !== "ready"
          }, i(d.value ? "正在保存…" : "保存余额"), 9, ot), e("button", {
            type: "button",
            class: "wallet-ui-text-button",
            disabled: d.value,
            onClick: n[1] || (n[1] = (f) => C.value = !1)
          }, "取消", 8, dt)]),
          c.value ? (s(), r("p", ct, i(c.value), 1)) : b("", !0)
        ], 32)) : (s(), r("button", {
          key: 0,
          type: "button",
          class: "wallet-ui-text-button",
          disabled: W.value || a.value.status !== "ready",
          onClick: Y
        }, " 修改余额 ", 8, rt)), g.value ? (s(), r("small", vt, i(g.value), 1)) : b("", !0)]),
        K.value ? (s(), B(Se, {
          key: 0,
          class: "wallet-notice",
          tone: P.value,
          title: X.value,
          message: w.value || a.value.message
        }, {
          default: z(() => [N.value ? (s(), r("button", {
            key: 0,
            type: "button",
            class: "wallet-ui-text-button",
            disabled: l.value,
            onClick: te
          }, i(l.value ? "正在核实…" : "核实保存结果"), 9, mt)) : a.value.status === "blocked" || w.value ? (s(), r("button", {
            key: 1,
            type: "button",
            class: "wallet-ui-text-button",
            disabled: O.value,
            onClick: j
          }, i(l.value ? "正在读取…" : "重新读取"), 9, ft)) : b("", !0)]),
          _: 1
        }, 8, [
          "tone",
          "title",
          "message"
        ])) : b("", !0),
        e("section", bt, [e("div", pt, [n[6] || (n[6] = e("h2", { id: "wallet-ledger-title" }, "收支账单", -1)), e("small", null, "共 " + i(a.value.transactionCount) + " 笔", 1)]), y(Pe, {
          transactions: a.value.transactions,
          "has-more": a.value.hasMore,
          "loading-more": v.value,
          loading: a.value.status === "loading",
          error: S.value,
          onLoadMore: ae,
          onOpen: n[2] || (n[2] = (f) => I.value = f)
        }, null, 8, [
          "transactions",
          "has-more",
          "loading-more",
          "loading",
          "error"
        ])])
      ]),
      I.value ? (s(), B(at, {
        key: 0,
        transaction: I.value,
        onClose: n[3] || (n[3] = (f) => I.value = null)
      }, null, 8, ["transaction"])) : b("", !0)
    ]));
  }
}), wt = ht;
export {
  wt as default
};
