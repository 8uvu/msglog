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
function getReact(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  try {
    const react = (_e = (_d = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.react) == null ? void 0 : _b.React) != null ? _d : (_c = api == null ? void 0 : api.react) == null ? void 0 : _c.React) != null ? _e : null;
    if ((react == null ? void 0 : react.createElement) && (react == null ? void 0 : react.useState)) return react;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") {
      const react = (_i = (_h = (_f = revenge == null ? void 0 : revenge.react) == null ? void 0 : _f.React) != null ? _h : (_g = revenge == null ? void 0 : revenge.react) == null ? void 0 : _g.ReactModule) != null ? _i : null;
      if ((react == null ? void 0 : react.createElement) && (react == null ? void 0 : react.useState)) return react;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const react = (_o = (_n = (_l = bunny == null ? void 0 : bunny.React) != null ? _l : (_k = (_j = bunny == null ? void 0 : bunny.metro) == null ? void 0 : _j.common) == null ? void 0 : _k.React) != null ? _n : (_m = bunny == null ? void 0 : bunny.common) == null ? void 0 : _m.React) != null ? _o : null;
      if ((react == null ? void 0 : react.createElement) && (react == null ? void 0 : react.useState)) return react;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const react = (_t = (_s = (_q = (_p = vendetta == null ? void 0 : vendetta.metro) == null ? void 0 : _p.common) == null ? void 0 : _q.React) != null ? _s : (_r = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _r.React) != null ? _t : null;
      if ((react == null ? void 0 : react.createElement) && (react == null ? void 0 : react.useState)) return react;
    }
  } catch {
  }
  try {
    const metro = getMetro();
    const react = (_v = (_u = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _u.call(metro, "createElement", "useState")) != null ? _v : null;
    if (react) return react;
  } catch {
  }
  return null;
}
function getRN(api) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  try {
    const rn = (_e = (_d = (_b = (_a = api == null ? void 0 : api.unscoped) == null ? void 0 : _a.react) == null ? void 0 : _b.ReactNative) != null ? _d : (_c = api == null ? void 0 : api.react) == null ? void 0 : _c.ReactNative) != null ? _e : null;
    if ((rn == null ? void 0 : rn.View) && (rn == null ? void 0 : rn.Text)) return rn;
  } catch {
  }
  try {
    if (typeof revenge !== "undefined") {
      const rn = (_i = (_h = (_f = revenge == null ? void 0 : revenge.react) == null ? void 0 : _f.ReactNative) != null ? _h : (_g = revenge == null ? void 0 : revenge.react) == null ? void 0 : _g.native) != null ? _i : null;
      if ((rn == null ? void 0 : rn.View) && (rn == null ? void 0 : rn.Text)) return rn;
    }
  } catch {
  }
  try {
    if (typeof bunny !== "undefined") {
      const rn = (_o = (_n = (_l = bunny == null ? void 0 : bunny.ReactNative) != null ? _l : (_k = (_j = bunny == null ? void 0 : bunny.metro) == null ? void 0 : _j.common) == null ? void 0 : _k.ReactNative) != null ? _n : (_m = bunny == null ? void 0 : bunny.common) == null ? void 0 : _m.ReactNative) != null ? _o : null;
      if ((rn == null ? void 0 : rn.View) && (rn == null ? void 0 : rn.Text)) return rn;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const rn = (_t = (_s = (_q = (_p = vendetta == null ? void 0 : vendetta.metro) == null ? void 0 : _p.common) == null ? void 0 : _q.ReactNative) != null ? _s : (_r = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _r.ReactNative) != null ? _t : null;
      if ((rn == null ? void 0 : rn.View) && (rn == null ? void 0 : rn.Text)) return rn;
    }
  } catch {
  }
  try {
    const metro = getMetro();
    const rn = (_v = (_u = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _u.call(metro, "View", "Text", "TextInput")) != null ? _v : null;
    if (rn) return rn;
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
var settingsChangedCb = null;
function refreshConfig(data) {
  if (!data || typeof data !== "object") return;
  if (typeof data.enabled === "boolean") cfg.enabled = data.enabled;
  if (typeof data.platform === "string" && platformProps(data.platform)) cfg.platform = data.platform;
}
async function loadConfig() {
  var _a, _b;
  try {
    const data = (_b = await ((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.get) == null ? void 0 : _a.call(jsonStorageApi))) != null ? _b : {};
    refreshConfig(data);
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
  var _a;
  try {
    refreshConfig((_a = jsonStorageApi == null ? void 0 : jsonStorageApi.cache) != null ? _a : null);
  } catch {
  }
}
async function updateConfig(patch) {
  if (!patch || typeof patch !== "object") return;
  const next = { ...cfg };
  if (typeof patch.enabled === "boolean") next.enabled = patch.enabled;
  if (typeof patch.platform === "string" && platformProps(patch.platform)) next.platform = patch.platform;
  cfg = next;
  await persistConfig();
  if (cfg.enabled) {
    if (!installPatch()) hostError("no gateway identify surface found; spoofer inactive");
  } else {
    uninstallPatch();
  }
  settingsChangedCb == null ? void 0 : settingsChangedCb();
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
  try {
    await startPlugin(api);
  } catch (e) {
    hostError("start failed", e);
  }
}
async function startPlugin(api) {
  var _a;
  jsonStorageApi = (_a = api == null ? void 0 : api.jsonStorage) != null ? _a : getStorage();
  await loadConfig();
  if (typeof (jsonStorageApi == null ? void 0 : jsonStorageApi.subscribe) === "function") {
    try {
      const off = jsonStorageApi.subscribe(() => {
        refreshConfigFromStorage();
        settingsChangedCb == null ? void 0 : settingsChangedCb();
      });
      if (typeof off === "function") {
        if (typeof (api == null ? void 0 : api.cleanup) === "function") api.cleanup(off);
        else cleanupFns.push(off);
      }
    } catch (e) {
      hostError("could not subscribe to settings changes", e);
    }
  }
  if (cfg.enabled) {
    const ok = installPatch();
    if (!ok) hostError("no gateway identify surface found; spoofer inactive");
  }
}
async function stopNext() {
  uninstallPatch();
  settingsChangedCb = null;
  cleanupFns.forEach((f) => {
    try {
      f();
    } catch {
    }
  });
  cleanupFns = [];
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
  const C = isDarkTheme() ? { text: "#ffffff", sub: "#9ba0a8", card: "#1a1b1e", accent: "#5865F2" } : { text: "#060607", sub: "#5c5e66", card: "#ffffff", accent: "#5865F2" };
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
  function ChoiceRow(props) {
    if (D == null ? void 0 : D.TableRow) {
      return el(D.TableRow, { label: props.label, subLabel: props.selected ? "Selected" : void 0, onPress: props.onPress });
    }
    return el(
      Pressable,
      {
        onPress: props.onPress,
        accessibilityLabel: props.label,
        style: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }
      },
      el(Text, { style: { color: C.text, fontSize: 16, flex: 1 } }, props.label),
      el(Text, { style: { color: C.accent, fontSize: 16, fontWeight: "700" } }, props.selected ? "\u2713" : "")
    );
  }
  return function PlatformSpooferSettings(props) {
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
    let stored = null;
    try {
      stored = (_e2 = (_d2 = (_c2 = storage == null ? void 0 : storage.use) == null ? void 0 : _c2.call(storage)) != null ? _d2 : storage == null ? void 0 : storage.cache) != null ? _e2 : null;
    } catch {
      stored = (_f2 = storage == null ? void 0 : storage.cache) != null ? _f2 : null;
    }
    const enabled = typeof (stored == null ? void 0 : stored.enabled) === "boolean" ? stored.enabled : cfg.enabled;
    const platform = platformProps(stored == null ? void 0 : stored.platform) ? stored.platform : cfg.platform;
    return el(
      ScrollView,
      { contentContainerStyle: { paddingBottom: 24 } },
      el(
        Group,
        { title: "PlatformSpoofer", description: "Spoofing may violate Discord\u2019s Terms of Service; use at your own risk." },
        el(ToggleRow, {
          label: "Enable platform spoofing",
          subLabel: enabled ? "Applied on the next gateway connection." : "Platform identification is unchanged while off.",
          value: enabled,
          onValueChange: (value) => {
            void updateConfig({ enabled: value });
          }
        })
      ),
      (D == null ? void 0 : D.TableRadioGroup) && (D == null ? void 0 : D.TableRadioRow) ? el(D.TableRadioGroup, {
        title: "Platform",
        description: "Choose the platform Discord reports for your account.",
        value: platform,
        onChange: (value) => {
          void updateConfig({ platform: value });
        }
      }, ...PLATFORMS.map((item) => el(D.TableRadioRow, { key: item.key, label: item.label, value: item.key }))) : el(
        Group,
        { title: "Platform", description: "Choose the platform Discord reports for your account." },
        ...PLATFORMS.map((item) => el(ChoiceRow, {
          key: item.key,
          label: item.label,
          selected: item.key === platform,
          onPress: () => {
            void updateConfig({ platform: item.key });
          }
        }))
      ),
      el(
        Group,
        { title: "Apply changes" },
        el(
          Text,
          { style: { color: C.sub, fontSize: 13, paddingHorizontal: 16, paddingVertical: 10 } },
          "Force-close and reopen Discord after changing the platform."
        )
      )
    );
  };
}
var __builtSettings = null;
var __instance = {
  jsonStorage: { load: true, default: { enabled: false, platform: "desktop" } },
  start: startNext,
  stop: stopNext,
  SettingsComponent: function(props) {
    var _a, _b, _c;
    const settingsApi = (_a = props == null ? void 0 : props.api) != null ? _a : props;
    const React = getReact(settingsApi);
    if (!(React == null ? void 0 : React.createElement)) return null;
    try {
      if (settingsApi == null ? void 0 : settingsApi.jsonStorage) jsonStorageApi = settingsApi.jsonStorage;
      if (!__builtSettings) __builtSettings = buildSettingsComponent(settingsApi);
      if (__builtSettings) return React.createElement(__builtSettings, { api: settingsApi });
    } catch (e) {
      hostError("settings build failed", e);
    }
    const RN = (_b = getRN(settingsApi)) != null ? _b : {};
    return React.createElement((_c = RN.Text) != null ? _c : "text", null, "PlatformSpoofer settings could not load on this build.");
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