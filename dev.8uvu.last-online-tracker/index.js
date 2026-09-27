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

// plugins/dev.8uvu.last-online-tracker/js/index.tsx
var index_exports = {};
__export(index_exports, {
  clearLastSeen: () => clearLastSeen,
  default: () => index_default,
  getLastSeen: () => getLastSeen,
  handlePresence: () => handlePresence
});
module.exports = __toCommonJS(index_exports);
function getMetro() {
  var _a, _b, _c, _d, _e;
  try {
    if (typeof revenge !== "undefined") return (_c = (_b = revenge == null ? void 0 : revenge.metro) != null ? _b : (_a = revenge == null ? void 0 : revenge.internal) == null ? void 0 : _a.metro) != null ? _c : null;
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") return (_d = bunny == null ? void 0 : bunny.metro) != null ? _d : null;
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") return (_e = vendetta == null ? void 0 : vendetta.metro) != null ? _e : null;
  } catch {
  }
  return null;
}
function getReact() {
  var _a, _b, _c, _d, _e, _f;
  try {
    const m = getMetro();
    const r = (_d = (_c = (_a = m == null ? void 0 : m.findByDisplayName) == null ? void 0 : _a.call(m, "React")) != null ? _c : (_b = m == null ? void 0 : m.findByProps) == null ? void 0 : _b.call(m, "createElement", "cloneElement")) != null ? _d : null;
    if (r) return r;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") return (_f = (_e = revenge == null ? void 0 : revenge.react) == null ? void 0 : _e.React) != null ? _f : null;
  } catch {
  }
  return null;
}
function getRN() {
  var _a, _b, _c, _d, _e, _f;
  try {
    const m = getMetro();
    const rn = (_d = (_c = (_a = m == null ? void 0 : m.findByDisplayName) == null ? void 0 : _a.call(m, "ReactNative")) != null ? _c : (_b = m == null ? void 0 : m.findByProps) == null ? void 0 : _b.call(m, "View", "Text", "TextInput")) != null ? _d : null;
    if (rn) return rn;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") return (_f = (_e = revenge == null ? void 0 : revenge.react) == null ? void 0 : _e.ReactNative) != null ? _f : null;
  } catch {
  }
  return null;
}
function findStore(name, props) {
  var _a, _b, _c, _d;
  try {
    const s = typeof revenge !== "undefined" && ((_b = (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.flux) == null ? void 0 : _b.Stores) || null;
    if (s == null ? void 0 : s[name]) return s[name];
  } catch {
  }
  try {
    const metro = getMetro();
    if (metro == null ? void 0 : metro.findByStoreName) {
      const m = metro.findByStoreName(name);
      if (m) return m;
    }
    if (metro == null ? void 0 : metro.findByProps) {
      const m = metro.findByProps(...props);
      if (m) return m;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    if ((_d = (_c = v == null ? void 0 : v.metro) == null ? void 0 : _c.common) == null ? void 0 : _d[name]) return v.metro.common[name];
  } catch {
  }
  return null;
}
function getUserStore() {
  return findStore("UserStore", ["getCurrentUser"]);
}
function getDispatcher() {
  var _a, _b, _c, _d, _e, _f;
  try {
    const metro = getMetro();
    const fd = (_d = (_c = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "subscribe", "dispatch")) != null ? _c : (_b = metro == null ? void 0 : metro.common) == null ? void 0 : _b.FluxDispatcher) != null ? _d : null;
    if (fd == null ? void 0 : fd.dispatch) return fd;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") {
      const fd = (_f = (_e = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _e.flux) == null ? void 0 : _f.dispatcher;
      if (fd == null ? void 0 : fd.dispatch) return fd;
    }
  } catch {
  }
  return null;
}
function getStorage() {
  var _a, _b, _c, _d;
  try {
    if (typeof revenge !== "undefined") return (_d = (_c = (_a = revenge == null ? void 0 : revenge.plugin) == null ? void 0 : _a.jsonStorage) != null ? _c : (_b = revenge == null ? void 0 : revenge.api) == null ? void 0 : _b.jsonStorage) != null ? _d : null;
  } catch {
  }
  return null;
}
function getActions() {
  var _a, _b, _c, _d, _e;
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
  return null;
}
function toast(content) {
  var _a, _b, _c, _d, _e, _f;
  const text = String(content != null ? content : "");
  try {
    const actions = getActions();
    const open = (_b = (_a = actions == null ? void 0 : actions.ToastActionCreators) == null ? void 0 : _a.open) != null ? _b : actions == null ? void 0 : actions.open;
    if (typeof open === "function") {
      open({ key: "lot-" + Date.now(), content: text });
      return;
    }
  } catch {
  }
  try {
    const RN = getRN();
    (_f = (_c = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _c.show) == null ? void 0 : _f.call(_c, text, (_e = (_d = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _d.SHORT) != null ? _e : 0);
  } catch {
  }
}
function hostError(msg, e) {
  var _a, _b;
  try {
    const logger = typeof revenge !== "undefined" && (revenge == null ? void 0 : revenge.logger) || typeof bunny !== "undefined" && ((_a = bunny == null ? void 0 : bunny.plugin) == null ? void 0 : _a.logger) || console;
    (_b = logger == null ? void 0 : logger.error) == null ? void 0 : _b.call(logger, "[last-online-tracker] " + msg, e != null ? e : "");
  } catch {
  }
}
var cfg = {
  persist: true,
  // keep last-seen times across restarts
  notify: false
  // toast when a tracked friend goes offline
};
var jsonStorageApi = null;
async function loadConfig() {
  var _a, _b;
  try {
    const data = (_b = await ((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.get) == null ? void 0 : _a.call(jsonStorageApi))) != null ? _b : {};
    if (data && typeof data === "object") {
      if (typeof data.persist === "boolean") cfg.persist = data.persist;
      if (typeof data.notify === "boolean") cfg.notify = data.notify;
    }
  } catch (e) {
    hostError("loadConfig failed", e);
  }
}
async function persistConfig() {
  var _a;
  try {
    await ((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.set) == null ? void 0 : _a.call(jsonStorageApi, { ...cfg, lastSeen: cfg.persist ? lastSeenRaw : {} }));
  } catch (e) {
    hostError("persistConfig failed", e);
  }
}
var MIN_ONLINE_MS = 15e3;
var lastSeenRaw = {};
var seenOnlineAt = /* @__PURE__ */ new Map();
function statusIsOnline(status) {
  const s = typeof status === "string" ? status : status == null ? void 0 : status.status;
  return s === "online" || s === "idle" || s === "dnd";
}
function handlePresence(payload) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    const userId = String((_c = (_b = payload == null ? void 0 : payload.userId) != null ? _b : (_a = payload == null ? void 0 : payload.user) == null ? void 0 : _a.id) != null ? _c : "");
    if (!userId) return false;
    const online = statusIsOnline(payload == null ? void 0 : payload.status);
    const now = Date.now();
    if (online) {
      if (!seenOnlineAt.has(userId)) seenOnlineAt.set(userId, now);
      return false;
    }
    const since = seenOnlineAt.get(userId);
    if (since == null || now - since < MIN_ONLINE_MS) return false;
    const prev = (_d = lastSeenRaw[userId]) != null ? _d : 0;
    if (now - prev < MIN_ONLINE_MS) return false;
    lastSeenRaw[userId] = now;
    if (cfg.notify) {
      const u = (_f = (_e = getUserStore()) == null ? void 0 : _e.getUser) == null ? void 0 : _f.call(_e, userId);
      toast(((_h = (_g = u == null ? void 0 : u.globalName) != null ? _g : u == null ? void 0 : u.username) != null ? _h : "Someone") + " went offline");
    }
    persistConfig();
    return true;
  } catch {
    return false;
  }
}
function getLastSeen() {
  return { ...lastSeenRaw };
}
function clearLastSeen() {
  for (const k of Object.keys(lastSeenRaw)) delete lastSeenRaw[k];
  persistConfig();
}
var subscribed = false;
var presenceHandler = null;
function subscribePresence() {
  try {
    const fd = getDispatcher();
    if (!(fd == null ? void 0 : fd.subscribe)) return false;
    presenceHandler = (p) => {
      try {
        handlePresence(p);
      } catch {
      }
    };
    fd.subscribe("PRESENCE_UPDATE", presenceHandler);
    subscribed = true;
    return true;
  } catch (e) {
    hostError("subscribePresence failed", e);
    return false;
  }
}
function unsubscribePresence() {
  var _a, _b;
  try {
    if (subscribed && presenceHandler) {
      (_b = (_a = getDispatcher()) == null ? void 0 : _a.unsubscribe) == null ? void 0 : _b.call(_a, "PRESENCE_UPDATE", presenceHandler);
    }
  } catch {
  }
  subscribed = false;
  presenceHandler = null;
}
var cleanupFns = [];
async function startNext(api) {
  var _a, _b, _c;
  jsonStorageApi = (_a = api == null ? void 0 : api.jsonStorage) != null ? _a : getStorage();
  await loadConfig();
  try {
    const data = (_c = await ((_b = jsonStorageApi == null ? void 0 : jsonStorageApi.get) == null ? void 0 : _b.call(jsonStorageApi))) != null ? _c : {};
    if (cfg.persist && (data == null ? void 0 : data.lastSeen) && typeof data.lastSeen === "object") {
      for (const [k, v] of Object.entries(data.lastSeen)) {
        if (typeof v === "number" && v > 0) lastSeenRaw[k] = v;
      }
    }
  } catch (e) {
    hostError("restore lastSeen failed", e);
  }
  subscribePresence();
}
async function stopNext() {
  unsubscribePresence();
  cleanupFns.forEach((f) => {
    try {
      f();
    } catch {
    }
  });
  cleanupFns = [];
  await persistConfig();
}
function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return Math.floor(diff / 6e4) + "m ago";
  if (diff < 864e5) return Math.floor(diff / 36e5) + "h ago";
  return Math.floor(diff / 864e5) + "d ago";
}
function buildSettingsComponent() {
  const React = getReact();
  const RN = getRN();
  if (!React || !RN) return null;
  const el = React.createElement;
  const { View = "view", Text = "text", TextInput = "input", Pressable = View, ScrollView = View, Switch = null } = RN;
  const isDark = (() => {
    var _a, _b, _c, _d, _e;
    try {
      const tm = (_c = findStore("ThemeManager", ["theme", "resolvedTheme"])) != null ? _c : (_b = (_a = getMetro()) == null ? void 0 : _a.findByProps) == null ? void 0 : _b.call(_a, "theme", "setTheme");
      const t = (_e = (_d = tm == null ? void 0 : tm.theme) != null ? _d : tm == null ? void 0 : tm.resolvedTheme) != null ? _e : tm == null ? void 0 : tm.currentTheme;
      if (t) return String(t).toLowerCase().includes("dark");
    } catch {
    }
    return true;
  })();
  const C = isDark ? { bg: "#111214", card: "#1a1b1e", text: "#ffffff", sub: "#9ba0a8", input: "#232428", chip: "#2b2d31", blurple: "#5865F2", danger: "#f04747", ok: "#23a55a" } : { bg: "#f2f3f5", card: "#ffffff", text: "#060607", sub: "#5c5e66", input: "#ebedef", chip: "#e3e5e8", blurple: "#5865F2", danger: "#d83c3e", ok: "#248046" };
  function Card(props) {
    const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
    return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
  }
  function Label(props) {
    return el(Text, { style: { color: C.sub, fontSize: 12, fontWeight: "700", marginBottom: 4 } }, props.children);
  }
  function Input(props) {
    return el(TextInput, {
      placeholderTextColor: C.sub,
      ...props,
      style: [{ backgroundColor: C.input, color: C.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginBottom: 8 }, props.style]
    });
  }
  function Btn(props) {
    return el(
      Pressable,
      { onPress: props.onPress, style: [{ backgroundColor: props.danger ? C.danger : C.blurple, borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 2 }, props.style] },
      el(Text, { style: { color: "#ffffff", fontWeight: "700", fontSize: 14 } }, props.label)
    );
  }
  function SwitchRow(props) {
    const toggle = Switch ? el(Switch, { value: !!props.value, onValueChange: props.onValueChange, trackColor: { false: "rgba(128,128,128,0.35)", true: C.blurple }, thumbColor: "#ffffff" }) : el(Text, { style: { color: C.sub }, onPress: () => props.onValueChange(!props.value) }, props.value ? "On" : "Off");
    return el(
      View,
      { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 } },
      el(Text, { style: { color: C.text, fontSize: 15, flex: 1, paddingRight: 12 } }, props.label),
      toggle
    );
  }
  return function LastOnlineSettings(props) {
    var _a;
    if (jsonStorageApi == null && ((_a = props == null ? void 0 : props.api) == null ? void 0 : _a.jsonStorage)) {
      jsonStorageApi = props.api.jsonStorage;
    }
    const [, force] = React.useState(0);
    const [q, setQ] = React.useState("");
    const entries = Object.entries(getLastSeen()).map(([id, ts]) => {
      var _a2, _b, _c, _d, _e;
      const u = (_b = (_a2 = getUserStore()) == null ? void 0 : _a2.getUser) == null ? void 0 : _b.call(_a2, id);
      return { id, ts, name: String((_e = (_d = (_c = u == null ? void 0 : u.globalName) != null ? _c : u == null ? void 0 : u.global_name) != null ? _d : u == null ? void 0 : u.username) != null ? _e : "ID " + id) };
    }).filter((e) => !q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.ts - a.ts);
    const kids = [
      el(
        View,
        { key: "head", style: { paddingHorizontal: 14, paddingTop: 8 } },
        el(Text, { style: { color: C.text, fontSize: 16, fontWeight: "800" } }, "LastOnlineTracker"),
        el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, "Records when people go offline \u2014 departures you actually saw. Discord never shows this."),
        el(Text, { style: { color: C.sub, fontSize: 11, marginTop: 4 } }, "A timestamp is only written after watching someone online for 15s+, so opening a server can't fake an exodus.")
      )
    ];
    kids.push(el(
      View,
      { key: "search", style: { paddingHorizontal: 14, marginTop: 8 } },
      el(Label, null, "Search recorded people"),
      el(Input, { placeholder: "name\u2026", value: q, onChangeText: (t) => setQ(t) })
    ));
    kids.push(el(
      Card,
      { key: "list" },
      entries.length === 0 ? el(Text, { style: { color: C.sub, fontSize: 13, paddingHorizontal: 14, paddingVertical: 10 } }, "Nobody recorded yet \u2014 it fills as you watch friends go offline.") : entries.slice(0, 80).map((e) => el(
        View,
        { key: e.id, style: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.input, flexDirection: "row", justifyContent: "space-between" } },
        el(Text, { style: { color: C.text, fontSize: 14, flex: 1 } }, e.name),
        el(Text, { style: { color: C.sub, fontSize: 13 } }, "offline " + relTime(e.ts))
      ))
    ));
    kids.push(el(
      Card,
      { key: "opts" },
      el(SwitchRow, { label: "Keep last-seen times across restarts", value: cfg.persist, onValueChange: (v) => {
        cfg.persist = v;
        persistConfig();
        force((n) => n + 1);
      } }),
      el(SwitchRow, { label: "Toast when someone goes offline", value: cfg.notify, onValueChange: (v) => {
        cfg.notify = v;
        persistConfig();
        force((n) => n + 1);
      } })
    ));
    kids.push(el(
      View,
      { key: "clear", style: { paddingHorizontal: 12, marginTop: 8 } },
      el(Btn, {
        label: "Clear all recorded times",
        danger: true,
        onPress: () => {
          clearLastSeen();
          force((n) => n + 1);
          toast("Last-seen times cleared");
        }
      })
    ));
    return el(ScrollView, { style: { flex: 1, backgroundColor: C.bg } }, ...kids);
  };
}
var __builtSettings = null;
var __instance = {
  start: startNext,
  stop: stopNext,
  settingsComponentLazy: function(props) {
    var _a, _b;
    try {
      if (!__builtSettings) __builtSettings = buildSettingsComponent();
      if (__builtSettings) return __builtSettings(props);
    } catch (e) {
      hostError("settings build failed", e);
    }
    const React = getReact();
    const RN = getRN();
    const el = React == null ? void 0 : React.createElement;
    if (el && RN) return el((_a = RN.View) != null ? _a : "view", null, el((_b = RN.Text) != null ? _b : "text", null, "LastOnlineTracker: UI unavailable on this host"));
    return null;
  }
};
__instance.__engine = {
  handlePresence,
  getLastSeen,
  clearLastSeen,
  getConfig: () => ({ ...cfg }),
  setConfig: (patch) => {
    if (patch && typeof patch === "object") Object.assign(cfg, patch);
  },
  MIN_ONLINE_MS
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
__instance.settings = __instance.settingsComponentLazy;
var index_default = __instance;
; return (module.exports && module.exports.default) || module.exports; })()