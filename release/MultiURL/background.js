var x = Object.defineProperty;
var A = (s, t, e) => t in s ? x(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var l = (s, t, e) => A(s, typeof t != "symbol" ? t + "" : t, e);
function y(s) {
  const t = Math.floor(s);
  return isNaN(t) || t < 1 ? {
    isValid: !1,
    value: 10,
    error: "Limit must be at least 1"
  } : t > 100 ? {
    isValid: !1,
    value: 100,
    error: "Limit cannot exceed 100"
  } : { isValid: !0, value: t };
}
function u() {
  return typeof chrome < "u" && !!chrome.runtime && typeof chrome.runtime.sendMessage == "function";
}
async function E(s, t = !1) {
  var e;
  if (!u() || !chrome.tabs)
    return console.log("[Dev Mock] Created tab for URL:", s), Math.floor(Math.random() * 1e5) + 1;
  try {
    const i = chrome.tabs.create({ url: s, active: t });
    if (i && typeof i.then == "function") {
      const a = await i;
      if (!a || a.id === void 0)
        throw new Error("Failed to create tab: no tab ID returned by browser");
      return a.id;
    }
  } catch (i) {
    if (i && ((e = i.message) != null && e.includes("tab ID")))
      throw i;
  }
  return new Promise((i, a) => {
    try {
      chrome.tabs.create({ url: s, active: t }, (n) => {
        var h;
        const o = (h = chrome.runtime) == null ? void 0 : h.lastError;
        o ? a(new Error(o.message || "Failed to create tab")) : !n || n.id === void 0 ? a(new Error("Failed to create tab: no tab ID returned by browser")) : i(n.id);
      });
    } catch (n) {
      a(new Error((n == null ? void 0 : n.message) || "Failed to call chrome.tabs.create"));
    }
  });
}
async function S(s) {
  if (!u() || !chrome.tabs) return !1;
  try {
    const t = chrome.tabs.get(s);
    if (t && typeof t.then == "function") {
      const e = await t;
      return !!e && e.id === s;
    }
  } catch {
    return !1;
  }
  return new Promise((t) => {
    try {
      chrome.tabs.get(s, (e) => {
        var i;
        (i = chrome.runtime) != null && i.lastError || !e ? t(!1) : t(e.id === s);
      });
    } catch {
      t(!1);
    }
  });
}
function T(s) {
  var e;
  if (!u() || !((e = chrome.tabs) != null && e.onRemoved)) return () => {
  };
  const t = (i) => {
    s(i);
  };
  return chrome.tabs.onRemoved.addListener(t), () => {
    chrome.tabs.onRemoved.removeListener(t);
  };
}
function _(s) {
  var e;
  if (!u() || !((e = chrome.tabs) != null && e.onUpdated)) return () => {
  };
  const t = (i, a) => {
    a.status && s(i, a.status);
  };
  return chrome.tabs.onUpdated.addListener(t), () => {
    chrome.tabs.onUpdated.removeListener(t);
  };
}
function k(s) {
  var e;
  if (!u() || !((e = chrome.tabs) != null && e.onReplaced)) return () => {
  };
  const t = (i, a) => {
    s(i, a);
  };
  return chrome.tabs.onReplaced.addListener(t), () => {
    chrome.tabs.onReplaced.removeListener(t);
  };
}
async function P(s) {
  var t;
  if (!u() || !((t = chrome.storage) != null && t.local))
    try {
      const e = localStorage.getItem(`multiurls_${s}`);
      return e ? JSON.parse(e) : null;
    } catch {
      return null;
    }
  return new Promise((e) => {
    chrome.storage.local.get([s], (i) => {
      e(i[s] ?? null);
    });
  });
}
async function D(s, t) {
  var e;
  if (!u() || !((e = chrome.storage) != null && e.local)) {
    try {
      localStorage.setItem(`multiurls_${s}`, JSON.stringify(t));
    } catch {
    }
    return;
  }
  return new Promise((i) => {
    chrome.storage.local.set({ [s]: t }, () => i());
  });
}
const U = "multiurls_queue_session_v1";
let p = Promise.resolve();
function N(s) {
  const t = JSON.parse(JSON.stringify(s));
  return p = p.then(async () => {
    try {
      await D(U, t);
    } catch (e) {
      console.warn("[MultiURL] Failed to save session state:", e);
    }
  }), p;
}
async function O() {
  return await P(U);
}
const R = "multiurls_tick", w = "multiurls_watchdog";
function W(s) {
  var t;
  typeof chrome < "u" && ((t = chrome.alarms) != null && t.create) && chrome.alarms.clear(R, () => {
    const e = Math.max(0.1, s / 60);
    chrome.alarms.create(R, { delayInMinutes: e });
  });
}
function c() {
  var s;
  typeof chrome < "u" && ((s = chrome.alarms) != null && s.clear) && chrome.alarms.clear(R);
}
class $ {
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
    this.state = this.getInitialState(), this.readyPromise = new Promise((t) => {
      this.resolveReady = t;
    }), this.setupListeners(), this.init().catch((t) => {
      console.warn("[MultiURL] Controller init error:", t);
    });
  }
  async whenReady() {
    this.isReady || await this.readyPromise;
  }
  async init() {
    try {
      const t = await O();
      this.isReady = !0, this.resolveReady && this.resolveReady(), this.state.status === "idle" && t && (t.status === "running" || t.status === "paused" ? (console.log("[MultiURL] Restoring session from storage, status:", t.status), await this.restoreAndResume(t)) : this.state = { ...t });
    } catch (t) {
      console.warn("[MultiURL] Failed to load session state in init:", t), this.isReady = !0, this.resolveReady && this.resolveReady();
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
  subscribe(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  notify() {
    this.state.updatedAt = Date.now(), N(this.state).catch(
      (t) => console.warn("Failed to persist session state:", t)
    );
    for (const t of this.listeners)
      t(this.getState());
  }
  setupListeners() {
    this.tabRemovedUnsub = T((t) => {
      this.handleTabRemoved(t).catch(
        (e) => console.warn("[MultiURL] handleTabRemoved error:", e)
      );
    }), this.tabReplacedUnsub = k((t, e) => {
      this.handleTabReplaced(t, e);
    });
  }
  handleTabReplaced(t, e) {
    const i = this.state.managedTabIds.indexOf(e);
    if (i !== -1) {
      this.state.managedTabIds[i] = t;
      const a = this.state.tabToEntryIdMap[e];
      a && (delete this.state.tabToEntryIdMap[e], this.state.tabToEntryIdMap[t] = a), this.notify();
    }
  }
  startWatchdog() {
    var t;
    this.stopWatchdog(), typeof chrome < "u" && ((t = chrome.alarms) != null && t.create) && chrome.alarms.create(w, { periodInMinutes: 0.2 }), this.watchdogTimerId = setInterval(() => {
      this.checkAndReconcileQueue().catch(
        (e) => console.warn("[MultiURL] Watchdog reconcile error:", e)
      );
    }, 2500);
  }
  stopWatchdog() {
    var t;
    this.watchdogTimerId && (clearInterval(this.watchdogTimerId), this.watchdogTimerId = null), typeof chrome < "u" && ((t = chrome.alarms) != null && t.clear) && chrome.alarms.clear(w);
  }
  /**
   * Reconciles managed tabs against live browser tabs.
   * Cleans up dead tabs and refills queue slots if capacity opened up.
   */
  async checkAndReconcileQueue() {
    if (await this.whenReady(), this.state.status !== "running" || this.state.mode !== "queue")
      return;
    const t = [...this.state.managedTabIds], e = await Promise.all(
      t.map(async (o) => ({ id: o, alive: await S(o) }))
    ), i = [];
    for (const o of e)
      o.alive ? i.push(o.id) : delete this.state.tabToEntryIdMap[o.id];
    const a = i.length !== this.state.managedTabIds.length;
    this.state.managedTabIds = i;
    const n = this.state.entries.length - this.state.nextIndex;
    if (n === 0 && this.state.managedTabIds.length === 0) {
      this.state.status = "completed", this.state.statusMessage = "All URLs completed and managed tabs closed", this.stopWatchdog(), this.notify();
      return;
    }
    this.state.managedTabIds.length < this.state.limit && n > 0 ? await this.processNextBatch() : a && this.notify();
  }
  destroy() {
    this.currentRunId++, c(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.tabRemovedUnsub && this.tabRemovedUnsub(), this.tabReplacedUnsub && this.tabReplacedUnsub(), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.listeners.clear();
  }
  async start(t, e, i, a) {
    await this.whenReady(), this.currentRunId++, c(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1;
    const n = y(a).value, o = {};
    e.forEach((h) => {
      o[h.id] = "queued";
    }), this.state = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: "running",
      mode: t,
      delaySeconds: Math.max(0.5, i),
      limit: n,
      entries: e,
      nextIndex: 0,
      managedTabIds: [],
      tabToEntryIdMap: {},
      entryOutcomes: o,
      statusMessage: "Opening URLs...",
      startedAt: Date.now(),
      updatedAt: Date.now()
    }, t === "queue" && this.startWatchdog(), this.notify(), await this.processNextBatch();
  }
  /**
   * Restore a previously persisted session (e.g. after service worker restart)
   * and resume processing if the session was running.
   */
  async restoreAndResume(t) {
    this.currentRunId++, c(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.state = { ...t }, this.state.status === "running" ? (this.state.mode === "queue" && this.startWatchdog(), this.state.statusMessage = "Resuming after browser restart...", this.notify(), await this.processNextBatch()) : this.notify();
  }
  /**
   * Called by the chrome.alarms listener in index.ts when the
   * 'multiurls_tick' alarm fires. Resolves the pending wait promise so the
   * interval/after_load loop can dispatch the next URL.
   */
  handleAlarmTick() {
    if (console.log("[MultiURL] Alarm tick received"), this.alarmTickResolver) {
      const t = this.alarmTickResolver;
      this.alarmTickResolver = null, t();
    } else !this.isProcessing && this.state.status === "running" && this.processNextBatch().catch(
      (t) => console.error("[MultiURL] handleAlarmTick processNextBatch error:", t)
    );
  }
  pause() {
    this.state.status === "running" && (c(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.state.status = "paused", this.state.statusMessage = "Paused — Tabs remain open", this.notify());
  }
  resume() {
    this.state.status === "paused" && (this.state.status = "running", this.state.statusMessage = "Resuming...", this.state.mode === "queue" && this.startWatchdog(), this.notify(), this.processNextBatch());
  }
  stop() {
    this.currentRunId++, c(), this.stopWatchdog(), this.timerId && (clearTimeout(this.timerId), this.timerId = null), this.pendingTimerResolver && (this.pendingTimerResolver(), this.pendingTimerResolver = null), this.pendingLoadResolver && (this.pendingLoadResolver(), this.pendingLoadResolver = null), this.alarmTickResolver && (this.alarmTickResolver(), this.alarmTickResolver = null), this.isProcessing = !1, this.pendingRefill = !1, this.state.status = "stopped", this.state.statusMessage = "Stopped by user — Opened tabs preserved", this.notify();
  }
  updateLimit(t) {
    const e = y(t).value, i = this.state.limit;
    this.state.limit = e, this.notify(), this.state.status === "running" && this.state.mode === "queue" && e > i && this.processNextBatch();
  }
  async handleTabRemoved(t) {
    await this.whenReady();
    const e = this.state.managedTabIds.indexOf(t);
    if (e === -1)
      return;
    if (this.state.managedTabIds.splice(e, 1), delete this.state.tabToEntryIdMap[t], this.state.entries.length - this.state.nextIndex === 0 && this.state.managedTabIds.length === 0) {
      this.state.status === "running" && (this.state.status = "completed", this.state.statusMessage = "All URLs completed and managed tabs closed", this.stopWatchdog(), this.notify());
      return;
    }
    this.state.status === "running" && this.state.mode === "queue" ? await this.processNextBatch() : this.notify();
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
  async dispatchUrl(t) {
    this.state.entryOutcomes[t.id] = "opening", this.notify();
    try {
      const e = await E(t.normalizedUrl);
      return this.state.entryOutcomes[t.id] = "opened", e;
    } catch (e) {
      const i = e instanceof Error ? e.message : String(e);
      return console.error(`Failed to open tab for ${t.normalizedUrl}:`, i), this.state.entryOutcomes[t.id] = "failed", this.state.lastError = i, null;
    }
  }
  async runOpenAll() {
    const t = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === t && this.state.nextIndex < this.state.entries.length; ) {
      const e = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++, await this.dispatchUrl(e);
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === t && (this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  async runInterval() {
    const t = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === t && this.state.nextIndex < this.state.entries.length; ) {
      const e = this.state.entries[this.state.nextIndex];
      if (this.state.nextIndex++, await this.dispatchUrl(e), this.state.status !== "running" || this.currentRunId !== t) break;
      if (this.state.nextIndex < this.state.entries.length) {
        const i = this.state.delaySeconds;
        this.state.statusMessage = `Waiting ${i}s before next URL...`, this.notify(), W(i), await new Promise((a) => {
          this.alarmTickResolver = a, this.pendingTimerResolver = a, this.timerId = setTimeout(() => {
            this.timerId = null, this.pendingTimerResolver = null, c(), this.alarmTickResolver === a && (this.alarmTickResolver = null), a();
          }, i * 1e3);
        });
      }
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === t && (c(), this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  /**
   * Waits for a created tab to report status === 'complete' or 8s timeout safeguard.
   */
  waitForTabToLoad(t, e = 8e3) {
    return new Promise((i) => {
      var I;
      let a = !1, n = null, o = null, h = null;
      const f = () => {
        a || (a = !0, n && n(), o && o(), h && clearTimeout(h), this.pendingLoadResolver = null, i());
      };
      this.pendingLoadResolver = f, h = setTimeout(f, e), typeof chrome < "u" && ((I = chrome.tabs) != null && I.get) && chrome.tabs.get(t, (d) => {
        var g;
        !((g = chrome.runtime) != null && g.lastError) && (d == null ? void 0 : d.status) === "complete" && f();
      }), n = _((d, g) => {
        d === t && g === "complete" && f();
      }), o = T((d) => {
        d === t && f();
      });
    });
  }
  async runAfterLoad() {
    const t = this.currentRunId;
    for (; this.state.status === "running" && this.currentRunId === t && this.state.nextIndex < this.state.entries.length; ) {
      const e = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++, this.state.statusMessage = `Opening (${this.state.nextIndex}/${this.state.entries.length}): ${e.normalizedUrl}`, this.notify();
      const i = await this.dispatchUrl(e);
      if (this.state.status !== "running" || this.currentRunId !== t) break;
      i && this.state.nextIndex < this.state.entries.length && (this.state.statusMessage = `Waiting for page load (${this.state.nextIndex}/${this.state.entries.length}): ${e.normalizedUrl}`, this.notify(), await this.waitForTabToLoad(i, 8e3));
    }
    this.state.nextIndex >= this.state.entries.length && this.state.status === "running" && this.currentRunId === t && (this.state.status = "completed", this.state.statusMessage = "All URLs opened successfully", this.notify());
  }
  async runQueueRefill() {
    const t = this.currentRunId;
    if (this.state.status !== "running" || this.currentRunId !== t) return;
    for (; this.state.status === "running" && this.currentRunId === t && this.state.managedTabIds.length < this.state.limit && this.state.nextIndex < this.state.entries.length; ) {
      const a = this.state.entries[this.state.nextIndex];
      this.state.nextIndex++;
      const n = await this.dispatchUrl(a);
      n && (this.state.managedTabIds.push(n), this.state.tabToEntryIdMap[n] = a.id);
    }
    const e = this.state.nextIndex >= this.state.entries.length, i = this.state.managedTabIds.length;
    e ? i > 0 ? this.state.statusMessage = `All URLs opened — ${i} managed tab${i > 1 ? "s" : ""} still open` : (this.state.status = "completed", this.state.statusMessage = "All URLs opened and managed tabs closed", this.stopWatchdog()) : this.state.statusMessage = `Queue running: ${i}/${this.state.limit} slots active`, this.notify();
  }
}
console.log("[MultiURL] Background service worker initialized.");
const r = new $();
var b;
typeof chrome < "u" && ((b = chrome.alarms) != null && b.onAlarm) && chrome.alarms.onAlarm.addListener((s) => {
  s.name === "multiurls_tick" ? r.handleAlarmTick() : s.name === "multiurls_watchdog" && r.checkAndReconcileQueue().catch(
    (t) => console.warn("[MultiURL] Watchdog alarm error:", t)
  );
});
let m = null;
async function F() {
  var t;
  if (typeof chrome > "u" || !((t = chrome.windows) != null && t.create)) return;
  if (m !== null)
    try {
      const e = await chrome.windows.get(m);
      if (e && e.id) {
        chrome.windows.update(e.id, { focused: !1 });
        return;
      }
    } catch {
      m = null;
    }
  const s = chrome.runtime.getURL("popup.html?view=monitor");
  try {
    const e = await chrome.windows.create({
      url: s,
      type: "popup",
      width: 440,
      height: 300,
      focused: !1
    });
    e && e.id !== void 0 && (m = e.id);
  } catch (e) {
    console.warn("[MultiURL] Could not create monitor window:", e);
  }
}
var v;
typeof chrome < "u" && ((v = chrome.windows) != null && v.onRemoved) && chrome.windows.onRemoved.addListener((s) => {
  s === m && (m = null);
});
function q(s) {
  var t;
  typeof chrome > "u" || !((t = chrome.tabs) != null && t.query) || chrome.tabs.query({}, (e) => {
    if (!(!e || e.length === 0))
      for (const i of e)
        i.id && i.id > 0 && chrome.tabs.sendMessage(
          i.id,
          { type: "MULTIURL_STATE_UPDATE", state: s },
          () => {
            chrome.runtime.lastError;
          }
          // ignore "no receiver" errors
        );
  });
}
var L;
typeof chrome < "u" && ((L = chrome.tabs) != null && L.onActivated) && chrome.tabs.onActivated.addListener(async (s) => {
  await r.whenReady();
  const t = r.getState();
  s.tabId && s.tabId > 0 && chrome.tabs.sendMessage(
    s.tabId,
    { type: "MULTIURL_STATE_UPDATE", state: t },
    () => {
      chrome.runtime.lastError;
    }
  );
});
r.subscribe((s) => {
  var t;
  if (typeof chrome < "u" && ((t = chrome.runtime) != null && t.sendMessage))
    try {
      const e = chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: s });
      e && typeof e.catch == "function" && e.catch(() => {
      });
    } catch {
    }
  q(s);
});
async function Q(s) {
  switch (await r.whenReady(), s.type) {
    case "GET_STATE":
      return { success: !0, data: r.getState() };
    case "START_QUEUE":
      return await r.start(
        s.mode,
        s.entries,
        s.delaySeconds,
        s.limit
      ), F().catch(
        (t) => console.warn("[MultiURL] openMonitorWindow error:", t)
      ), { success: !0, data: r.getState() };
    case "PAUSE_QUEUE":
      return r.pause(), { success: !0, data: r.getState() };
    case "RESUME_QUEUE":
      return r.resume(), { success: !0, data: r.getState() };
    case "STOP_QUEUE":
      return r.stop(), { success: !0, data: r.getState() };
    case "UPDATE_LIMIT":
      return r.updateLimit(s.limit), { success: !0, data: r.getState() };
    default:
      return { success: !1, error: "Unknown message type" };
  }
}
var M;
typeof chrome < "u" && ((M = chrome.runtime) != null && M.onMessage) && chrome.runtime.onMessage.addListener(
  (s, t, e) => (Q(s).then(e).catch((i) => {
    console.error("[MultiURL] handleMessage error:", i), e({ success: !1, error: String(i) });
  }), !0)
);
