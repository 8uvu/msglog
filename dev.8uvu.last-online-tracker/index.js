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
function getReact(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    const react = (_d = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.react) == null ? void 0 : _b.React) != null ? _d : (_c = api == null ? void 0 : api.react) == null ? void 0 : _c.React;
    if ((react == null ? void 0 : react.createElement) && (react == null ? void 0 : react.useState)) return react;
  } catch {
  }
  try {
    const m = getMetro();
    const r = (_h = (_g = (_e = m == null ? void 0 : m.findByDisplayName) == null ? void 0 : _e.call(m, "React")) != null ? _g : (_f = m == null ? void 0 : m.findByProps) == null ? void 0 : _f.call(m, "createElement", "cloneElement")) != null ? _h : null;
    if (r) return r;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") return (_j = (_i = revenge == null ? void 0 : revenge.react) == null ? void 0 : _i.React) != null ? _j : null;
  } catch {
  }
  return null;
}
function getRN(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    const rn = (_d = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.react) == null ? void 0 : _b.ReactNative) != null ? _d : (_c = api == null ? void 0 : api.react) == null ? void 0 : _c.ReactNative;
    if ((rn == null ? void 0 : rn.View) && (rn == null ? void 0 : rn.Text)) return rn;
  } catch {
  }
  try {
    const m = getMetro();
    const rn = (_h = (_g = (_e = m == null ? void 0 : m.findByDisplayName) == null ? void 0 : _e.call(m, "ReactNative")) != null ? _g : (_f = m == null ? void 0 : m.findByProps) == null ? void 0 : _f.call(m, "View", "Text", "TextInput")) != null ? _h : null;
    if (rn) return rn;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") return (_j = (_i = revenge == null ? void 0 : revenge.react) == null ? void 0 : _i.ReactNative) != null ? _j : null;
  } catch {
  }
  return null;
}
function findStore(name, props, api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    const s = (_f = (_c = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.discord) == null ? void 0 : _b.flux) == null ? void 0 : _c.Stores) != null ? _f : (_e = (_d = api == null ? void 0 : api.discord) == null ? void 0 : _d.flux) == null ? void 0 : _e.Stores;
    if (s == null ? void 0 : s[name]) return s[name];
  } catch {
  }
  try {
    const s = typeof revenge !== "undefined" && ((_h = (_g = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _g.flux) == null ? void 0 : _h.Stores) || null;
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
    if ((_j = (_i = v == null ? void 0 : v.metro) == null ? void 0 : _i.common) == null ? void 0 : _j[name]) return v.metro.common[name];
  } catch {
  }
  return null;
}
function getUserStore(api) {
  return findStore("UserStore", ["getCurrentUser"], api);
}
function getFlux(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    const flux = (_d = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.discord) == null ? void 0 : _b.flux) != null ? _d : (_c = api == null ? void 0 : api.discord) == null ? void 0 : _c.flux;
    if (typeof (flux == null ? void 0 : flux.onFluxEventDispatched) === "function") return flux;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") {
      const flux = (_e = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _e.flux;
      if (flux) return flux;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const flux = (_f = bunny == null ? void 0 : bunny.api) == null ? void 0 : _f.flux;
      if (flux == null ? void 0 : flux.intercept) {
        return {
          onFluxEventDispatched: (event, listener) => flux.intercept((payload) => (payload == null ? void 0 : payload.type) === event ? listener(payload) : void 0)
        };
      }
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const fd = (_j = (_h = (_g = v == null ? void 0 : v.metro) == null ? void 0 : _g.common) == null ? void 0 : _h.FluxDispatcher) != null ? _j : (_i = v == null ? void 0 : v.common) == null ? void 0 : _i.FluxDispatcher;
      if (fd == null ? void 0 : fd.addInterceptor) {
        return {
          onFluxEventDispatched: (event, listener) => fd.addInterceptor((payload) => (payload == null ? void 0 : payload.type) === event ? listener(payload) : void 0)
        };
      }
    }
  } catch {
  }
  return null;
}
function getDispatcher() {
  var _a, _b, _c, _d;
  try {
    const metro = getMetro();
    const fd = (_d = (_c = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "subscribe", "dispatch")) != null ? _c : (_b = metro == null ? void 0 : metro.common) == null ? void 0 : _b.FluxDispatcher) != null ? _d : null;
    if (fd == null ? void 0 : fd.subscribe) return fd;
  } catch {
  }
  try {
    const flux = getFlux();
    const fd = flux == null ? void 0 : flux.dispatcher;
    if (fd == null ? void 0 : fd.subscribe) return fd;
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
var settingsChangedCb = null;
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
  settingsChangedCb == null ? void 0 : settingsChangedCb();
}
var MIN_ONLINE_MS = 15e3;
var lastSeenRaw = {};
var seenOnlineAt = /* @__PURE__ */ new Map();
function presenceStatus(payload) {
  var _a, _b, _c, _d;
  const value = (_d = (_b = payload == null ? void 0 : payload.status) != null ? _b : (_a = payload == null ? void 0 : payload.presence) == null ? void 0 : _a.status) != null ? _d : (_c = payload == null ? void 0 : payload.user) == null ? void 0 : _c.status;
  const raw = typeof value === "string" ? value : value == null ? void 0 : value.status;
  if (typeof raw !== "string") return null;
  const status = raw.toLowerCase();
  return ["online", "idle", "dnd", "offline", "invisible"].includes(status) ? status : null;
}
function statusIsOnline(status) {
  return status === "online" || status === "idle" || status === "dnd";
}
var presenceEventsSeen = 0;
var departuresRecorded = 0;
var lastPresenceEventAt = 0;
function handlePresence(payload) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  try {
    const userId = String((_i = (_h = (_f = (_c = (_a = payload == null ? void 0 : payload.userId) != null ? _a : payload == null ? void 0 : payload.user_id) != null ? _c : (_b = payload == null ? void 0 : payload.user) == null ? void 0 : _b.id) != null ? _f : (_e = (_d = payload == null ? void 0 : payload.presence) == null ? void 0 : _d.user) == null ? void 0 : _e.id) != null ? _h : (_g = payload == null ? void 0 : payload.presence) == null ? void 0 : _g.userId) != null ? _i : "");
    const status = presenceStatus(payload);
    if (!userId || !status) return false;
    const now = Date.now();
    presenceEventsSeen++;
    lastPresenceEventAt = now;
    if (statusIsOnline(status)) {
      if (!seenOnlineAt.has(userId)) seenOnlineAt.set(userId, now);
      return false;
    }
    const since = seenOnlineAt.get(userId);
    seenOnlineAt.delete(userId);
    if (since == null || now - since < MIN_ONLINE_MS) return false;
    const prev = (_j = lastSeenRaw[userId]) != null ? _j : 0;
    if (now - prev < MIN_ONLINE_MS) return false;
    lastSeenRaw[userId] = now;
    departuresRecorded++;
    if (cfg.notify) {
      const u = (_l = (_k = getUserStore()) == null ? void 0 : _k.getUser) == null ? void 0 : _l.call(_k, userId);
      toast(((_n = (_m = u == null ? void 0 : u.globalName) != null ? _m : u == null ? void 0 : u.username) != null ? _n : "Someone") + " went offline");
    }
    void persistConfig();
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
  void persistConfig();
}
function seedOnlineFromStore(api) {
  try {
    const store = findStore("PresenceStore", ["getStatus"], api);
    const getter = typeof (store == null ? void 0 : store.getOnlineUserIds) === "function" ? store.getOnlineUserIds : typeof (store == null ? void 0 : store.getOnlineFriendIds) === "function" ? store.getOnlineFriendIds : null;
    const ids = getter ? getter.call(store) : null;
    if (!Array.isArray(ids)) return 0;
    const now = Date.now();
    let seeded = 0;
    for (const id of ids) {
      const key = String(id);
      if (!seenOnlineAt.has(key)) {
        seenOnlineAt.set(key, now);
        seeded++;
      }
    }
    return seeded;
  } catch {
    return 0;
  }
}
var PRESENCE_EVENTS = ["PRESENCE_UPDATE", "PRESENCE_UPDATES"];
var presenceCleanups = [];
var cleanupApi = null;
function registerPresenceCleanup(off) {
  if (typeof off === "function") {
    presenceCleanups.push(off);
    try {
      cleanupApi == null ? void 0 : cleanupApi(off);
    } catch {
    }
  }
}
function receivePresence(payload) {
  var _a, _b, _c, _d, _e;
  const updates = Array.isArray(payload == null ? void 0 : payload.updates) ? payload.updates : Array.isArray(payload == null ? void 0 : payload.presences) ? payload.presences : Array.isArray(payload == null ? void 0 : payload.users) ? payload.users : Array.isArray(payload) ? payload : [payload];
  for (const item of updates) {
    const id = (_c = (_b = (_a = item == null ? void 0 : item.user) == null ? void 0 : _a.id) != null ? _b : item == null ? void 0 : item.userId) != null ? _c : item == null ? void 0 : item.user_id;
    const clientStatus = (_e = (_d = item == null ? void 0 : item.clientStatus) != null ? _d : item == null ? void 0 : item.client_status) != null ? _e : null;
    const status = typeof (item == null ? void 0 : item.status) === "string" ? item.status : clientStatus && Object.keys(clientStatus).length ? "online" : null;
    if (id && status) handlePresence({ userId: String(id), status });
  }
  settingsChangedCb == null ? void 0 : settingsChangedCb();
}
function subscribePresence(api) {
  if (presenceCleanups.length) return true;
  const flux = getFlux(api);
  const fd = getDispatcher();
  let installed = 0;
  for (const event of PRESENCE_EVENTS) {
    const listener = (payload) => {
      receivePresence(payload);
      return payload;
    };
    try {
      if (typeof (flux == null ? void 0 : flux.onFluxEventDispatched) === "function") {
        const off = flux.onFluxEventDispatched(event, listener);
        if (typeof off === "function") {
          registerPresenceCleanup(off);
          installed++;
          continue;
        }
        if (typeof flux.removeFluxEventListener === "function") {
          registerPresenceCleanup(() => flux.removeFluxEventListener(event, listener));
          installed++;
          continue;
        }
      }
    } catch (e) {
      hostError("Revenge flux " + event + " hook failed", e);
    }
    try {
      if (typeof (flux == null ? void 0 : flux.intercept) === "function") {
        const off = flux.intercept((payload) => {
          if ((payload == null ? void 0 : payload.type) === event) return listener(payload);
          return void 0;
        });
        if (typeof off === "function") {
          registerPresenceCleanup(off);
          installed++;
          continue;
        }
      }
    } catch (e) {
      hostError("flux interceptor " + event + " hook failed", e);
    }
    try {
      if (fd == null ? void 0 : fd.subscribe) {
        fd.subscribe(event, listener);
        registerPresenceCleanup(() => {
          var _a;
          return (_a = fd.unsubscribe) == null ? void 0 : _a.call(fd, event, listener);
        });
        installed++;
      }
    } catch (e) {
      hostError("subscribe " + event + " failed", e);
    }
  }
  return installed > 0;
}
function unsubscribePresence() {
  var _a;
  while (presenceCleanups.length) {
    try {
      (_a = presenceCleanups.pop()) == null ? void 0 : _a();
    } catch {
    }
  }
}
var cleanupFns = [];
async function startNext(api) {
  try {
    await startPlugin(api);
  } catch (e) {
    hostError("start failed", e);
  }
}
async function startPlugin(api) {
  var _a, _b, _c;
  jsonStorageApi = (_a = api == null ? void 0 : api.jsonStorage) != null ? _a : getStorage();
  cleanupApi = typeof (api == null ? void 0 : api.cleanup) === "function" ? api.cleanup : null;
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
  if (!subscribePresence(api)) hostError("no presence event API found; tracking is inactive");
  seedOnlineFromStore(api);
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
  cleanupApi = null;
  settingsChangedCb = null;
}
function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return Math.floor(diff / 6e4) + "m ago";
  if (diff < 864e5) return Math.floor(diff / 36e5) + "h ago";
  return Math.floor(diff / 864e5) + "d ago";
}
function isDarkTheme() {
  var _a, _b, _c, _d;
  try {
    const tm = (_b = (_a = getMetro()) == null ? void 0 : _a.findByProps) == null ? void 0 : _b.call(_a, "theme", "setTheme");
    const t = (_d = (_c = tm == null ? void 0 : tm.theme) != null ? _c : tm == null ? void 0 : tm.resolvedTheme) != null ? _d : tm == null ? void 0 : tm.currentTheme;
    if (t) return String(t).toLowerCase().includes("dark");
  } catch {
  }
  return true;
}
function resolveDesign(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const candidates = [api == null ? void 0 : api.design, (_a = api == null ? void 0 : api.discord) == null ? void 0 : _a.design, (_c = (_b = api == null ? void 0 : api.unscoped) == null ? void 0 : _b.discord) == null ? void 0 : _c.design, (_d = api == null ? void 0 : api.unscoped) == null ? void 0 : _d.design];
  for (const candidate of candidates) {
    try {
      const d = (_e = candidate == null ? void 0 : candidate.Design) != null ? _e : candidate;
      if (d && (d.TableRowGroup || d.TableSwitchRow || d.TableRow)) return d;
    } catch {
    }
  }
  try {
    const g = (_g = (_f = globalThis.revenge) == null ? void 0 : _f.discord) == null ? void 0 : _g.design;
    const d = (_h = g == null ? void 0 : g.Design) != null ? _h : g;
    if (d && (d.TableRowGroup || d.TableSwitchRow || d.TableRow)) return d;
  } catch {
  }
  try {
    const b = (_i = globalThis.bunny) == null ? void 0 : _i.ui;
    if (b == null ? void 0 : b.FormTableRowGroup) return b;
  } catch {
  }
  return null;
}
function buildSettingsComponent(api) {
  var _a, _b, _c, _d, _e, _f;
  const React = getReact(api);
  if (!(React == null ? void 0 : React.createElement) || typeof React.useState !== "function") return null;
  const el = React.createElement;
  const RN = (_a = getRN(api)) != null ? _a : {};
  const View = (_b = RN.View) != null ? _b : "view";
  const Text = (_c = RN.Text) != null ? _c : "text";
  const Pressable = (_d = RN.Pressable) != null ? _d : View;
  const ScrollView = (_e = RN.ScrollView) != null ? _e : View;
  const Switch = (_f = RN.Switch) != null ? _f : null;
  const C = isDarkTheme() ? { text: "#ffffff", sub: "#9ba0a8", card: "#1a1b1e", accent: "#5865F2", danger: "#f04747" } : { text: "#060607", sub: "#5c5e66", card: "#ffffff", accent: "#5865F2", danger: "#d83c3e" };
  const kids = (c) => Array.isArray(c) ? c : c == null ? [] : [c];
  const D = resolveDesign(api);
  function Group(props) {
    if (D == null ? void 0 : D.TableRowGroup) {
      return el(D.TableRowGroup, { title: props.title, description: props.description }, ...kids(props.children));
    }
    return el(
      View,
      { style: { marginTop: 16 } },
      el(Text, { style: { color: C.text, fontSize: 15, fontWeight: "600", paddingHorizontal: 16, marginBottom: 4 } }, props.title),
      props.description ? el(Text, { style: { color: C.sub, fontSize: 13, paddingHorizontal: 16, marginBottom: 6 } }, props.description) : null,
      el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 4 } }, ...kids(props.children))
    );
  }
  function ToggleRow(props) {
    if (D == null ? void 0 : D.TableSwitchRow) {
      return el(D.TableSwitchRow, {
        label: props.label,
        subLabel: props.subLabel,
        value: !!props.value,
        onValueChange: props.onValueChange
      });
    }
    const control = Switch ? el(Switch, {
      value: !!props.value,
      onValueChange: props.onValueChange,
      accessibilityLabel: props.label,
      trackColor: { false: "rgba(128,128,128,0.35)", true: C.accent },
      thumbColor: "#ffffff"
    }) : el(Text, {
      accessibilityLabel: props.label,
      style: { color: C.accent, fontWeight: "700" },
      onPress: () => props.onValueChange(!props.value)
    }, props.value ? "On" : "Off");
    return el(
      View,
      { style: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 } },
      el(
        View,
        { style: { flex: 1, paddingRight: 12 } },
        el(Text, { style: { color: C.text, fontSize: 16 } }, props.label),
        props.subLabel ? el(Text, { style: { color: C.sub, fontSize: 13, marginTop: 2 } }, props.subLabel) : null
      ),
      control
    );
  }
  function InfoRow(props) {
    if (D == null ? void 0 : D.TableRow) {
      return el(D.TableRow, {
        label: props.label,
        subLabel: props.subLabel,
        variant: props.danger ? "danger" : void 0,
        onPress: props.onPress
      });
    }
    return el(
      Pressable,
      {
        onPress: props.onPress,
        accessibilityLabel: props.label,
        style: { paddingVertical: 10, paddingHorizontal: 16 }
      },
      el(Text, { style: { color: props.danger ? C.danger : C.text, fontSize: 16 } }, props.label),
      props.subLabel ? el(Text, { style: { color: C.sub, fontSize: 13, marginTop: 2 } }, props.subLabel) : null
    );
  }
  return function LastOnlineSettings(props) {
    var _a2, _b2, _c2, _d2, _e2, _f2;
    const settingsApi = (_a2 = props == null ? void 0 : props.api) != null ? _a2 : api;
    const storage = (_b2 = settingsApi == null ? void 0 : settingsApi.jsonStorage) != null ? _b2 : jsonStorageApi;
    jsonStorageApi = storage;
    const [, force] = React.useState(0);
    React.useEffect(() => {
      settingsChangedCb = () => force((n) => n + 1);
      return () => {
        settingsChangedCb = null;
      };
    }, []);
    let stored = {};
    try {
      stored = (_e2 = (_d2 = (_c2 = storage == null ? void 0 : storage.use) == null ? void 0 : _c2.call(storage)) != null ? _d2 : storage == null ? void 0 : storage.cache) != null ? _e2 : {};
    } catch {
      stored = (_f2 = storage == null ? void 0 : storage.cache) != null ? _f2 : {};
    }
    const persist = typeof (stored == null ? void 0 : stored.persist) === "boolean" ? stored.persist : cfg.persist;
    const notify = typeof (stored == null ? void 0 : stored.notify) === "boolean" ? stored.notify : cfg.notify;
    const entries = Object.entries(getLastSeen()).filter(([, ts]) => typeof ts === "number" && ts > 0).sort((a, b) => b[1] - a[1]).slice(0, 80).map(([id, ts]) => {
      var _a3, _b3, _c3, _d3, _e3;
      const user = (_b3 = (_a3 = getUserStore(settingsApi)) == null ? void 0 : _a3.getUser) == null ? void 0 : _b3.call(_a3, id);
      return { id, ts, name: String((_e3 = (_d3 = (_c3 = user == null ? void 0 : user.globalName) != null ? _c3 : user == null ? void 0 : user.global_name) != null ? _d3 : user == null ? void 0 : user.username) != null ? _e3 : "User " + id) };
    });
    const tracking = presenceCleanups.length > 0;
    return el(
      ScrollView,
      { contentContainerStyle: { paddingBottom: 24 } },
      el(
        Group,
        { title: "LastOnlineTracker", description: "Records when friends go offline, from presence changes this plugin witnessed." },
        el(ToggleRow, {
          label: "Keep last-seen times across restarts",
          subLabel: "Save recorded departures on this device.",
          value: persist,
          onValueChange: (value) => {
            var _a3;
            cfg.persist = value;
            void ((_a3 = storage == null ? void 0 : storage.set) == null ? void 0 : _a3.call(storage, { persist: value, lastSeen: value ? getLastSeen() : {} }));
            settingsChangedCb == null ? void 0 : settingsChangedCb();
          }
        }),
        el(ToggleRow, {
          label: "Offline notifications",
          subLabel: "Show a notification when someone goes offline.",
          value: notify,
          onValueChange: (value) => {
            var _a3;
            cfg.notify = value;
            void ((_a3 = storage == null ? void 0 : storage.set) == null ? void 0 : _a3.call(storage, { notify: value }));
            settingsChangedCb == null ? void 0 : settingsChangedCb();
          }
        })
      ),
      el(
        Group,
        { title: "Last online", description: "Only departures observed after at least 15 seconds online are recorded." },
        ...entries.length ? entries.map((entry) => el(InfoRow, {
          key: entry.id,
          label: entry.name,
          subLabel: "Offline " + relTime(entry.ts)
        })) : [el(InfoRow, {
          key: "empty",
          label: "No departures recorded yet",
          subLabel: tracking ? "Tracking is active; this list fills as friends go offline." : "Tracking is inactive: presence events are not reaching the plugin."
        })]
      ),
      el(
        Group,
        { title: "History controls" },
        el(InfoRow, {
          label: "Clear last-online history",
          subLabel: "Remove every saved departure from this device.",
          danger: true,
          onPress: () => {
            clearLastSeen();
          }
        }),
        el(InfoRow, {
          label: tracking ? "Tracking active" : "Tracking inactive",
          subLabel: `${presenceEventsSeen} presence updates \xB7 ${departuresRecorded} departures recorded`
        })
      )
    );
  };
}
var __builtSettings = null;
var __instance = {
  jsonStorage: { load: true, default: { persist: true, notify: false, lastSeen: {} } },
  start: startNext,
  stop: stopNext,
  SettingsComponent: function(props) {
    var _a, _b, _c, _d;
    const api = (_b = (_a = props == null ? void 0 : props.api) != null ? _a : jsonStorageApi) != null ? _b : null;
    const React = getReact(api);
    if (!(React == null ? void 0 : React.createElement)) return null;
    try {
      if (!__builtSettings) __builtSettings = buildSettingsComponent(api);
      if (__builtSettings) return React.createElement(__builtSettings, { api });
    } catch (e) {
      hostError("settings build failed", e);
    }
    const RN = (_c = getRN(api)) != null ? _c : {};
    return React.createElement((_d = RN.Text) != null ? _d : "text", null, "LastOnlineTracker settings could not load on this build.");
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
  MIN_ONLINE_MS,
  getDiagnostics: () => ({ subscribed: presenceCleanups.length > 0, eventsSeen: presenceEventsSeen, departuresRecorded, lastEventAt: lastPresenceEventAt })
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
__instance.settingsComponentLazy = __instance.SettingsComponent;
var index_default = __instance;
; return (module.exports && module.exports.default) || module.exports; })()