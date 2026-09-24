(() => { const module = { exports: {} }; const exports = module.exports; var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugins/dev.8uvu.message-logger/js/index.tsx
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var hostKind = "next";
var startedAt = null;
var lastStartError = null;
var handlersRegistered = 0;
var PLUGIN_VERSION = "1.4.2";
var deletedMessageMap = /* @__PURE__ */ new Map();
var editedMessageMap = /* @__PURE__ */ new Map();
var manualDeletes = /* @__PURE__ */ new Set();
var HIGHLIGHT_MAX = 500;
var LOG_FILE = "message-logger.json";
var DEFAULT_SETTINGS = {
  enabled: true,
  logDeletes: true,
  logEdits: true,
  inlineEdits: true,
  ghostPings: true,
  colorHighlights: true,
  ignoreBots: true,
  ignoreWebhooks: false,
  ignoreSelf: false,
  ignoreSelfEdits: false,
  saveImages: true,
  imageQuotaGB: 2,
  attachmentSizeLimitMB: 100,
  attachmentExtensions: "png,jpg,jpeg,gif,webp",
  timeBasedCleanupMinutes: 0,
  maxStored: 300,
  ignoredChannels: "",
  ignoredUsers: "",
  ignoredGuilds: "",
  whitelistedIds: ""
};
function getReact() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    if (typeof revenge !== "undefined") {
      const r = revenge.react;
      if (r) return r.React || r;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const b = bunny;
      const r = b.React || ((_a = b.common) == null ? void 0 : _a.React) || ((_c = (_b = b.metro) == null ? void 0 : _b.common) == null ? void 0 : _c.React) || ((_e = (_d = b.api) == null ? void 0 : _d.react) == null ? void 0 : _e.React);
      if (r) return r;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const r = ((_f = v.common) == null ? void 0 : _f.React) || ((_h = (_g = v.metro) == null ? void 0 : _g.common) == null ? void 0 : _h.React) || v.React;
      if (r) return r;
    }
  } catch {
  }
  return null;
}
function getRN() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  try {
    if (typeof revenge !== "undefined") {
      const rn = (_a = revenge.react) == null ? void 0 : _a.ReactNative;
      if (rn) return rn;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const b = bunny;
      const rn = b.ReactNative || ((_b = b.common) == null ? void 0 : _b.ReactNative) || ((_d = (_c = b.metro) == null ? void 0 : _c.common) == null ? void 0 : _d.ReactNative) || ((_f = (_e = b.api) == null ? void 0 : _e.react) == null ? void 0 : _f.ReactNative);
      if (rn) return rn;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const rn = ((_g = v.common) == null ? void 0 : _g.ReactNative) || ((_i = (_h = v.metro) == null ? void 0 : _h.common) == null ? void 0 : _i.ReactNative);
      if (rn) return rn;
    }
  } catch {
  }
  return null;
}
function getFlux() {
  var _a, _b, _c, _d, _e, _f;
  try {
    if (typeof revenge !== "undefined") {
      const f = (_a = revenge.discord) == null ? void 0 : _a.flux;
      if (f && typeof f.onFluxEventDispatched === "function") return f;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const f = (_b = bunny.api) == null ? void 0 : _b.flux;
      if (f && typeof f.intercept === "function") {
        return {
          onFluxEventDispatched: (type, patch) => f.intercept((payload) => {
            if ((payload == null ? void 0 : payload.type) !== type) return;
            return patch(payload);
          })
        };
      }
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const fd = (_f = (_c = v == null ? void 0 : v.common) == null ? void 0 : _c.FluxDispatcher) != null ? _f : (_e = (_d = v == null ? void 0 : v.metro) == null ? void 0 : _d.common) == null ? void 0 : _e.FluxDispatcher;
      if (fd && typeof fd.addInterceptor === "function") {
        return {
          onFluxEventDispatched: (type, patch) => fd.addInterceptor((payload) => {
            if ((payload == null ? void 0 : payload.type) !== type) return;
            return patch(payload);
          })
        };
      }
    }
  } catch {
  }
  return null;
}
function getRawFluxDispatcher() {
  var _a, _b, _c, _d, _e, _f, _g;
  try {
    if (typeof revenge !== "undefined") {
      const f = (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.flux;
      if (f && typeof f.onAnyFluxEventDispatched === "function") {
        return { addInterceptor: (cb) => f.onAnyFluxEventDispatched(cb) };
      }
      if ((f == null ? void 0 : f.dispatcher) && typeof f.dispatcher.addInterceptor === "function") {
        return f.dispatcher;
      }
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    if (((_b = b == null ? void 0 : b.api) == null ? void 0 : _b.flux) && typeof b.api.flux.intercept === "function") {
      return { addInterceptor: (cb) => b.api.flux.intercept(cb) };
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    const fdB = (_d = (_c = b == null ? void 0 : b.metro) == null ? void 0 : _c.common) == null ? void 0 : _d.FluxDispatcher;
    if (fdB && typeof fdB.addInterceptor === "function") return fdB;
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const fdV = ((_f = (_e = v == null ? void 0 : v.metro) == null ? void 0 : _e.common) == null ? void 0 : _f.FluxDispatcher) || ((_g = v == null ? void 0 : v.common) == null ? void 0 : _g.FluxDispatcher);
    if (fdV && typeof fdV.addInterceptor === "function") return fdV;
  } catch {
  }
  return null;
}
function getMetro() {
  try {
    const n = typeof revenge !== "undefined" && (revenge == null ? void 0 : revenge.metro) || null;
    if (n) return n;
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    if (b == null ? void 0 : b.metro) return b.metro;
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    if (v == null ? void 0 : v.metro) return v.metro;
  } catch {
  }
  return null;
}
function getActions() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  try {
    if (typeof revenge !== "undefined") {
      const a = (_a = revenge.discord) == null ? void 0 : _a.actions;
      if (a) return a;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const b = bunny;
      const a = ((_c = (_b = b.metro) == null ? void 0 : _b.common) == null ? void 0 : _c.toasts) || ((_e = (_d = b.api) == null ? void 0 : _d.actions) == null ? void 0 : _e.ToastActionCreators);
      if (a) return a;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const show = (_k = (_g = (_f = v == null ? void 0 : v.ui) == null ? void 0 : _f.toasts) == null ? void 0 : _g.showToast) != null ? _k : (_j = (_i = (_h = v == null ? void 0 : v.metro) == null ? void 0 : _h.common) == null ? void 0 : _i.toasts) == null ? void 0 : _j.open;
      if (typeof show === "function") {
        return { ToastActionCreators: { open: (t) => {
          var _a2;
          return show(String((_a2 = t == null ? void 0 : t.content) != null ? _a2 : ""));
        } } };
      }
    }
  } catch {
  }
  return null;
}
function getFileModule() {
  var _a, _b, _c, _d, _e;
  try {
    if (typeof revenge !== "undefined") {
      const fm = (_b = (_a = revenge.discord) == null ? void 0 : _a.native) == null ? void 0 : _b.FileModule;
      if (fm) return fm;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const b = bunny;
      return ((_d = (_c = b.api) == null ? void 0 : _c.native) == null ? void 0 : _d.FileModule) || ((_e = b.native) == null ? void 0 : _e.FileModule) || null;
    }
  } catch {
  }
  return null;
}
function getDesign() {
  var _a;
  try {
    const d = (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.design;
    const design = d && (d.Design || d);
    if (design) return design;
  } catch {
  }
  try {
    const ui = bunny == null ? void 0 : bunny.ui;
    if (ui) return ui.FormTableRowGroup ? ui : ui.components || ui;
  } catch {
  }
  return null;
}
function getClipboard() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    if (typeof revenge !== "undefined") {
      const c = (_b = (_a = revenge == null ? void 0 : revenge.externals) == null ? void 0 : _a.ReactNativeClipboard) == null ? void 0 : _b.Clipboard;
      if (c) return c;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const c = (_d = (_c = bunny == null ? void 0 : bunny.metro) == null ? void 0 : _c.common) == null ? void 0 : _d.clipboard;
      if (c) return c;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const c = (_h = (_f = (_e = v == null ? void 0 : v.metro) == null ? void 0 : _e.common) == null ? void 0 : _f.clipboard) != null ? _h : (_g = v == null ? void 0 : v.common) == null ? void 0 : _g.clipboard;
      if (c) return c;
    }
  } catch {
  }
  return null;
}
var log = {};
var docRoot = "";
var flushTimer = null;
var apiRef = null;
var cfg = { ...DEFAULT_SETTINGS };
var cfgStorage = null;
function logPath() {
  return (docRoot.length ? docRoot.replace(/\/+$/, "") + "/" : "") + LOG_FILE;
}
function coerceSettings(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: c.enabled !== false,
    logDeletes: c.logDeletes !== false,
    logEdits: c.logEdits !== false,
    ghostPings: c.ghostPings !== false,
    colorHighlights: c.colorHighlights !== false,
    inlineEdits: c.inlineEdits !== false,
    saveImages: c.saveImages !== false,
    imageQuotaGB: typeof c.imageQuotaGB === "number" && c.imageQuotaGB >= 0.1 && c.imageQuotaGB <= 100 ? c.imageQuotaGB : DEFAULT_SETTINGS.imageQuotaGB,
    attachmentSizeLimitMB: typeof c.attachmentSizeLimitMB === "number" && c.attachmentSizeLimitMB >= 1 && c.attachmentSizeLimitMB <= 1024 ? c.attachmentSizeLimitMB : DEFAULT_SETTINGS.attachmentSizeLimitMB,
    attachmentExtensions: typeof c.attachmentExtensions === "string" ? c.attachmentExtensions : DEFAULT_SETTINGS.attachmentExtensions,
    timeBasedCleanupMinutes: typeof c.timeBasedCleanupMinutes === "number" && c.timeBasedCleanupMinutes >= 0 && c.timeBasedCleanupMinutes <= 525600 ? Math.floor(c.timeBasedCleanupMinutes) : 0,
    ignoreBots: c.ignoreBots !== false,
    ignoreWebhooks: !!c.ignoreWebhooks,
    ignoreSelf: !!c.ignoreSelf,
    ignoreSelfEdits: !!c.ignoreSelfEdits,
    maxStored: typeof c.maxStored === "number" && c.maxStored >= 10 && c.maxStored <= 1e4 ? Math.floor(c.maxStored) : DEFAULT_SETTINGS.maxStored,
    ignoredChannels: typeof c.ignoredChannels === "string" ? c.ignoredChannels : "",
    ignoredUsers: typeof c.ignoredUsers === "string" ? c.ignoredUsers : "",
    ignoredGuilds: typeof c.ignoredGuilds === "string" ? c.ignoredGuilds : "",
    whitelistedIds: typeof c.whitelistedIds === "string" ? c.whitelistedIds : ""
  };
}
function refreshConfigFromStorage() {
  try {
    if (cfgStorage && cfgStorage.cache && typeof cfgStorage.cache === "object") {
      cfg = coerceSettings(cfgStorage.cache);
    }
  } catch {
  }
}
function hostLog(msg) {
  var _a, _b;
  try {
    (_b = (_a = apiRef == null ? void 0 : apiRef.logger) == null ? void 0 : _a.log) == null ? void 0 : _b.call(_a, "[MessageLogger] " + msg);
  } catch {
  }
}
function hostError(msg, e) {
  var _a, _b;
  lastStartError = msg + (e ? " \u2014 " + (e instanceof Error ? e.message : String(e)) : "");
  try {
    (_b = (_a = apiRef == null ? void 0 : apiRef.logger) == null ? void 0 : _a.error) == null ? void 0 : _b.call(
      _a,
      "[MessageLogger] " + msg,
      e instanceof Error ? e.message : e
    );
  } catch {
  }
}
var storageProxy = null;
var storageKind = null;
var classicDisposers = [];
function hostData() {
  try {
    if (!storageProxy) return null;
    if (storageKind === "bunny") {
      return storageProxy.data && typeof storageProxy.data === "object" ? storageProxy.data : {};
    }
    if (storageKind === "vendetta") {
      return { settings: storageProxy.settings, log: storageProxy.log };
    }
  } catch {
  }
  return null;
}
function refreshClassicConfig() {
  try {
    const data = hostData();
    if ((data == null ? void 0 : data.settings) && typeof data.settings === "object") cfg = coerceSettings(data.settings);
  } catch {
  }
}
async function loadLog() {
  var _a;
  if (hostKind !== "next") {
    try {
      const data = hostData();
      if ((data == null ? void 0 : data.settings) && typeof data.settings === "object") {
        cfg = coerceSettings(data.settings);
      }
      if ((data == null ? void 0 : data.log) && typeof data.log === "object") log = data.log;
      hostLog("loaded " + Object.keys(log).length + " entries (plugin storage)");
    } catch (e) {
      hostError("failed to read plugin storage", e);
    }
    return;
  }
  const fm = getFileModule();
  if (!fm) {
    hostError("FileModule unavailable \u2014 log cannot be loaded or saved");
    return;
  }
  try {
    docRoot = String((_a = fm.getConstants().DocumentsDirPath) != null ? _a : "");
  } catch {
    docRoot = "";
  }
  try {
    const raw = await fm.readFile(logPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") log = parsed;
    hostLog("loaded " + Object.keys(log).length + " entries");
  } catch {
    log = {};
    hostLog("starting with an empty log");
  }
}
async function persistLog() {
  if (hostKind !== "next") {
    try {
      if (storageProxy && typeof storageProxy === "object") {
        if (storageKind === "bunny") {
          const data = storageProxy.data && typeof storageProxy.data === "object" ? storageProxy.data : {};
          storageProxy.data = { ...data, log };
        } else {
          storageProxy.log = { ...log };
        }
      }
    } catch (e) {
      hostError("failed to write plugin storage", e);
    }
    return;
  }
  const fm = getFileModule();
  if (!fm) return;
  try {
    await fm.writeFile("documents", LOG_FILE, JSON.stringify(log), "utf8");
  } catch (e) {
    hostError("failed to write log file", e);
  }
}
function prune(max) {
  const ids = Object.keys(log);
  if (ids.length <= max) return;
  ids.map((id) => log[id]).sort((a, b) => a.timestamp - b.timestamp).slice(0, ids.length - max).forEach((m) => {
    delete log[m.id];
  });
}
function inList(id, raw) {
  if (!raw) return false;
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean).includes(String(id));
}
function getUserStore() {
  var _a, _b, _c, _d, _e, _f, _g;
  try {
    if (typeof revenge !== "undefined") {
      const s = (_b = (_a = revenge.discord) == null ? void 0 : _a.flux) == null ? void 0 : _b.Stores;
      if (s == null ? void 0 : s.UserStore) return s.UserStore;
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    const metro = b == null ? void 0 : b.metro;
    for (const c of [(_c = b == null ? void 0 : b.common) == null ? void 0 : _c.UserStore, (_f = (_e = (_d = b == null ? void 0 : b.api) == null ? void 0 : _d.flux) == null ? void 0 : _e.stores) == null ? void 0 : _f.UserStore, (_g = metro == null ? void 0 : metro.common) == null ? void 0 : _g.UserStore]) {
      if (c) return c;
    }
    if (metro == null ? void 0 : metro.findByStoreName) {
      const m = metro.findByStoreName("UserStore");
      if (m == null ? void 0 : m.getCurrentUser) return m;
    }
    if (metro == null ? void 0 : metro.findByProps) {
      const m = metro.findByProps("getCurrentUser");
      if (m == null ? void 0 : m.getCurrentUser) return m;
    }
    if (metro == null ? void 0 : metro.find) {
      const m = metro.find((x) => x && typeof x.getCurrentUser === "function");
      if (m) return m;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const metro = v == null ? void 0 : v.metro;
    if (metro == null ? void 0 : metro.findByStoreName) {
      const m = metro.findByStoreName("UserStore");
      if (m == null ? void 0 : m.getCurrentUser) return m;
    }
    if (metro == null ? void 0 : metro.findByProps) {
      const m = metro.findByProps("getCurrentUser");
      if (m == null ? void 0 : m.getCurrentUser) return m;
    }
  } catch {
  }
  return null;
}
function currentUserId() {
  var _a, _b, _c;
  try {
    return String((_c = (_b = (_a = getUserStore()) == null ? void 0 : _a.getCurrentUser) == null ? void 0 : _b.call(_a).id) != null ? _c : "");
  } catch {
    return "";
  }
}
function mentionsOf(message) {
  const out = [];
  const raw = message == null ? void 0 : message.mentions;
  if (Array.isArray(raw)) {
    for (const m of raw) {
      if (typeof m === "string") out.push(m);
      else if (m && typeof m.id !== "undefined") out.push(String(m.id));
    }
  }
  return out;
}
function snapshotOf(message, me) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const author = (_a = message == null ? void 0 : message.author) != null ? _a : {};
  return {
    id: String((_b = message == null ? void 0 : message.id) != null ? _b : ""),
    channelId: String((_d = (_c = message == null ? void 0 : message.channelId) != null ? _c : message == null ? void 0 : message.channel_id) != null ? _d : ""),
    guildId: String((_j = (_i = (_e = message == null ? void 0 : message.guildId) != null ? _e : message == null ? void 0 : message.guild_id) != null ? _i : (_h = (_g = (_f = message == null ? void 0 : message.messageSnapshots) == null ? void 0 : _f[0]) == null ? void 0 : _g.message) == null ? void 0 : _h.guildId) != null ? _j : ""),
    webhook: !!(author == null ? void 0 : author.webhook) || (message == null ? void 0 : message.webhookId) != null,
    authorId: String((_k = author.id) != null ? _k : ""),
    authorTag: author.globalName || author.username || "Unknown",
    bot: !!author.bot,
    content: String((_l = message == null ? void 0 : message.content) != null ? _l : ""),
    editHistory: [],
    attachments: Array.isArray(message == null ? void 0 : message.attachments) ? message.attachments.map((a) => {
      var _a2, _b2;
      return String((_b2 = (_a2 = a == null ? void 0 : a.url) != null ? _a2 : a == null ? void 0 : a.proxy_url) != null ? _b2 : "");
    }).filter(Boolean).slice(0, 10) : [],
    timestamp: Date.parse(message == null ? void 0 : message.timestamp) || Date.now(),
    mentionsMe: me !== "" && mentionsOf(message).includes(me)
  };
}
var seen = /* @__PURE__ */ new Map();
var skippedIds = /* @__PURE__ */ new Set();
function rememberSkipped(id) {
  if (!id) return;
  skippedIds.add(id);
  if (skippedIds.size > 500) {
    const first = skippedIds.values().next();
    if (!first.done) skippedIds.delete(first.value);
  }
}
function takeSkipped(id) {
  if (!skippedIds.has(id)) return false;
  skippedIds.delete(id);
  return true;
}
function gateMessage(message, snap) {
  const id = snap.id;
  const channelId = snap.channelId;
  if (inList(id, cfg.whitelistedIds) || inList(channelId, cfg.whitelistedIds)) return true;
  if (inList(id, cfg.ignoredUsers) || inList(channelId, cfg.ignoredChannels) || inList(snap.guildId, cfg.ignoredGuilds)) return false;
  return true;
}
function toast(content, key) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
  try {
    const actions = getActions();
    const open = (_b = (_a = actions == null ? void 0 : actions.ToastActionCreators) == null ? void 0 : _a.open) != null ? _b : actions == null ? void 0 : actions.open;
    if (typeof open === "function") {
      open({ key, content });
      return;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const show = (_k = (_h = (_d = (_c = v == null ? void 0 : v.ui) == null ? void 0 : _c.toasts) == null ? void 0 : _d.showToast) != null ? _h : (_g = (_f = (_e = v == null ? void 0 : v.metro) == null ? void 0 : _e.common) == null ? void 0 : _f.toasts) == null ? void 0 : _g.open) != null ? _k : (_j = (_i = v == null ? void 0 : v.common) == null ? void 0 : _i.toasts) == null ? void 0 : _j.showToast;
    if (typeof show === "function") {
      try {
        show({ key, content });
        return;
      } catch {
      }
      try {
        show(content);
        return;
      } catch {
      }
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    const show = (_m = (_l = b == null ? void 0 : b.ui) == null ? void 0 : _l.toasts) == null ? void 0 : _m.showToast;
    if (typeof show === "function") {
      show(content);
      return;
    }
  } catch {
  }
  try {
    const ta = (_n = getRN()) == null ? void 0 : _n.ToastAndroid;
    (_p = ta == null ? void 0 : ta.show) == null ? void 0 : _p.call(ta, content, (_o = ta == null ? void 0 : ta.SHORT) != null ? _o : 0);
  } catch {
  }
}
function alertBox(title, msg) {
  var _a, _b, _c;
  try {
    const Alert = (_a = getRN()) == null ? void 0 : _a.Alert;
    if (Alert == null ? void 0 : Alert.alert) {
      Alert.alert(title, msg);
      return;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const alertApi = (_c = (_b = v == null ? void 0 : v.ui) == null ? void 0 : _b.alerts) == null ? void 0 : _c.showConfirmationAlert;
    if (typeof alertApi === "function") {
      alertApi({ title, content: msg, confirmText: "OK", cancelText: "Close", onConfirm: () => {
      }, onCancel: () => {
      } });
    }
  } catch {
  }
}
function getChannelStore() {
  var _a, _b, _c, _d;
  try {
    if (typeof revenge !== "undefined") {
      const s = (_b = (_a = revenge.discord) == null ? void 0 : _a.flux) == null ? void 0 : _b.Stores;
      if (s == null ? void 0 : s.ChannelStore) return s.ChannelStore;
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    const metro = b == null ? void 0 : b.metro;
    for (const c of [(_c = b == null ? void 0 : b.common) == null ? void 0 : _c.ChannelStore, (_d = metro == null ? void 0 : metro.common) == null ? void 0 : _d.ChannelStore]) {
      if (c) return c;
    }
    if (metro == null ? void 0 : metro.findByStoreName) {
      const m = metro.findByStoreName("ChannelStore");
      if (m == null ? void 0 : m.getChannel) return m;
    }
    if (metro == null ? void 0 : metro.findByProps) {
      const m = metro.findByProps("getChannel");
      if (m == null ? void 0 : m.getChannel) return m;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const metro = v == null ? void 0 : v.metro;
    if (metro == null ? void 0 : metro.findByStoreName) {
      const m = metro.findByStoreName("ChannelStore");
      if (m == null ? void 0 : m.getChannel) return m;
    }
    if (metro == null ? void 0 : metro.findByProps) {
      const m = metro.findByProps("getChannel");
      if (m == null ? void 0 : m.getChannel) return m;
    }
  } catch {
  }
  return null;
}
function toastGhostPing(entry) {
  var _a, _b;
  let where = "a channel";
  try {
    const ch = (_b = (_a = getChannelStore()) == null ? void 0 : _a.getChannel) == null ? void 0 : _b.call(_a, entry.channelId);
    if (ch == null ? void 0 : ch.name) where = "#" + ch.name;
  } catch {
  }
  toast(
    "Ghost ping by " + entry.authorTag + " in " + where + ": " + entry.content.slice(0, 120),
    "msglogger-ghostping-" + entry.id
  );
}
var IMG_DIR_NAME = "message-logger/images";
var IMG_INDEX_FILE = "message-logger/images-index.json";
var imageIndex = {};
var imageQueue = [];
var imageBusy = false;
var imageIndexDirty = false;
function getFetch() {
  try {
    if (typeof fetch === "function") return fetch.bind(globalThis);
  } catch {
  }
  return null;
}
function getBlobReader() {
  try {
    if (typeof FileReader === "function") {
      return (blob) => new Promise((resolve, reject) => {
        try {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        } catch (e) {
          reject(e);
        }
      });
    }
    if (typeof Blob === "function" && typeof Blob.prototype.arrayBuffer === "function") {
      return async (blob) => {
        const buf = await blob.arrayBuffer();
        let s = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return "data:application/octet-stream;base64," + btoa(s);
      };
    }
  } catch {
  }
  return null;
}
function getNormalizedFs() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const fm = getFileModule();
  let modern = null;
  try {
    if (typeof revenge !== "undefined") {
      modern = (_c = (_b = revenge == null ? void 0 : revenge.fs) != null ? _b : (_a = revenge == null ? void 0 : revenge.native) == null ? void 0 : _a.fs) != null ? _c : null;
    }
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    modern = modern || (b == null ? void 0 : b.fs) || ((_d = b == null ? void 0 : b.native) == null ? void 0 : _d.fs) || null;
  } catch {
  }
  if (modern && typeof modern.writeFile === "function" && typeof modern.readFile === "function") {
    let root = "";
    try {
      if (typeof modern.getConstants === "function") {
        const c = modern.getConstants();
        root = String((_f = (_e = c == null ? void 0 : c.files) != null ? _e : c == null ? void 0 : c.data) != null ? _f : "");
      }
    } catch {
    }
    const abs = (p) => root ? root + "/" + p : p;
    return {
      dirPath: root ? root + "/" + IMG_DIR_NAME : null,
      writeImage: async (name, dataB64) => {
        await modern.writeFile(abs(IMG_DIR_NAME + "/" + name), dataB64);
      },
      writeText: async (path, data) => {
        await modern.writeFile(abs(path), data);
      },
      readText: async (path) => String(await modern.readFile(abs(path))),
      remove: async (path) => {
        try {
          if (typeof modern.rm === "function") return !!await modern.rm(path);
          if (typeof modern.deleteFileSync === "function") return !!modern.deleteFileSync(path);
          if (typeof modern.unlink === "function") {
            await modern.unlink(path);
            return true;
          }
        } catch {
        }
        return false;
      }
    };
  }
  if (fm && typeof fm.writeFile === "function") {
    let docs = "";
    try {
      docs = String((_i = (_h = (_g = fm.getConstants) == null ? void 0 : _g.call(fm)) == null ? void 0 : _h.DocumentsDirPath) != null ? _i : "/docs");
    } catch {
    }
    return {
      dirPath: docs + "/" + IMG_DIR_NAME,
      writeImage: async (name, dataB64) => {
        await fm.writeFile("documents", IMG_DIR_NAME + "/" + name, dataB64, "base64");
      },
      writeText: async (_path, data) => {
        await fm.writeFile("documents", IMG_INDEX_FILE, data, "utf8");
      },
      readText: async (_path) => String(await fm.readFile(docs + "/" + IMG_INDEX_FILE, "utf8")),
      remove: async (_path) => false
      // legacy FileModule has no delete primitive
    };
  }
  return null;
}
async function loadImageIndex() {
  const fs = getNormalizedFs();
  if (!fs) return;
  try {
    const raw = await fs.readText(IMG_INDEX_FILE);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") imageIndex = parsed;
  } catch {
  }
}
async function saveImageIndex(fs) {
  if (!imageIndexDirty) return;
  try {
    await fs.writeText(IMG_INDEX_FILE, JSON.stringify(imageIndex));
    imageIndexDirty = false;
  } catch (e) {
    hostError("failed to write image index", e);
  }
}
function imageQuotaBytes() {
  return Math.max(0, cfg.imageQuotaGB) * 1024 * 1024 * 1024;
}
function totalSavedBytes() {
  var _a;
  let sum = 0;
  for (const id of Object.keys(imageIndex)) {
    for (const img of (_a = imageIndex[id]) != null ? _a : []) sum += img.bytes || 0;
  }
  return sum;
}
async function evictOverQuota(fs, extraBytes) {
  var _a, _b, _c, _d;
  let total = totalSavedBytes() + extraBytes;
  const quota = imageQuotaBytes();
  if (total <= quota) return;
  const entries = [];
  for (const id of Object.keys(imageIndex)) {
    ((_a = imageIndex[id]) != null ? _a : []).forEach((img, i) => entries.push({ id, img, i }));
  }
  entries.sort((a, b) => a.img.time - b.img.time);
  for (const e of entries) {
    if (total <= quota) break;
    const ok = await fs.remove(((_b = fs.dirPath) != null ? _b : "") + "/" + e.img.file);
    if (ok || !fs.dirPath) {
      imageIndex[e.id] = ((_c = imageIndex[e.id]) != null ? _c : []).filter((_, i) => i !== e.i);
      if (!((_d = imageIndex[e.id]) == null ? void 0 : _d.length)) delete imageIndex[e.id];
      total -= e.img.bytes || 0;
      imageIndexDirty = true;
    } else {
      break;
    }
  }
}
function enqueueImageSave(messageId, url) {
  if (!cfg.saveImages || imageQuotaBytes() <= 0) return;
  if (!getFetch() || !getBlobReader()) return;
  imageQueue.push({ id: messageId, url });
  if (imageQueue.length > 100) imageQueue.shift();
  void pumpImageQueue();
}
async function pumpImageQueue() {
  if (imageBusy) return;
  imageBusy = true;
  try {
    while (imageQueue.length > 0) {
      const job = imageQueue.shift();
      try {
        await saveOneImage(job.id, job.url);
      } catch (e) {
        hostError("image save failed", e);
      }
    }
  } finally {
    imageBusy = false;
  }
}
async function saveOneImage(messageId, url) {
  var _a, _b, _c;
  const fs = getNormalizedFs();
  if (!fs) return;
  const fetchFn = getFetch();
  const readBlob = getBlobReader();
  if (!fetchFn || !readBlob) return;
  const res = await fetchFn(url, { method: "GET" });
  if (!res || !res.ok) return;
  const blob = await res.blob();
  const dataUrl = await readBlob(blob);
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return;
  const b64 = dataUrl.slice(comma + 1);
  const bytes = Math.floor(b64.length * 3 / 4);
  if (bytes > cfg.attachmentSizeLimitMB * 1024 * 1024) return;
  if (bytes > imageQuotaBytes()) return;
  await evictOverQuota(fs, bytes);
  const stamp = Date.now();
  const name = messageId + "-" + stamp + "-" + ((_b = (_a = imageIndex[messageId]) == null ? void 0 : _a.length) != null ? _b : 0) + ".b64";
  await fs.writeImage(name, b64);
  imageIndex[messageId] = [
    ...(_c = imageIndex[messageId]) != null ? _c : [],
    { file: name, bytes, time: stamp }
  ];
  imageIndexDirty = true;
  await saveImageIndex(fs);
  const entry = log[messageId];
  if (entry) {
    entry.savedImages = imageIndex[messageId].length;
    void persistLog();
  }
}
function allowedExtensions() {
  return cfg.attachmentExtensions.split(/[\s,]+/).map((s) => s.trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
}
function isCacheableImageUrl(url) {
  if (/(^|\/)(cdn\.discordapp\.com|media\.discordapp\.net)\//.test(url) === false) return false;
  const exts = allowedExtensions();
  if (!exts.length) return false;
  return exts.some((ext) => new RegExp("\\." + ext + "(\\?|$)", "i").test(url));
}
function queueImagesForEntry(entry) {
  if (!cfg.saveImages) return;
  const urls = entry.attachments.filter(isCacheableImageUrl).slice(0, 5);
  for (const url of urls) enqueueImageSave(entry.id, url);
}
var cleanupTimer = null;
function runTimeBasedCleanup() {
  const mins = cfg.timeBasedCleanupMinutes;
  if (!mins) return;
  const cutoff = Date.now() - mins * 6e4;
  let removed = 0;
  for (const id of Object.keys(log)) {
    if (log[id].timestamp < cutoff) {
      delete log[id];
      removed++;
    }
  }
  if (removed > 0) {
    void persistLog();
    hostLog("time-based cleanup removed " + removed + " old entries");
  }
}
function startCleanupInterval() {
  stopCleanupInterval();
  if (!cfg.timeBasedCleanupMinutes) return;
  cleanupTimer = setInterval(runTimeBasedCleanup, Math.max(5, Math.min(cfg.timeBasedCleanupMinutes, 60)) * 6e4);
  if (typeof (cleanupTimer == null ? void 0 : cleanupTimer.unref) === "function") cleanupTimer.unref();
}
function stopCleanupInterval() {
  if (cleanupTimer) {
    try {
      clearInterval(cleanupTimer);
    } catch {
    }
    cleanupTimer = null;
  }
}
function handleCreate(payload) {
  if (!cfg.enabled) return;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  rememberForHighlight(payload);
  const snap = snapshotOf(message, currentUserId());
  if (!gateMessage(message, snap)) return;
  const self = snap.authorId && snap.authorId === currentUserId();
  if (cfg.ignoreBots && snap.bot || cfg.ignoreWebhooks && snap.webhook || cfg.ignoreSelf && self || inList(snap.authorId, cfg.ignoredUsers)) {
    rememberSkipped(snap.id);
    return;
  }
  seen.set(snap.id, snap);
  if (seen.size > cfg.maxStored * 4) {
    const first = seen.keys().next();
    if (!first.done) seen.delete(first.value);
  }
}
function handleDelete(payload) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  if (!cfg.enabled || !cfg.logDeletes) return;
  const id = String((_c = (_b = (_a = payload == null ? void 0 : payload.message) == null ? void 0 : _a.id) != null ? _b : payload == null ? void 0 : payload.id) != null ? _c : "");
  const channelId = String((_f = (_e = (_d = payload == null ? void 0 : payload.message) == null ? void 0 : _d.channelId) != null ? _e : payload == null ? void 0 : payload.channelId) != null ? _f : "");
  if (!id || inList(channelId, cfg.ignoredChannels)) return;
  if (!gateMessage((_g = payload == null ? void 0 : payload.message) != null ? _g : { id, channelId }, { id, channelId, guildId: String((_h = payload == null ? void 0 : payload.guildId) != null ? _h : "") })) return;
  if (((_i = log[id]) == null ? void 0 : _i.status) === "deleted") return;
  if (takeSkipped(id)) {
    seen.delete(id);
    return;
  }
  const snap = (_k = seen.get(id)) != null ? _k : snapshotOf((_j = payload == null ? void 0 : payload.message) != null ? _j : { id, channelId }, currentUserId());
  if (snap.attachments.length === 0 && Array.isArray((_l = payload == null ? void 0 : payload.message) == null ? void 0 : _l.embeds) && payload.message.embeds.length > 0) {
    snap.attachments = payload.message.embeds.map((e) => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      return String((_f2 = (_e2 = (_c2 = (_a2 = e == null ? void 0 : e.image) == null ? void 0 : _a2.url) != null ? _c2 : (_b2 = e == null ? void 0 : e.image) == null ? void 0 : _b2.proxy_url) != null ? _e2 : (_d2 = e == null ? void 0 : e.thumbnail) == null ? void 0 : _d2.url) != null ? _f2 : "");
    }).filter(Boolean).slice(0, 5);
  }
  if (cfg.ignoreBots && snap.bot) {
    seen.delete(id);
    return;
  }
  if (cfg.ignoreWebhooks && snap.webhook) {
    seen.delete(id);
    return;
  }
  if (cfg.ignoreSelf && snap.authorId && snap.authorId === currentUserId()) {
    seen.delete(id);
    return;
  }
  if (inList(snap.authorId, cfg.ignoredUsers)) {
    seen.delete(id);
    return;
  }
  seen.delete(id);
  const ghost = cfg.ghostPings && snap.mentionsMe;
  log[id] = {
    ...snap,
    status: "deleted",
    edits: (_n = (_m = log[id]) == null ? void 0 : _m.edits) != null ? _n : [],
    mentionsMe: snap.mentionsMe,
    ghostPing: ghost
  };
  prune(cfg.maxStored);
  void persistLog();
  queueImagesForEntry(log[id]);
  if (ghost) toastGhostPing(log[id]);
}
function handleDeleteBulk(payload) {
  const ids = Array.isArray(payload == null ? void 0 : payload.ids) ? payload.ids : [];
  for (const id of ids) {
    handleDelete({ message: { id, channelId: payload == null ? void 0 : payload.channelId } });
  }
}
function handleUpdate(payload) {
  var _a, _b, _c;
  if (!cfg.enabled || !cfg.logEdits) return;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  rememberForHighlight(payload);
  const id = String(message.id);
  const prev = seen.get(id);
  const snap = snapshotOf(message, currentUserId());
  if (!gateMessage(message, snap)) return;
  if (cfg.ignoreBots && snap.bot) return;
  if (cfg.ignoreWebhooks && snap.webhook) return;
  const self = snap.authorId && snap.authorId === currentUserId();
  if (cfg.ignoreSelf && self) return;
  if (cfg.ignoreSelfEdits && self) return;
  if (inList(snap.authorId, cfg.ignoredUsers)) return;
  seen.set(id, snap);
  const prevContent = prev && typeof prev.content === "string" ? prev.content : null;
  const isRealEdit = prevContent !== null && prevContent !== snap.content;
  const priorHistory = (_a = prev == null ? void 0 : prev.editHistory) != null ? _a : [];
  if (isRealEdit && prevContent !== null) priorHistory.push(prevContent);
  if (priorHistory.length) snap.editHistory = priorHistory.slice(-10);
  if (!isRealEdit && !log[id]) return;
  const existing = log[id];
  log[id] = {
    ...snap,
    status: "edited",
    edits: [...(_b = existing == null ? void 0 : existing.edits) != null ? _b : [], ...isRealEdit && prevContent !== null ? [prevContent] : []].slice(-10),
    mentionsMe: snap.mentionsMe,
    ghostPing: (_c = existing == null ? void 0 : existing.ghostPing) != null ? _c : false
  };
  prune(cfg.maxStored);
  void persistLog();
}
function rememberForHighlight(payload) {
  var _a, _b, _c, _d, _e;
  try {
    const message = payload == null ? void 0 : payload.message;
    if (!(message == null ? void 0 : message.id)) return;
    const channelId = String((_b = (_a = message.channelId) != null ? _a : message.channel_id) != null ? _b : "");
    const content = typeof message.content === "string" ? message.content : "";
    const author = (_c = message.author) != null ? _c : {};
    const rec = {
      channelId,
      timestamp: Date.now(),
      content,
      authorTag: (_e = (_d = author.global_name) != null ? _d : author.username) != null ? _e : "Unknown",
      bot: !!author.bot
    };
    const isEdit = deletedMessageMap.has(String(message.id));
    if (content) (isEdit ? highlightEdits : highlightCreates).set(String(message.id), rec);
    if (isEdit) deletedMessageMap.delete(String(message.id));
  } catch {
  }
}
function trimHighlightCache(map) {
  if (map.size <= HIGHLIGHT_MAX) return;
  const oldest = map.keys().next();
  if (!oldest.done) map.delete(oldest.value);
}
function isSelfDelete(id) {
  if (!manualDeletes.has(id)) return false;
  manualDeletes.delete(id);
  return true;
}
function markHighlightDeleted(id, channelId) {
  deletedMessageMap.set(id, { channelId, timestamp: Date.now() });
  trimHighlightCache(deletedMessageMap);
}
function markHighlightEdited(id, channelId) {
  if (deletedMessageMap.has(id)) return;
  editedMessageMap.set(id, { channelId, timestamp: Date.now() });
  trimHighlightCache(editedMessageMap);
}
var highlightCreates = /* @__PURE__ */ new Map();
var highlightEdits = /* @__PURE__ */ new Map();
function cachedRecordFor(id) {
  var _a;
  return (_a = highlightCreates.get(id)) != null ? _a : highlightEdits.get(id);
}
function buildAutomodEvent(id, channelId, record) {
  return {
    type: "MESSAGE_EDIT_FAILED_AUTOMOD",
    messageData: {
      type: 1,
      message: {
        channelId,
        messageId: id
      }
    },
    errorResponseBody: {
      code: 2e5,
      message: (record == null ? void 0 : record.content) || "(deleted)"
    }
  };
}
function installDeleteRewrite(dispatcher, addCleanup) {
  if (!dispatcher || typeof dispatcher.addInterceptor !== "function") return false;
  const dispatch = typeof dispatcher.dispatch === "function" ? dispatcher.dispatch.bind(dispatcher) : null;
  try {
    const interceptor = (payload) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
      try {
        const type = payload == null ? void 0 : payload.type;
        if (type === "MESSAGE_DELETE" && cfg.logDeletes) {
          const id = String((_d = (_c = (_a = payload == null ? void 0 : payload.id) != null ? _a : payload == null ? void 0 : payload.messageId) != null ? _c : (_b = payload == null ? void 0 : payload.message) == null ? void 0 : _b.id) != null ? _d : "");
          const channelId = String((_j = (_i = (_g = (_e = payload == null ? void 0 : payload.channelId) != null ? _e : payload == null ? void 0 : payload.channel_id) != null ? _g : (_f = payload == null ? void 0 : payload.message) == null ? void 0 : _f.channelId) != null ? _i : (_h = payload == null ? void 0 : payload.message) == null ? void 0 : _h.channel_id) != null ? _j : "");
          if (!id || !channelId) return;
          if (isSelfDelete(id)) return;
          if (inList(channelId, cfg.ignoredChannels)) return;
          const record = cachedRecordFor(id);
          if (cfg.ignoreBots && (record == null ? void 0 : record.bot)) return;
          const authorId = (_m = (_k = seen.get(id)) == null ? void 0 : _k.authorId) != null ? _m : (_l = log[id]) == null ? void 0 : _l.authorId;
          if (cfg.ignoreSelf && authorId && authorId === currentUserId()) return;
          if (inList(authorId, cfg.ignoredUsers)) return;
          handleDelete(payload);
          markHighlightDeleted(id, channelId);
          return buildAutomodEvent(id, channelId, record);
        }
        if (type === "MESSAGE_DELETE_BULK" && cfg.logDeletes) {
          const ids = Array.isArray(payload == null ? void 0 : payload.ids) ? payload.ids.map(String) : [];
          const channelId = String((_o = (_n = payload == null ? void 0 : payload.channelId) != null ? _n : payload == null ? void 0 : payload.channel_id) != null ? _o : "");
          if (!ids.length || !channelId) return;
          const kept = ids.filter((id) => {
            var _a2;
            if (isSelfDelete(id)) return false;
            if (inList(channelId, cfg.ignoredChannels)) return false;
            if (cfg.ignoreBots && ((_a2 = cachedRecordFor(id)) == null ? void 0 : _a2.bot)) return false;
            return true;
          });
          if (!kept.length) return;
          for (const id of kept) {
            markHighlightDeleted(id, channelId);
            handleDeleteBulk({ ids: [id], channelId });
          }
          if (dispatch) {
            setTimeout(() => {
              for (const id of kept) {
                try {
                  dispatch(buildAutomodEvent(id, channelId, cachedRecordFor(id)));
                } catch {
                }
              }
            }, 0);
            return false;
          }
          return;
        }
        if (type === "MESSAGE_UPDATE") {
          const id = String((_q = (_p = payload == null ? void 0 : payload.message) == null ? void 0 : _p.id) != null ? _q : "");
          const channelId = String((_u = (_t = (_r = payload == null ? void 0 : payload.message) == null ? void 0 : _r.channelId) != null ? _t : (_s = payload == null ? void 0 : payload.message) == null ? void 0 : _s.channel_id) != null ? _u : "");
          if (id && channelId && cfg.logEdits && !inList(channelId, cfg.ignoredChannels)) {
            markHighlightEdited(id, channelId);
          }
          return;
        }
      } catch (e) {
        hostError("rewrite interceptor failed", e);
      }
      return;
    };
    const off = dispatcher.addInterceptor(interceptor);
    addCleanup(typeof off === "function" ? off : () => {
      var _a;
      try {
        const list = (_a = dispatcher._interceptors) != null ? _a : dispatcher._dependencies;
        if (Array.isArray(list)) {
          const i = list.indexOf(interceptor);
          if (i >= 0) list.splice(i, 1);
        }
      } catch {
      }
    });
    return true;
  } catch (e) {
    hostError("could not install delete rewrite", e);
    return false;
  }
}
function paintRow(row, processColor) {
  var _a, _b, _c;
  const msg = row == null ? void 0 : row.message;
  if (!(msg == null ? void 0 : msg.id)) return;
  const id = String(msg.id);
  const isDel = deletedMessageMap.has(id);
  const isEd = editedMessageMap.has(id);
  if (!isDel && !isEd) return;
  if (isDel) {
    msg.edited = "(deleted)";
    const red = processColor("#f04747");
    msg.textColor = red;
    row.backgroundHighlight = {
      backgroundColor: processColor("#f047471f"),
      gutterColor: red
    };
  } else {
    row.backgroundHighlight = {
      backgroundColor: processColor("#faa61a18"),
      gutterColor: processColor("#faa61a")
    };
  }
  if (cfg.inlineEdits) {
    const history = (_b = (_a = log[id]) == null ? void 0 : _a.edits) != null ? _b : [];
    if (history.length) {
      msg.content = String((_c = msg.content) != null ? _c : "") + "\n" + history.map((h) => "(edited) " + h).join("\n");
    }
  }
}
var rowPaintersInstalled = 0;
function installRowPainters(addCleanup) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const React = getReact();
  const RN = getRN();
  const processColor = (_a = RN == null ? void 0 : RN.processColor) != null ? _a : ((c) => c);
  if (!cfg.colorHighlights) {
    rowPaintersInstalled = 0;
    return;
  }
  let installed = 0;
  const patchBefore = (target, method, fn) => {
    try {
      const original = target == null ? void 0 : target[method];
      if (typeof original !== "function") return false;
      target[method] = function(...args) {
        try {
          fn(args);
        } catch {
        }
        return original.apply(this, args);
      };
      addCleanup(() => {
        try {
          target[method] = original;
        } catch {
        }
      });
      return true;
    } catch {
      return false;
    }
  };
  const paintArgs = (args) => {
    var _a2;
    const raw = args[1];
    if (!raw) return;
    const handleRow = (row) => {
      if (!row || row.type !== 1) return;
      paintRow(row, processColor);
    };
    if (typeof raw === "string") {
      try {
        const rows = JSON.parse(raw);
        if (Array.isArray(rows)) {
          let mutated = false;
          for (const row of rows) {
            if (((_a2 = row == null ? void 0 : row.message) == null ? void 0 : _a2.id) && (deletedMessageMap.has(String(row.message.id)) || editedMessageMap.has(String(row.message.id)))) {
              handleRow(row);
              mutated = true;
            }
          }
          if (mutated) args[1] = JSON.stringify(rows);
        }
      } catch {
      }
    } else if (Array.isArray(raw)) {
      for (const row of raw) handleRow(row);
    } else if (Array.isArray(raw == null ? void 0 : raw.rows)) {
      for (const row of raw.rows) handleRow(row);
    }
  };
  void React;
  const chatManager = (_b = RN == null ? void 0 : RN.NativeModules) == null ? void 0 : _b.DCDChatManager;
  if (chatManager && patchBefore(chatManager, "updateRows", paintArgs)) installed++;
  const metro = getMetro();
  const jsChat = (_e = (_c = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _c.call(metro, "updateRows", "getConstants")) != null ? _e : (_d = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _d.call(metro, "updateRows");
  if (jsChat && jsChat !== chatManager && patchBefore(jsChat, "updateRows", paintArgs)) installed++;
  let rowManager = null;
  try {
    rowManager = (_j = (_i = (_f = metro == null ? void 0 : metro.findByName) == null ? void 0 : _f.call(metro, "RowManager", false)) != null ? _i : (_h = (_g = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _g.call(metro, "RowManager")) == null ? void 0 : _h.RowManager) != null ? _j : null;
  } catch {
  }
  if ((_k = rowManager == null ? void 0 : rowManager.prototype) == null ? void 0 : _k.generate) {
    try {
      const proto = rowManager.prototype;
      const original = proto.generate;
      proto.generate = function(...args) {
        var _a2;
        const row = original.apply(this, args);
        try {
          const target = row && row.row || row;
          if ((_a2 = target == null ? void 0 : target.message) == null ? void 0 : _a2.id) {
            paintRow(target, processColor);
          }
        } catch {
        }
        return row;
      };
      addCleanup(() => {
        try {
          proto.generate = original;
        } catch {
        }
      });
      installed++;
    } catch {
    }
  }
  rowPaintersInstalled = installed;
  hostLog("row painters installed: " + installed);
}
function installSelfDeleteBypass(addCleanup) {
  var _a, _b, _c;
  try {
    const metro = getMetro();
    const actions = (_c = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "deleteMessage", "startEditMessage")) != null ? _c : (_b = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _b.call(metro, "deleteMessage");
    const del = actions == null ? void 0 : actions.deleteMessage;
    if (typeof del !== "function") return false;
    actions.deleteMessage = function(...args) {
      var _a2, _b2;
      try {
        const id = String((_b2 = (_a2 = args == null ? void 0 : args[1]) != null ? _a2 : args == null ? void 0 : args[0]) != null ? _b2 : "");
        if (id) manualDeletes.add(id);
      } catch {
      }
      return del.apply(this, args);
    };
    addCleanup(() => {
      try {
        actions.deleteMessage = del;
      } catch {
      }
    });
    return true;
  } catch {
    return false;
  }
}
function resolveThemeMeta() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  try {
    const metro = getMetro();
    const themeStore = (_f = (_e = (_a = metro == null ? void 0 : metro.findByStoreName) == null ? void 0 : _a.call(metro, "ThemeStore")) != null ? _e : (_d = (_c = (_b = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _b.flux) == null ? void 0 : _c.Stores) == null ? void 0 : _d.ThemeStore) != null ? _f : null;
    const theme = (_i = themeStore == null ? void 0 : themeStore.theme) != null ? _i : (_h = (_g = themeStore == null ? void 0 : themeStore.getState) == null ? void 0 : _g.call(themeStore)) == null ? void 0 : _h.theme;
    if (theme === "light") return "light";
  } catch {
  }
  return "dark";
}
function viewerColors() {
  const theme = resolveThemeMeta();
  if (theme === "light") {
    return {
      bg: "rgba(0,0,0,0.04)",
      text: "#060607",
      sub: "#4e5058",
      deleted: "#d83c3e",
      deletedBg: "rgba(216,60,62,0.10)",
      edited: "#c28516",
      editedBg: "rgba(250,166,26,0.12)"
    };
  }
  return {
    bg: "rgba(255,255,255,0.06)",
    text: "#dbdee1",
    sub: "#949ba4",
    deleted: "#f23f43",
    deletedBg: "rgba(242,63,67,0.14)",
    edited: "#faa61a",
    editedBg: "rgba(250,166,26,0.14)"
  };
}
function makeSettingsComponent() {
  const React = getReact();
  if (!React) return () => null;
  const el = React.createElement.bind(React);
  const RN = getRN() || {};
  const { View = "view", Text = "text", TextInput = "input", Pressable = View, ScrollView = View } = RN;
  const SwitchRowFallback = (props) => el(
    Pressable,
    {
      onPress: () => props.onValueChange(!props.value),
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center"
      }
    },
    el(Text, { style: { flex: 1, color: viewerColors().text } }, props.label),
    el(Text, { style: { color: viewerColors().sub, marginLeft: 8 } }, props.value ? "On" : "Off")
  );
  function SwitchRow(props) {
    const design = getDesign();
    const Row = design == null ? void 0 : design.TableSwitchRow;
    if (Row) return el(Row, props, null);
    return el(SwitchRowFallback, props, null);
  }
  function RowGroup(props) {
    const design = getDesign();
    const Group = design == null ? void 0 : design.TableRowGroup;
    if (Group) return el(Group, { title: props.title }, ...props.children);
    const C = viewerColors();
    return el(
      View,
      { style: { marginVertical: 8, backgroundColor: C.bg, borderRadius: 8, paddingVertical: 4 } },
      el(Text, { style: { fontWeight: "bold", padding: 12, paddingBottom: 4, color: C.sub, fontSize: 12 } }, props.title),
      ...props.children
    );
  }
  const DText = (props) => {
    var _a;
    const design = getDesign();
    const T = design == null ? void 0 : design.Text;
    const style = { color: viewerColors().text, ...(_a = props == null ? void 0 : props.style) != null ? _a : {} };
    return el(T || Text, { ...props, style }, ...Array.isArray(props == null ? void 0 : props.children) ? props.children : [props == null ? void 0 : props.children]);
  };
  return function SettingsComponent2(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const api = (_a = props == null ? void 0 : props.api) != null ? _a : classicSettingsApi();
    const settings = (_d = (_c = (_b = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _b.use) == null ? void 0 : _c.call(_b)) != null ? _d : cfg;
    const C = viewerColors();
    const [entries, setEntries] = React.useState([]);
    const [filter, setFilter] = React.useState("all");
    const [query, setQuery] = React.useState("");
    const [refreshTick, setRefreshTick] = React.useState(0);
    React.useEffect(() => {
      settingsChangedCb = () => setRefreshTick((t) => t + 1);
      return () => {
        settingsChangedCb = null;
      };
    }, []);
    const reload = async () => {
      var _a2;
      const merged = {};
      try {
        const raw = await ((_a2 = getFileModule()) == null ? void 0 : _a2.readFile(logPath(), "utf8"));
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") Object.assign(merged, parsed);
      } catch {
      }
      Object.assign(merged, log);
      const list = Object.values(merged).sort((a, b) => b.timestamp - a.timestamp);
      setEntries(list.slice(0, 300));
    };
    React.useEffect(() => {
      void reload();
    }, [refreshTick]);
    const visible = entries.filter((m) => {
      if (filter === "deleted" && m.status !== "deleted") return false;
      if (filter === "edited" && m.status !== "edited") return false;
      if (filter === "ghost" && !m.ghostPing) return false;
      const q = query.trim().toLowerCase();
      if (q && !(m.content.toLowerCase().includes(q) || m.authorTag.toLowerCase().includes(q)))
        return false;
      return true;
    });
    const removeEntry = async (id) => {
      try {
        delete log[id];
        await persistLog();
        void reload();
      } catch {
      }
    };
    const exportLog = async () => {
      try {
        const clip = getClipboard();
        if (!(clip == null ? void 0 : clip.setString)) throw new Error("clipboard unavailable");
        clip.setString(JSON.stringify(Object.values(log), null, 2));
        toast("Log copied to clipboard", "msglogger-export");
      } catch {
        toast("Export failed \u2014 clipboard unavailable", "msglogger-export-fail");
      }
    };
    const clearLog = async () => {
      var _a2;
      log = {};
      try {
        await ((_a2 = getFileModule()) == null ? void 0 : _a2.writeFile("documents", LOG_FILE, "{}", "utf8"));
      } catch {
      }
      void reload();
    };
    const clearImageCache = async () => {
      var _a2, _b2;
      try {
        const fs = getNormalizedFs();
        const base = (_a2 = fs == null ? void 0 : fs.dirPath) != null ? _a2 : "";
        for (const id of Object.keys(imageIndex)) {
          for (const img of (_b2 = imageIndex[id]) != null ? _b2 : []) {
            try {
              await (fs == null ? void 0 : fs.remove(base + "/" + img.file));
            } catch {
            }
          }
        }
        imageIndex = {};
        imageIndexDirty = true;
        if (fs) await saveImageIndex(fs);
        toast("Saved images cleared", "msglogger-img-clear");
      } catch {
        toast("Could not clear saved images", "msglogger-img-clear-fail");
      }
    };
    const tab = (key, label) => el(
      Pressable,
      {
        key,
        onPress: () => setFilter(key),
        style: { paddingVertical: 8, paddingHorizontal: 10 }
      },
      el(
        Text,
        { style: { fontWeight: filter === key ? "bold" : "normal", color: filter === key ? C.text : C.sub } },
        label
      )
    );
    const sw = (key, label, subLabel) => el(SwitchRow, {
      key,
      label,
      subLabel,
      value: (settings == null ? void 0 : settings[key]) !== false,
      onValueChange: (v) => {
        var _a2, _b2;
        return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { [key]: v });
      }
    });
    return el(
      ScrollView,
      { style: { flexGrow: 1 } },
      el(
        RowGroup,
        { title: "Status" },
        el(DText, null, "Host: " + (hostKind === "next" ? "Revenge (Next API)" : "Classic / vendetta") + (storageKind ? " \xB7 storage: " + storageKind : "")),
        el(DText, null, startedAt ? "Running since " + new Date(startedAt).toLocaleTimeString() : "Not started \u2014 toggle the plugin off and on"),
        el(DText, null, "Flux handlers: " + handlersRegistered + "/4 \xB7 row painters: " + rowPaintersInstalled),
        lastStartError ? el(DText, null, "Last error: " + lastStartError) : null
      ),
      el(
        RowGroup,
        { title: "MessageLogger" },
        sw("enabled", "Enabled"),
        sw("logDeletes", "Log deleted messages"),
        sw("logEdits", "Log edited messages"),
        sw("ghostPings", "Ghost ping toasts", "Toast when a message mentioning you is deleted"),
        sw("colorHighlights", "Red highlight in chat", "Deleted messages stay visible with red text (Vencord style)"),
        sw("saveImages", "Save deleted images", "Downloads images from deleted messages into device storage"),
        el(DText, null, "Attachment size limit (MB) \u2014 larger files are not saved."),
        el(TextInput, {
          placeholder: "100",
          placeholderTextColor: C.sub,
          defaultValue: String((_e = settings == null ? void 0 : settings.attachmentSizeLimitMB) != null ? _e : 100),
          onChangeText: (t) => {
            var _a2, _b2;
            const n = parseFloat(t);
            if (!isNaN(n) && n >= 1 && n <= 1024) (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { attachmentSizeLimitMB: n });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Attachment file extensions \u2014 comma-separated allowlist."),
        el(TextInput, {
          placeholder: "png,jpg,jpeg,gif,webp",
          placeholderTextColor: C.sub,
          defaultValue: (_f = settings == null ? void 0 : settings.attachmentExtensions) != null ? _f : "png,jpg,jpeg,gif,webp",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { attachmentExtensions: t });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Image storage quota (GB)"),
        el(TextInput, {
          placeholder: "2",
          placeholderTextColor: C.sub,
          defaultValue: String((_g = settings == null ? void 0 : settings.imageQuotaGB) != null ? _g : 2),
          onChangeText: (t) => {
            var _a2, _b2;
            const n = parseFloat(t);
            if (!isNaN(n) && n >= 0.1 && n <= 100) (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { imageQuotaGB: n });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Used: " + (totalSavedBytes() / 1073741824).toFixed(2) + " GB \xB7 " + Object.keys(imageIndex).length + " messages with saved images"),
        sw("ignoreBots", "Ignore bot messages"),
        sw("ignoreWebhooks", "Ignore webhooks"),
        sw("ignoreSelf", "Ignore your own messages"),
        sw("ignoreSelfEdits", "Ignore your own edits"),
        sw("inlineEdits", "Inline edit history", "Show previous versions inside the message (Equicord Inline Edits)")
      ),
      el(
        RowGroup,
        { title: "Filters" },
        el(DText, null, "Whitelisted IDs \u2014 comma-separated user/channel IDs always logged, overriding ignores."),
        el(TextInput, {
          placeholder: "e.g. 123456789012345678",
          placeholderTextColor: C.sub,
          defaultValue: (_h = settings == null ? void 0 : settings.whitelistedIds) != null ? _h : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { whitelistedIds: t });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Ignored guilds \u2014 comma-separated server IDs never logged."),
        el(TextInput, {
          placeholder: "Server IDs",
          placeholderTextColor: C.sub,
          defaultValue: (_i = settings == null ? void 0 : settings.ignoredGuilds) != null ? _i : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { ignoredGuilds: t });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Time-based cleanup \u2014 remove entries older than this many minutes (0 = off)."),
        el(TextInput, {
          placeholder: "0",
          placeholderTextColor: C.sub,
          defaultValue: String((_j = settings == null ? void 0 : settings.timeBasedCleanupMinutes) != null ? _j : 0),
          onChangeText: (t) => {
            var _a2, _b2;
            const n = parseInt(t, 10);
            if (!isNaN(n) && n >= 0) (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { timeBasedCleanupMinutes: n });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        })
      ),
      el(
        RowGroup,
        { title: "Ignored IDs" },
        el(DText, null, "Comma-separated channel IDs never get logged."),
        el(TextInput, {
          placeholder: "Channel IDs",
          placeholderTextColor: C.sub,
          defaultValue: (_k = settings == null ? void 0 : settings.ignoredChannels) != null ? _k : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { ignoredChannels: t });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        el(DText, null, "Comma-separated user IDs never get logged."),
        el(TextInput, {
          placeholder: "User IDs",
          placeholderTextColor: C.sub,
          defaultValue: (_l = settings == null ? void 0 : settings.ignoredUsers) != null ? _l : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { ignoredUsers: t });
          },
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        })
      ),
      el(
        RowGroup,
        { title: "Saved log (" + visible.length + " shown)" },
        el(View, { style: { flexDirection: "row" } }, tab("all", "All"), tab("deleted", "Deleted"), tab("edited", "Edited"), tab("ghost", "Ghost pings")),
        el(TextInput, {
          placeholder: "Search author or text\u2026",
          placeholderTextColor: C.sub,
          value: query,
          onChangeText: setQuery,
          style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 }
        }),
        visible.length === 0 ? el(DText, null, "Nothing logged yet. Deleted and edited messages will appear here.") : visible.slice(0, 200).map((m) => {
          const isDel = m.ghostPing || m.status === "deleted";
          const statusColor = isDel ? C.deleted : C.edited;
          return el(
            View,
            {
              key: m.id,
              style: {
                borderLeftWidth: 3,
                borderColor: statusColor,
                backgroundColor: isDel ? C.deletedBg : C.editedBg,
                borderRadius: 6,
                padding: 10,
                marginBottom: 8
              }
            },
            el(
              Text,
              { style: { color: statusColor, fontWeight: "bold", fontSize: 12, marginBottom: 2 } },
              "[" + (m.ghostPing ? "GHOST PING" : m.status === "deleted" ? "DELETED" : "EDITED") + "] " + m.authorTag + " \u2014 " + new Date(m.timestamp).toLocaleString()
            ),
            el(Text, { style: { color: C.text } }, m.content || "(no text content)"),
            m.attachments.length > 0 && el(Text, { style: { color: C.sub, fontSize: 12 } }, m.attachments.length + " attachment(s) saved as links"),
            m.savedImages ? el(Text, { style: { color: C.sub, fontSize: 12 } }, m.savedImages + " image(s) saved to device") : null,
            m.edits.length > 0 && el(Text, { style: { color: C.sub, fontSize: 12 } }, "Previous versions: " + m.edits.join("  |  ")),
            el(
              Pressable,
              { onPress: () => void removeEntry(m.id), style: { paddingVertical: 4 } },
              el(Text, { style: { color: C.sub, fontSize: 12 } }, "Delete entry")
            )
          );
        })
      ),
      el(
        View,
        { style: { padding: 12 } },
        el(
          Pressable,
          { onPress: () => void exportLog(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { fontWeight: "bold", color: C.text } }, "Copy log JSON to clipboard")
        ),
        el(
          Pressable,
          { onPress: () => void clearLog(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { fontWeight: "bold", color: C.deleted } }, "Clear saved log")
        ),
        el(
          Pressable,
          { onPress: () => void clearImageCache(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { color: C.deleted } }, "Clear saved images")
        ),
        el(
          Pressable,
          { onPress: () => void reload(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { color: C.sub } }, "Refresh list")
        )
      )
    );
  };
}
var settingsChangedCb = null;
function notifySettingsChanged() {
  try {
    settingsChangedCb == null ? void 0 : settingsChangedCb();
  } catch {
  }
}
function classicSettingsApi() {
  return {
    use: () => ({ ...cfg }),
    set: (update) => {
      var _a;
      try {
        if (!storageProxy || typeof storageProxy !== "object") return;
        const data = (_a = hostData()) != null ? _a : {};
        const settings = { ...coerceSettings(data.settings), ...update };
        if (storageKind === "bunny") {
          storageProxy.data = { ...data, settings };
        } else {
          storageProxy.settings = settings;
        }
        refreshClassicConfig();
        notifySettingsChanged();
      } catch {
      }
    }
  };
}
function registerFluxHandlers(flux, addCleanup) {
  const register = (event, handler) => {
    try {
      const off = flux.onFluxEventDispatched(event, (payload) => {
        try {
          handler(payload);
        } catch (e) {
          hostError(event + " handler failed", e);
        }
        return payload;
      });
      if (typeof off === "function") addCleanup(off);
      handlersRegistered++;
      hostLog("registered " + event);
    } catch (e) {
      hostError("could not register " + event, e);
    }
  };
  register("MESSAGE_CREATE", handleCreate);
  register("MESSAGE_DELETE", handleDelete);
  register("MESSAGE_DELETE_BULK", handleDeleteBulk);
  register("MESSAGE_UPDATE", handleUpdate);
}
async function startNext({ cleanup, jsonStorage, logger }) {
  apiRef = { logger };
  cfgStorage = jsonStorage != null ? jsonStorage : null;
  refreshConfigFromStorage();
  if (jsonStorage) {
    try {
      await jsonStorage.get();
      refreshConfigFromStorage();
      cleanup(
        jsonStorage.subscribe(() => {
          refreshConfigFromStorage();
        })
      );
    } catch (e) {
      hostError("jsonStorage unavailable, using default settings", e);
    }
  }
  await loadLog();
  void loadImageIndex();
  runTimeBasedCleanup();
  startCleanupInterval();
  const flux = getFlux();
  if (!flux || typeof flux.onFluxEventDispatched !== "function") {
    hostError("flux API unavailable \u2014 capture disabled this session");
    toast("MessageLogger: flux unavailable", "msglogger-start-fail");
    return;
  }
  handlersRegistered = 0;
  registerFluxHandlers(flux, cleanup);
  if (!installDeleteRewrite(getRawFluxDispatcher(), cleanup)) {
    hostError("delete rewrite unavailable \u2014 deleted messages will not stay visible");
  }
  installRowPainters(cleanup);
  installSelfDeleteBypass(cleanup);
  cleanup(() => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    void persistLog();
    seen.clear();
    handlersRegistered = 0;
    startedAt = null;
    apiRef = null;
  });
  startedAt = Date.now();
  lastStartError = null;
  hostLog("started (Revenge Next)");
  toast("MessageLogger " + PLUGIN_VERSION + " started", "msglogger-started");
  alertBox("MessageLogger " + PLUGIN_VERSION, "Host: Revenge (Next)\nFlux handlers: " + handlersRegistered + "/4\nRed highlights: " + (rowPaintersInstalled + " painter(s)") + "\nImages cached: " + Object.keys(imageIndex).length + "\nIf you can read this, the new build is running.");
}
async function startClassic() {
  var _a, _b, _c, _d, _e, _f;
  const b = typeof bunny !== "undefined" && bunny || {};
  const v = typeof vendetta !== "undefined" ? vendetta : null;
  apiRef = { logger: (_c = (_b = (_a = b.plugin) == null ? void 0 : _a.logger) != null ? _b : v == null ? void 0 : v.logger) != null ? _c : null };
  try {
    if ((_d = b.plugin) == null ? void 0 : _d.createStorage) {
      const store = b.plugin.createStorage();
      const promise = store == null ? void 0 : store[Symbol.for("bunny.storage.promise")];
      if (promise && typeof promise.then === "function") await promise.catch(() => {
      });
      if (store && typeof store === "object") {
        storageProxy = store;
        storageKind = "bunny";
        const data = store.data && typeof store.data === "object" ? store.data : {};
        if (!data.settings) store.data = { ...data, settings: { ...DEFAULT_SETTINGS } };
        const emitter = store[Symbol.for("vendetta.storage.emitter")];
        const off = (_e = emitter == null ? void 0 : emitter.on) == null ? void 0 : _e.call(emitter, "SET", () => {
          try {
            refreshClassicConfig();
          } catch {
          }
        });
        if (typeof off === "function") classicDisposers.push(off);
      }
    } else if (typeof vendetta !== "undefined" && ((_f = vendetta == null ? void 0 : vendetta.plugin) == null ? void 0 : _f.storage)) {
      const store = vendetta.plugin.storage;
      if (store && typeof store === "object") {
        storageProxy = store;
        storageKind = "vendetta";
        if (!store.settings || typeof store.settings !== "object") {
          store.settings = { ...DEFAULT_SETTINGS };
        }
      }
    }
  } catch (e) {
    hostError("plugin storage unavailable, using default settings", e);
  }
  refreshClassicConfig();
  await loadLog();
  void loadImageIndex();
  runTimeBasedCleanup();
  startCleanupInterval();
  const flux = getFlux();
  if (!flux || typeof flux.onFluxEventDispatched !== "function") {
    hostError("flux API unavailable \u2014 capture disabled this session");
    toast("MessageLogger: flux unavailable", "msglogger-start-fail");
    return;
  }
  handlersRegistered = 0;
  registerFluxHandlers(flux, (off) => classicDisposers.push(off));
  if (!installDeleteRewrite(getRawFluxDispatcher(), (off) => classicDisposers.push(off))) {
    hostError("delete rewrite unavailable \u2014 deleted messages will not stay visible");
  }
  installRowPainters((off) => classicDisposers.push(off));
  installSelfDeleteBypass((off) => classicDisposers.push(off));
  startedAt = Date.now();
  lastStartError = null;
  hostLog("started (Revenge Classic / vendetta host)");
  toast("MessageLogger " + PLUGIN_VERSION + " started", "msglogger-started");
  alertBox("MessageLogger " + PLUGIN_VERSION, "Host: Classic / vendetta\nStorage: " + (storageKind != null ? storageKind : "none") + "\nFlux handlers: " + handlersRegistered + "/4\nRed highlights: " + (rowPaintersInstalled + " painter(s)") + "\nImages cached: " + Object.keys(imageIndex).length + "\nIf you can read this, the new build is running.");
}
var _SettingsComponent = null;
function SettingsComponent(props) {
  if (hostKind !== "next") refreshClassicConfig();
  try {
    if (!_SettingsComponent) _SettingsComponent = makeSettingsComponent();
    return _SettingsComponent(props);
  } catch (e) {
    try {
      const RN = getRN();
      const React = getReact();
      if (React && (RN == null ? void 0 : RN.Text)) {
        return React.createElement(
          RN.Text,
          { style: { padding: 12 } },
          "MessageLogger settings crashed: " + (e instanceof Error ? e.message : String(e))
        );
      }
    } catch {
    }
    return null;
  }
}
var __instance = {
  jsonStorage: {
    load: true,
    default: DEFAULT_SETTINGS
  },
  async start(api) {
    try {
      if (api && typeof api === "object" && (api.cleanup || api.jsonStorage)) {
        hostKind = "next";
        await startNext(api);
      } else {
        hostKind = "classic";
        await startClassic();
      }
    } catch (e) {
      hostError("start failed", e);
    }
  },
  stop() {
    var _a;
    while (classicDisposers.length) {
      try {
        (_a = classicDisposers.pop()) == null ? void 0 : _a();
      } catch {
      }
    }
    deletedMessageMap.clear();
    editedMessageMap.clear();
    highlightCreates.clear();
    highlightEdits.clear();
    manualDeletes.clear();
    imageQueue.length = 0;
    stopCleanupInterval();
    rowPaintersInstalled = 0;
    handlersRegistered = 0;
    startedAt = null;
  },
  SettingsComponent
};
if (typeof plugin === "function") {
  __instance = plugin(__instance);
}
globalThis.plugin = __instance;
__instance.onLoad = function() {
  var _a;
  return (_a = __instance.start) == null ? void 0 : _a.call(__instance);
};
__instance.onUnload = function() {
  var _a;
  return (_a = __instance.stop) == null ? void 0 : _a.call(__instance);
};
__instance.settings = __instance.SettingsComponent;
var index_default = globalThis.plugin;
; return (module.exports && module.exports.default) || module.exports; })()