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

// plugins/dev.8uvu.platform-spoofer/js/index.tsx
var index_exports = {};
__export(index_exports, {
  PLATFORMS: () => PLATFORMS,
  default: () => index_default,
  mergeIdentifyProps: () => mergeIdentifyProps,
  platformProps: () => platformProps
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
function getStorage() {
  var _a, _b, _c, _d;
  try {
    if (typeof revenge !== "undefined") return (_d = (_c = (_a = revenge == null ? void 0 : revenge.plugin) == null ? void 0 : _a.jsonStorage) != null ? _c : (_b = revenge == null ? void 0 : revenge.api) == null ? void 0 : _b.jsonStorage) != null ? _d : null;
  } catch {
  }
  return null;
}
function hostError(msg, e) {
  var _a, _b;
  try {
    const logger = typeof revenge !== "undefined" && (revenge == null ? void 0 : revenge.logger) || typeof bunny !== "undefined" && ((_a = bunny == null ? void 0 : bunny.plugin) == null ? void 0 : _a.logger) || console;
    (_b = logger == null ? void 0 : logger.error) == null ? void 0 : _b.call(logger, "[platform-spoofer] " + msg, e != null ? e : "");
  } catch {
  }
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
      open({ key: "spoofer-" + Date.now(), content: text });
      return;
    }
  } catch {
  }
  try {
    const RN = getRN();
    (_f = (_c = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _c.show) == null ? void 0 : _f.call(_c, text, (_e = (_d = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _d.SHORT) != null ? _e : 0);
  } catch {
  }
  hostError("no toast channel available");
}
var PLATFORMS = [
  { key: "desktop", label: "Desktop", browser: "Discord Client" },
  { key: "web", label: "Web", browser: "Discord Web" },
  { key: "android", label: "Android", browser: "Discord Android" },
  { key: "ios", label: "iOS", browser: "Discord iOS" },
  { key: "xbox", label: "Xbox", browser: "Discord Embedded" },
  { key: "playstation", label: "PlayStation", browser: "Discord Embedded" },
  { key: "vr", label: "VR", browser: "Discord VR" }
];
function platformProps(key) {
  const p = PLATFORMS.find((x) => x.key === key);
  return p ? { browser: p.browser } : null;
}
var cfg = {
  enabled: false,
  platform: "desktop"
};
var jsonStorageApi = null;
async function loadConfig() {
  var _a, _b;
  try {
    const data = (_b = await ((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.get) == null ? void 0 : _a.call(jsonStorageApi))) != null ? _b : {};
    if (data && typeof data === "object") {
      if (typeof data.enabled === "boolean") cfg.enabled = data.enabled;
      if (typeof data.platform === "string" && platformProps(data.platform)) cfg.platform = data.platform;
    }
  } catch (e) {
    hostError("loadConfig failed", e);
  }
}
async function persistConfig() {
  var _a;
  try {
    await ((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.set) == null ? void 0 : _a.call(jsonStorageApi, { ...cfg }));
  } catch (e) {
    hostError("persistConfig failed", e);
  }
}
function refreshConfigFromStorage() {
  var _a, _b;
  try {
    const data = (_b = (_a = jsonStorageApi == null ? void 0 : jsonStorageApi.use) == null ? void 0 : _a.call(jsonStorageApi)) != null ? _b : null;
    if (data && typeof data === "object") {
      if (typeof data.enabled === "boolean") cfg.enabled = data.enabled;
      if (typeof data.platform === "string" && platformProps(data.platform)) cfg.platform = data.platform;
    }
  } catch {
  }
}
async function updateConfig(patch) {
  if (!patch || typeof patch !== "object") return;
  if (typeof patch.enabled === "boolean") cfg.enabled = patch.enabled;
  if (typeof patch.platform === "string" && platformProps(patch.platform)) cfg.platform = patch.platform;
  await persistConfig();
  if (cfg.enabled) {
    if (!installPatch()) hostError("no gateway identify surface found; spoofer inactive");
  } else {
    uninstallPatch();
  }
}
var activePatch = null;
function mergeIdentifyProps(original) {
  if (!cfg.enabled) return original;
  const props = platformProps(cfg.platform);
  if (!props) return original;
  if (original && typeof original === "object") {
    return { ...original, ...props };
  }
  return { ...props, os: cfg.platform };
}
function patchTarget(target, method, describe) {
  try {
    const original = target == null ? void 0 : target[method];
    if (typeof original !== "function") return null;
    const owner = target;
    let patched = original;
    const wrapped = function(...args) {
      try {
        if (cfg.enabled && args.length >= 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
          args[0] = mergeIdentifyProps(args[0]);
        }
      } catch {
      }
      return original.apply(this, args);
    };
    try {
      for (const k of Object.keys(original)) {
        try {
          wrapped[k] = original[k];
        } catch {
        }
      }
    } catch {
    }
    owner[method] = wrapped;
    patched = wrapped;
    void patched;
    return {
      describe,
      restore: () => {
        try {
          if (owner[method] === wrapped) owner[method] = original;
        } catch {
        }
      }
    };
  } catch {
    return null;
  }
}
function findIdentifySurfaces() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const out = [];
  const metro = getMetro();
  try {
    const socket = (_c = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "_doIdentify")) != null ? _c : (_b = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _b.call(metro, "identify", "getGatewayIntents");
    if (socket) {
      for (const m of Object.keys(socket)) {
        if (m === "_doIdentify" || m === "identify") {
          out.push({ target: socket, method: m, describe: "gateway." + m });
        }
      }
    }
  } catch {
  }
  try {
    const conn = (_f = (_d = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _d.call(metro, "getConnectionURL")) != null ? _f : (_e = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _e.call(metro, "connect", "identify");
    if (conn && typeof conn.connect === "function") {
      out.push({ target: conn, method: "connect", describe: "gateway.connect" });
    }
  } catch {
  }
  try {
    const propsMod = (_i = (_g = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _g.call(metro, "getProperties", "browser")) != null ? _i : (_h = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _h.call(metro, "getProperties", "os");
    if (propsMod && typeof propsMod.getProperties === "function") {
      out.push({ target: propsMod, method: "getProperties", describe: "gateway.getProperties" });
    }
  } catch {
  }
  return out;
}
function installPatch() {
  if (activePatch) return true;
  const surfaces = findIdentifySurfaces();
  for (const s of surfaces) {
    const p = s.method === "getProperties" ? patchResultTarget(s.target, s.method) : patchTarget(s.target, s.method, s.describe);
    if (p) {
      activePatch = p;
      return true;
    }
  }
  return false;
}
function uninstallPatch() {
  try {
    activePatch == null ? void 0 : activePatch.restore();
  } catch (e) {
    hostError("patch restore failed", e);
  }
  activePatch = null;
}
function patchResultTarget(target, method) {
  try {
    const original = target == null ? void 0 : target[method];
    if (typeof original !== "function") return null;
    const owner = target;
    const wrapped = function(...args) {
      const result = original.apply(this, args);
      try {
        if (cfg.enabled && result && typeof result === "object" && !Array.isArray(result)) {
          const props = platformProps(cfg.platform);
          if (props) return { ...result, ...props };
        }
      } catch {
      }
      return result;
    };
    owner[method] = wrapped;
    return {
      describe: method,
      restore: () => {
        try {
          if (owner[method] === wrapped) owner[method] = original;
        } catch {
        }
      }
    };
  } catch {
    return null;
  }
}
var cleanupFns = [];
async function startNext(api) {
  var _a;
  jsonStorageApi = (_a = api == null ? void 0 : api.jsonStorage) != null ? _a : getStorage();
  await loadConfig();
  if (cfg.enabled) {
    const ok = installPatch();
    if (!ok) hostError("no gateway identify surface found; spoofer inactive");
  }
}
async function stopNext() {
  uninstallPatch();
  cleanupFns.forEach((f) => {
    try {
      f();
    } catch {
    }
  });
  cleanupFns = [];
}
function buildSettingsComponent() {
  const React = getReact();
  const RN = getRN();
  if (!React || !RN) return null;
  const el = React.createElement;
  const { View = "view", Text = "text", Pressable = View, ScrollView = View, Switch = null } = RN;
  const isDark = (() => {
    var _a, _b, _c, _d, _e;
    try {
      const m = getMetro();
      const tm = (_c = (_a = m == null ? void 0 : m.findByStoreName) == null ? void 0 : _a.call(m, "ThemeManager")) != null ? _c : (_b = m == null ? void 0 : m.findByProps) == null ? void 0 : _b.call(m, "theme", "setTheme");
      const t = (_e = (_d = tm == null ? void 0 : tm.theme) != null ? _d : tm == null ? void 0 : tm.resolvedTheme) != null ? _e : tm == null ? void 0 : tm.currentTheme;
      if (t) return String(t).toLowerCase().includes("dark");
    } catch {
    }
    return true;
  })();
  const C = isDark ? { bg: "#111214", card: "#1a1b1e", text: "#ffffff", sub: "#9ba0a8", input: "#232428", chip: "#2b2d31", blurple: "#5865F2", danger: "#f04747", warn: "#faa61a", ok: "#23a55a" } : { bg: "#f2f3f5", card: "#ffffff", text: "#060607", sub: "#5c5e66", input: "#ebedef", chip: "#e3e5e8", blurple: "#5865F2", danger: "#d83c3e", warn: "#c28516", ok: "#248046" };
  function Card(props) {
    const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
    return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
  }
  function Label(props) {
    return el(Text, { style: { color: C.sub, fontSize: 12, fontWeight: "700", marginBottom: 6 } }, props.children);
  }
  return function PlatformSpooferSettings(props) {
    var _a;
    if (jsonStorageApi == null && ((_a = props == null ? void 0 : props.api) == null ? void 0 : _a.jsonStorage)) {
      jsonStorageApi = props.api.jsonStorage;
    }
    refreshConfigFromStorage();
    const [tick, setTick] = React.useState(0);
    const kids = [];
    kids.push(el(
      View,
      { key: "head", style: { paddingHorizontal: 14, paddingTop: 8 } },
      el(Text, { style: { color: C.text, fontSize: 16, fontWeight: "800" } }, "PlatformSpoofer"),
      el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, "Spoof what device you're on \u2014 Discord draws the platform icon next to your name.")
    ));
    kids.push(el(
      View,
      { key: "warn", style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.warn } },
      el(Text, { style: { color: C.warn, fontSize: 12, fontWeight: "700" } }, "\u26A0 No ban-safety guarantee"),
      el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 4 } }, "Spoofing your platform may violate Discord's Terms of Service. Use at your own risk.")
    ));
    kids.push(el(
      View,
      { key: "toggle", style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 8 } },
      el(
        View,
        { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } },
        el(Text, { style: { color: C.text, fontSize: 15, flex: 1, paddingRight: 12 } }, "Enable spoofing"),
        Switch ? el(Switch, { value: cfg.enabled, onValueChange: (v) => {
          void updateConfig({ enabled: v });
          setTick((n) => n + 1);
          toast(v ? "Spoofer enabled" : "Spoofer disabled");
        } }) : el(Text, { style: { color: C.sub }, onPress: () => {
          void updateConfig({ enabled: !cfg.enabled });
          setTick((n) => n + 1);
        } }, cfg.enabled ? "On" : "Off")
      ),
      el(Text, { style: { color: C.sub, fontSize: 11, marginTop: 4 } }, cfg.enabled ? "Active" : "Disabled \u2014 nothing is patched while off")
    ));
    kids.push(el(
      View,
      { key: "chips", style: { marginTop: 10 } },
      el(Label, null, "Platform"),
      (() => {
        const rows = PLATFORMS.map((p) => el(Pressable, {
          key: p.key,
          onPress: () => {
            void updateConfig({ platform: p.key });
            setTick((n) => n + 1);
          },
          style: { backgroundColor: cfg.platform === p.key ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }
        }, el(Text, { style: { color: cfg.platform === p.key ? "#ffffff" : C.text, fontSize: 13, fontWeight: "700" } }, p.label)));
        return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { paddingHorizontal: 12 } }, ...rows);
      })()
    ));
    kids.push(el(
      View,
      { key: "apply", style: { paddingHorizontal: 14, marginTop: 10 } },
      el(Text, { style: { color: C.sub, fontSize: 12 } }, "Takes effect on the next gateway connect: force-close Discord and reopen after changing."),
      (() => {
        const p = platformProps(cfg.platform);
        return el(Text, { style: { color: C.ok, fontSize: 12, marginTop: 4 } }, 'Sends browser: "' + (p ? p.browser : "\u2014") + '"');
      })()
    ));
    void tick;
    return el(ScrollView, { style: { flex: 1, backgroundColor: C.bg }, contentContainerStyle: { paddingBottom: 30 } }, ...kids);
  };
}
var __builtSettings = null;
var __instance = {
  jsonStorage: { load: true, default: { enabled: false, platform: "desktop" } },
  start: startNext,
  stop: stopNext,
  SettingsComponent: function(props) {
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
    if (el && RN) return el((_a = RN.View) != null ? _a : "view", null, el((_b = RN.Text) != null ? _b : "text", null, "PlatformSpoofer: UI unavailable on this host"));
    return null;
  }
};
__instance.__engine = {
  platformProps,
  mergeIdentifyProps,
  installPatch,
  uninstallPatch,
  getConfig: () => ({ ...cfg }),
  setConfig: (patch) => {
    if (patch && typeof patch === "object") Object.assign(cfg, patch);
  },
  updateConfig,
  findIdentifySurfaces,
  PLATFORMS
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