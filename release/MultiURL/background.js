var k = Object.defineProperty;
var _ = (s, e, t) => e in s ? k(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var l = (s, e, t) => _(s, typeof e != "symbol" ? e + "" : e, t);
function v(s) {
  const e = Math.floor(s);
  return isNaN(e) || e < 1 ? {
    isValid: !1,
    value: 10,
    error: "Limit must be at least 1"
  } : e > 100 ? {
    isValid: !1,
    value: 100,
    error: "Limit cannot exceed 100"
  } : { isValid: !0, value: e };
}
function d() {
  return typeof chrome < "u" && !!chrome.runtime && typeof chrome.runtime.sendMessage == "function";
}
async function D(s, e = !1) {
  var t, i;
  if (!d() || !((t = chrome.tabs) != null && t.create))
    return console.log("[Dev Mock] Created tab for URL:", s), Math.floor(Math.random() * 1e5) + 1;
  try {
    const n = chrome.tabs.create({ url: s, active: e });
    if (n && typeof n.then == "function") {
      const r = await n;
      if (!r || r.id === void 0)
        throw new Error("Failed to create tab: no tab ID returned by browser");
      return r.id;
    }
  } catch (n) {
    if (n && ((i = n.message) != null && i.includes("tab ID")))
      throw n;
  }
  return new Promise((n, r) => {
    try {
      chrome.tabs.create({ url: s, active: e }, (a) => {
        var h;
        const c = (h = chrome.runtime) == null ? void 0 : h.lastError;
        c ? r(new Error(c.message || "Failed to create tab")) : !a || a.id === void 0 ? r(new Error("Failed to create tab: no tab ID returned by browser")) : n(a.id);
      });
    } catch (a) {
      r(new Error((a == null ? void 0 : a.message) || "Failed to call chrome.tabs.create"));
    }
  });
}
async function b(s) {
  if (!d() || !chrome.tabs) return !1;
  try {
    const e = chrome.tabs.get(s);
    if (e && typeof e.then == "function") {
      const t = await e;
      return !!t && t.id === s;
    }
  } catch {
    return !1;
  }
  return new Promise((e) => {
    try {
      chrome.tabs.get(s, (t) => {
        var i;
        (i = chrome.runtime) != null && i.lastError || !t ? e(!1) : e(t.id === s);
      });
    } catch {
      e(!1);
    }
  });
}
function w(s) {
  var t;
  if (!d() || !((t = chrome.tabs) != null && t.onRemoved)) return () => {
  };
  const e = (i) => {
    s(i);
  };
  return chrome.tabs.onRemoved.addListener(e), () => {
    chrome.tabs.onRemoved.removeListener(e);
  };
}
function P(s) {
  var t;
  if (!d() || !((t = chrome.tabs) != null && t.onUpdated)) return () => {
  };
  const e = (i, n) => {
    n.status && s(i, n.status);
  };
  return chrome.tabs.onUpdated.addListener(e), () => {
    chrome.tabs.onUpdated.removeListener(e);
  };
}
function O(s) {
  var t;
  if (!d() || !((t = chrome.tabs) != null && t.onReplaced)) return () => {
  };
  const e = (i, n) => {
    s(i, n);
  };
  return chrome.tabs.onReplaced.addListener(e), () => {
    chrome.tabs.onReplaced.removeListener(e);
  };
}
async function N(s) {
  var e;
  if (!d() || !((e = chrome.storage) != null && e.local))
    try {
      const t = localStorage.getItem(`multiurls_${s}`);
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  return new Promise((t) => {
    chrome.storage.local.get([s], (i) => {
      t(i[s] ?? null);
    });
  });
}
async function B(s, e) {
  var t;
  if (!d() || !((t = chrome.storage) != null && t.local)) {
    try {
      localStorage.setItem(`multiurls_${s}`, JSON.stringify(e));
    } catch {
    }
    return;
  }
  return new Promise((i) => {
    chrome.storage.local.set({ [s]: e }, () => i());
  });
}
function f(s, e) {
  if (!(!d() || !chrome.action))
    try {
      typeof chrome.action.setBadgeText == "function" && chrome.action.setBadgeText({ text: s || "" }), e && typeof chrome.action.setBadgeBackgroundColor == "function" && chrome.action.setBadgeBackgroundColor({ color: e });
    } catch {
    }
}
const E = "multiurls_queue_session_v1";
let I = Promise.resolve();
function W(s) {
  const e = JSON.parse(JSON.stringify(s));
  return I = I.then(async () => {
    try {
      await B(E, e);
    } catch (t) {
      console.warn("[MultiURL] Failed to save session state:", t);
    }
  }), I;
}
async function $() {
  return await N(E);
}
const y = "multiurls_tick", L = "multiurls_watchdog";
function F(s) {
  var e;
  typeof chrome < "u" && ((e = chrome.alarms) != null && e.create) && chrome.alarms.clear(y, () => {
    const t = Math.max(0.1, s / 60);
    chrome.alarms.create(y, { delayInMinutes: t });
  });
}
function m() {
  var s;
  typeof chrome < "u" && ((s = chrome.alarms) != null && s.clear) && chrome.alarms.clear(y);
}
class C {
  constructor() {
    l(this, "state");
    l(this, "timerId", null);
    l(this, "watchdogTimerId", null);
    l(this, "pendingTimerResolver", null);
    l(this, "tabRemovedUnsub", null);
    l(this, "tabReplacedUnsub", null);
    l(this, "isProcessing", !1);
    l(this, "pendingRefill", !1);
    l(this, "listeners", /* @__PURE__ */ new Set());
    l(this, "pendingLoadResolver", null);
    l(this, "currentRunId", 0);
    // Used by interval/after_load modes to signal that the alarm fired and the
    // next URL should be dispatched without waiting for the setTimeout.
    l(this, "alarmTickResolver", null);
    // Initialization gate: ensures SW restoration completes before messages/events are handled
    l(this, "isReady", !1);
    l(this, "readyPromise");
    l(this, "resolveReady");
    this.state = this.getInitialState(), this.readyPromise = new Promise((e) => {
      this.resolveReady = e;
    }), this.setupListeners(), this.init().catch((e) => {
      console.warn("[MultiURL] Controller init error:", e);
    });
  }
  async whenReady() {
    this.isReady || await this.readyPromise;
  }
  async init() {
    try {
      const e = await $();
      this.isReady = !0, this.resolveReady && this.resolveReady(), this.state.status === "idle" && e && (e.status === "running" || e.status === "paused" ? (console.log("[MultiURL] Restoring session from storage, status:", e.status), await this.restoreAndResume(e)) : this.state = { ...e });
    } catch (e) {
      console.warn("[MultiURL] Failed to load session state in init:", e), this.isReady = !0, this.resolveReady && this.resolveReady();
    }
  }
  getInitialState() {
    return {
      sessionId: "",
      status: "idle",
      mode: "open_all",
      delaySeconds: 2,
      limit: 10,
      entries: [],
      nextIndex: 0,
      managedTabIds: [],
      tabToEntryIdMap: {},
      entryOutcomes: {},
      statusMessage: "Ready to open URLs",
      updatedAt: Date.now()
    };
  }
  getState() {
    return { ...this.state };
  }
  subscribe(e) {
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  notify() {
    this.state.updatedAt = Date.now(), W(this.state).catch(
      (e) => console.warn("Failed to persist session state:", e)
    );
    for (const e of this.listeners)
      e(this.getState());
  }
  setupListeners() {
    this.tabRemovedUnsub = w((e) => {
      try {
        this.handleTabRemoved(e);
      } catch (t) {
        console.warn("[MultiURL] handleTabRemoved error:", t);
      }
    }), this.tabReplacedUnsub = O((e, t) => {
      this.handleTabReplaced(e, t);
    });
  }
  handleTabReplaced(e, t) {
    const i = this.state.managedTabIds.indexOf(t);
    if (i !== -1) {
      this.state.managedTabIds[i] = e;
      const n = this.state.tabToEntryIdMap[t];
      n && (delete this.state.tabToEntryIdMap[t], this.state.tabToEntryIdMap[e] = n), this.notify();
    }
  }
  startWatchdog() {
    var e;
    this.stopWatchdog(), typeof chrome < "u" && ((e = chrome.alarms) != null && e.create) && chrome.alarms.create(L, { periodInMinutes: 0.2 }), this.watchdogTimerId = setInterval(() => {
      this.checkAndReconcileQueue().catch(
        (t) => console.warn("[MultiURL] Watchdog reconcile error:", t)
      );
    }, 2500);
  }
  stopWatchdog() {
    var e;
    this.watchdogTimerId && (clearInterval(this.watchdogTimerId), this.watchdogTimerId = null), typeof chrome < "u" && ((e = chrome.alarms) != null && e.clear) && chrome.alarms.clear(L);
  }
  /**
   * Reconciles managed tabs against live browser tabs.
   * Cleans up dead tabs and refills queue slots if capacity opened up.
   */
  async checkAndReconcileQueue() {
    if (await this.whenReady(), this.state.status !== "running" || this.state.mode !== "queue")
      return;
    const e = [...this.state.managedTabIds], t = await Promise.all(
      e.map(async (a) => ({ id: a, alive: await b(a) }))
    ), i = [];
    for (const a of t)
      a.alive ? i.push(a.id) : delete this.state.tabToEntryIdMap[a.id];
    const n = i.length !== this.state.managedTabIds.length;
    this.state.managedTabIds = i;
    const r = this.state.entries.length - this.state.nextIndex;
    if (r === 0 && this.state.managedTabIds.length === 0) {
      this.state.status = "completed", this.state.statusMessage = "All URLs completed and managed tabs closed", this.stopWatchdog(), this.notify();
      return;
    }
    this.state.managedTabIds.length < this.state.limit && r > 0 ? await this.processNextBatch() : n && this.notify();
  }
  destroy() {
    this.currentRunId++, m(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.tabRemovedUnsub && this.tabRemovedUnsub(), this.tabReplacedUnsub && this.tabReplacedUnsub(), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.listeners.clear();
  }
  async start(e, t, i, n) {
    await this.whenReady(), this.currentRunId++, m(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1;
    const r = v(n).value, a = {};
    t.forEach((c) => {
      a[c.id] = "queued";
    }), this.state = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: "running",
      mode: e,
      delaySeconds: Math.max(0.5, i),
      limit: r,
      entries: t,
      nextIndex: 0,
      managedTabIds: [],
      tabToEntryIdMap: {},
      entryOutcomes: a,
      statusMessage: "Opening URLs...",
      startedAt: Date.now(),
      updatedAt: Date.now()
    }, e === "queue" && this.startWatchdog(), this.notify(), await this.processNextBatch();
  }
  /**
   * Restore a previously persisted session (e.g. after service worker restart)
   * and resume processing if the session was running.
   */
  async restoreAndResume(e) {
    var r;
    this.currentRunId++, m(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1;
    const i = (await Promise.all(
      (e.managedTabIds ?? []).map(async (a) => ({ id: a, alive: await b(a) }))
    )).filter((a) => a.alive).map((a) => a.id), n = {};
    for (const a of i)
      (r = e.tabToEntryIdMap) != null && r[a] && (n[a] = e.tabToEntryIdMap[a]);
    this.state = {
      ...e,
      managedTabIds: i,
      tabToEntryIdMap: n
    }, this.state.status === "running" ? (this.state.mode === "queue" && this.startWatchdog(), this.state.statusMessage = "Resuming session...", this.notify(), await this.processNextBatch()) : this.notify();
  }
  /**
   * Called by the chrome.alarms listener in index.ts when the
   * 'multiurls_tick' alarm fires. Resolves the pending wait promise so the
   * interval/after_load loop can dispatch the next URL.
   */
  async handleAlarmTick() {
    if (await this.whenReady(), console.log("[MultiURL] Alarm tick received"), this.alarmTickResolver) {
      const e = this.alarmTickResolver;
      this.alarmTickResolver = null, e();
    } else !this.isProcessing && this.state.status === "running" && this.processNextBatch().catch(
      (e) => console.error("[MultiURL] handleAlarmTick processNextBatch error:", e)
    );
  }
  pause() {
    this.state.status === "running" && (m(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.state.status = "paused", this.state.statusMessage = "Paused — Tabs remain open", this.notify());
  }
  resume() {
    this.state.status === "paused" && (this.state.status = "running", this.state.statusMessage = "Resuming...", this.state.mode === "queue" && this.startWatchdog(), this.notify(), this.processNextBatch());
  }
  stop() {
    this.currentRunId++, m(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.state.status = "stopped", this.state.statusMessage = "Stopped by user — Opened tabs preserved", this.notify();
  }
  updateLimit(e) {
    const t = v(e).value, i = this.state.limit;
    this.state.limit = t, this.notify(), this.state.status === "running" && this.state.mode === "queue" && t > i && this.processNextBatch();
  }
  handleTabRemoved(e) {
    if (!this.isReady) {
      this.whenReady().then(() => this.handleTabRemoved(e));
      return;
    }
    const t = this.state.managedTabIds.indexOf(e);
    if (t === -1)
      return;
    if (this.state.managedTabIds.splice(t, 1), delete this.state.tabToEntryIdMap[e], this.state.entries.length - this.state.nextIndex === 0 && this.state.managedTabIds.length === 0) {
      this.state.status === "running" && (this.state.status = "completed", this.state.statusMessage = "All URLs completed and managed tabs closed", this.stopWatchdog(), this.notify());
      return;
    }
    this.state.status === "running" && this.state.mode === "queue" ? this.isProcessing ? (this.pendingRefill = !0, this.notify()) : this.processNextBatch().catch(
      (n) => console.warn("[MultiURL] processNextBatch error in handleTabRemoved:", n)
    ) : this.notify();
  }
  async processNextBatch() {
    if (this.state.status === "running") {
      if (this.isProcessing) {
        this.pendingRefill = !0;
        return;
      }
      this.isProcessing = !0;
      try {
        do {
          if (this.pendingRefill = !1, this.state.status !== "running") break;
          this.state.mode === "open_all" ? await this.runOpenAll() : this.state.mode === "interval" ? await this.runInterval() : this.state.mode === "after_load" ? await this.runAfterLoad() : this.state.mode === "queue" && await this.runQueueRefill();
        } while (this.pendingRefill && this.state.status === "running");
      } finally {
        this.isProcessing = !1;
      }
    }
  }
  async dispatchUrl(e) {
    this.state.entryOutcomes[e.id] = "opening";
    try {
      const t = await D(e.normalizedUrl);
      return this.state.entryOutcomes[e.id] = "opened", t;
    } catch (t) {
      const i = t instanceof Error ? t.message : String(t);
      return console.error(`Failed to open tab for ${e.normalizedUrl}:`, i), this.state.entryOutcomes[e.id] = "failed", this.state.lastError = i, null;
    }
  }
  async runOpenAll() {
    const e = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === e && this.state.nextIndex < this.state.entries.length; ) {
      const t = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++, await this.dispatchUrl(t);
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === e && (this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  async runInterval() {
    const e = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === e && this.state.nextIndex < this.state.entries.length; ) {
      const t = this.state.entries[this.state.nextIndex];
      if (this.state.nextIndex++, await this.dispatchUrl(t), this.state.status !== "running" || this.currentRunId !== e) break;
      if (this.state.nextIndex < this.state.entries.length) {
        const i = this.state.delaySeconds;
        this.state.statusMessage = `Waiting ${i}s before next URL...`, this.notify(), F(i), await new Promise((n) => {
          this.alarmTickResolver = n, this.pendingTimerResolver = n, this.timerId = setTimeout(() => {
            this.timerId = null, this.pendingTimerResolver = null, m(), this.alarmTickResolver === n && (this.alarmTickResolver = null), n();
          }, i * 1e3);
        });
      }
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === e && (m(), this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  /**
   * Waits for a created tab to report status === 'complete' or 8s timeout safeguard.
   */
  waitForTabToLoad(e, t = 8e3) {
    return new Promise((i) => {
      var T;
      let n = !1, r = null, a = null, c = null;
      const h = () => {
        n || (n = !0, r && r(), a && a(), c && clearTimeout(c), this.pendingLoadResolver = null, i());
      };
      this.pendingLoadResolver = h, c = setTimeout(h, t), typeof chrome < "u" && ((T = chrome.tabs) != null && T.get) && chrome.tabs.get(e, (u) => {
        var R;
        !((R = chrome.runtime) != null && R.lastError) && (u == null ? void 0 : u.status) === "complete" && h();
      }), r = P((u, R) => {
        u === e && R === "complete" && h();
      }), a = w((u) => {
        u === e && h();
      });
    });
  }
  async runAfterLoad() {
    const e = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === e && this.state.nextIndex < this.state.entries.length; ) {
      const t = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++, this.state.statusMessage = `Opening (${this.state.nextIndex}/${this.state.entries.length}): ${t.normalizedUrl}`, this.notify();
      const i = await this.dispatchUrl(t);
      if (this.state.status !== "running" || this.currentRunId !== e) break;
      i && this.state.nextIndex < this.state.entries.length && (this.state.statusMessage = `Waiting for page load (${this.state.nextIndex}/${this.state.entries.length}): ${t.normalizedUrl}`, this.notify(), await this.waitForTabToLoad(i, 8e3));
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === e && (this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  async runQueueRefill() {
    const e = this.currentRunId;
    if (this.state.status !== "running" || this.currentRunId !== e) return;
    for (; this.state.status === "running" && this.currentRunId === e && this.state.managedTabIds.length < this.state.limit && this.state.nextIndex < this.state.entries.length; ) {
      const n = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;
      const r = await this.dispatchUrl(n);
      r && (this.state.managedTabIds.push(r), this.state.tabToEntryIdMap[r] = n.id);
    }
    const t = this.state.nextIndex >= this.state.entries.length, i = this.state.managedTabIds.length;
    t ? i > 0 ? this.state.statusMessage = `All URLs opened — ${i} managed tab${i > 1 ? "s" : ""} still open` : (this.state.status = "completed", this.state.statusMessage = "All URLs opened and managed tabs closed", this.stopWatchdog()) : this.state.statusMessage = `Queue running: ${i}/${this.state.limit} slots active`, this.notify();
  }
}
let p = !1;
async function S() {
  var s, e;
  if (!p && !(typeof chrome > "u" || !((s = chrome.offscreen) != null && s.createDocument)))
    try {
      if (chrome.offscreen.hasDocument && await chrome.offscreen.hasDocument()) {
        p = !0;
        return;
      }
      const t = ((e = chrome.offscreen.Reason) == null ? void 0 : e.BLOBS) ?? "BLOBS";
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [t],
        justification: "Keep queue processing active in background without popup open"
      }), p = !0, console.log("[MultiURL] Offscreen keepalive document active");
    } catch (t) {
      console.warn("[MultiURL] Offscreen keepalive notice:", t), p = !0;
    }
}
async function q() {
  var s;
  if (p = !1, !(typeof chrome > "u" || !((s = chrome.offscreen) != null && s.closeDocument)))
    try {
      chrome.offscreen.hasDocument && await chrome.offscreen.hasDocument() && (await chrome.offscreen.closeDocument(), console.log("[MultiURL] Offscreen keepalive document closed"));
    } catch (e) {
      console.warn("[MultiURL] Error closing offscreen keepalive:", e);
    }
}
console.log("[MultiURL] Background service worker initialized.");
const o = new C();
var M;
typeof chrome < "u" && ((M = chrome.alarms) != null && M.onAlarm) && chrome.alarms.onAlarm.addListener((s) => {
  s.name === "multiurls_tick" ? o.handleAlarmTick().catch(
    (e) => console.warn("[MultiURL] Alarm tick error:", e)
  ) : s.name === "multiurls_watchdog" && o.checkAndReconcileQueue().catch(
    (e) => console.warn("[MultiURL] Watchdog alarm error:", e)
  );
});
var x;
typeof chrome < "u" && ((x = chrome.runtime) != null && x.onConnect) && chrome.runtime.onConnect.addListener((s) => {
  s.name === "multiurl_keepalive" && (s.onMessage.addListener((e) => {
  }), s.onDisconnect.addListener(() => {
  }));
});
var U;
typeof chrome < "u" && ((U = chrome.runtime) != null && U.onStartup) && chrome.runtime.onStartup.addListener(async () => {
  await o.whenReady(), o.getState().status === "running" && S().catch(() => {
  });
});
let g = null;
o.subscribe((s) => {
  var e;
  if (typeof chrome < "u" && ((e = chrome.runtime) != null && e.sendMessage))
    try {
      const t = chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: s });
      t && typeof t.catch == "function" && t.catch(() => {
      });
    } catch {
    }
  if (s.status === "running" ? S().catch(() => {
  }) : (s.status === "completed" || s.status === "stopped" || s.status === "idle") && q().catch(() => {
  }), g && (clearTimeout(g), g = null), s.status === "running") {
    const t = s.entries.length - s.nextIndex, i = t > 0 ? String(t) : s.managedTabIds.length > 0 ? String(s.managedTabIds.length) : "▶";
    f(i, "#2563EB");
  } else s.status === "paused" ? f("II", "#D97706") : s.status === "completed" ? (f("✓", "#059669"), g = setTimeout(() => {
    g = null, o.getState().status === "completed" && f("", "");
  }, 8e3)) : f("", "");
});
async function Q(s) {
  switch (await o.whenReady(), s.type) {
    case "GET_STATE":
      return { success: !0, data: o.getState() };
    case "START_QUEUE":
      return await o.start(
        s.mode,
        s.entries,
        s.delaySeconds,
        s.limit
      ), { success: !0, data: o.getState() };
    case "PAUSE_QUEUE":
      return o.pause(), { success: !0, data: o.getState() };
    case "RESUME_QUEUE":
      return o.resume(), { success: !0, data: o.getState() };
    case "STOP_QUEUE":
      return o.stop(), { success: !0, data: o.getState() };
    case "UPDATE_LIMIT":
      return o.updateLimit(s.limit), { success: !0, data: o.getState() };
    default:
      return { success: !1, error: "Unknown message type" };
  }
}
var A;
typeof chrome < "u" && ((A = chrome.runtime) != null && A.onMessage) && chrome.runtime.onMessage.addListener(
  (s, e, t) => (Q(s).then(t).catch((i) => {
    console.error("[MultiURL] handleMessage error:", i), t({ success: !1, error: String(i) });
  }), !0)
);
