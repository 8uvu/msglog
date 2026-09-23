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

// plugins/dev.8uvu.host-probe/js/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var rows = [];
function push(key, value) {
  rows.push({ key, value: value === void 0 ? "undefined" : String(value) });
}
function probeGlobals() {
  const present = [];
  try {
    if (typeof revenge !== "undefined" && revenge) present.push("revenge");
  } catch {
  }
  try {
    if (typeof bunny !== "undefined" && bunny) present.push("bunny");
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined" && vendetta) present.push("vendetta");
  } catch {
  }
  try {
    if (typeof plugin !== "undefined" && typeof plugin === "function") present.push("plugin(factory)");
  } catch {
  }
  return present;
}
function probeRevenge() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  try {
    if (typeof revenge === "undefined") return;
    const r = revenge;
    push("revenge.api version", (_c = (_b = (_a = r == null ? void 0 : r.api) == null ? void 0 : _a.version) != null ? _b : r == null ? void 0 : r.apiVersion) != null ? _c : "?");
    push("revenge.react", !!(r == null ? void 0 : r.react));
    push("revenge.react.jsxRuntime", !!((_d = r == null ? void 0 : r.react) == null ? void 0 : _d.jsxRuntime));
    push("revenge.discord.flux", !!((_e = r == null ? void 0 : r.discord) == null ? void 0 : _e.flux));
    push("flux.onFluxEventDispatched", typeof ((_g = (_f = r == null ? void 0 : r.discord) == null ? void 0 : _f.flux) == null ? void 0 : _g.onFluxEventDispatched));
    push("flux.Stores.UserStore", !!((_j = (_i = (_h = r == null ? void 0 : r.discord) == null ? void 0 : _h.flux) == null ? void 0 : _i.Stores) == null ? void 0 : _j.UserStore));
    push("revenge.discord.actions", !!((_k = r == null ? void 0 : r.discord) == null ? void 0 : _k.actions));
    push("revenge.discord.design", !!((_l = r == null ? void 0 : r.discord) == null ? void 0 : _l.design));
    push("revenge.discord.native.FileModule", !!((_n = (_m = r == null ? void 0 : r.discord) == null ? void 0 : _m.native) == null ? void 0 : _n.FileModule));
    push("revenge.logger", !!(r == null ? void 0 : r.logger));
  } catch (e) {
    push("revenge probe error", e instanceof Error ? e.message : String(e));
  }
}
function probeBunny() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  try {
    if (typeof bunny === "undefined") return;
    const b = bunny;
    push("bunny.api.flux.intercept", typeof ((_b = (_a = b == null ? void 0 : b.api) == null ? void 0 : _a.flux) == null ? void 0 : _b.intercept));
    push("bunny.plugin.createStorage", typeof ((_c = b == null ? void 0 : b.plugin) == null ? void 0 : _c.createStorage));
    push("bunny.plugin.logger", !!((_d = b == null ? void 0 : b.plugin) == null ? void 0 : _d.logger));
    push("bunny.metro", !!(b == null ? void 0 : b.metro));
    push("bunny.common.FluxDispatcher", !!((_e = b == null ? void 0 : b.common) == null ? void 0 : _e.FluxDispatcher));
    push("bunny.native.FileModule", !!(((_g = (_f = b == null ? void 0 : b.api) == null ? void 0 : _f.native) == null ? void 0 : _g.FileModule) || ((_h = b == null ? void 0 : b.native) == null ? void 0 : _h.FileModule)));
  } catch (e) {
    push("bunny probe error", e instanceof Error ? e.message : String(e));
  }
}
function probeVendetta() {
  var _a, _b, _c, _d, _e, _f, _i, _j, _k;
  try {
    if (typeof vendetta === "undefined") return;
    const v = vendetta;
    push("vendetta.plugin.storage", !!((_a = v == null ? void 0 : v.plugin) == null ? void 0 : _a.storage));
    push("vendetta.common.FluxDispatcher", !!((_b = v == null ? void 0 : v.common) == null ? void 0 : _b.FluxDispatcher));
    push("dispatcher.addInterceptor", typeof ((_d = (_c = v == null ? void 0 : v.common) == null ? void 0 : _c.FluxDispatcher) == null ? void 0 : _d.addInterceptor));
    push("vendetta.ui.toasts.showToast", typeof ((_f = (_e = v == null ? void 0 : v.ui) == null ? void 0 : _e.toasts) == null ? void 0 : _f.showToast));
    push("vendetta.metro.findByStoreName", typeof ((_i = v == null ? void 0 : v.metro) == null ? void 0 : _i.findByStoreName));
    try {
      const us = (_k = (_j = v == null ? void 0 : v.metro) == null ? void 0 : _j.findByStoreName) == null ? void 0 : _k.call(_j, "UserStore");
      push("metro UserStore", !!us);
    } catch {
      push("metro UserStore", "finder threw");
    }
  } catch (e) {
    push("vendetta probe error", e instanceof Error ? e.message : String(e));
  }
}
function probeStorageApi(api) {
  push("jsonStorage passed to start", !!(api == null ? void 0 : api.jsonStorage));
  if (api == null ? void 0 : api.jsonStorage) {
    push("jsonStorage.get", typeof api.jsonStorage.get);
    push("jsonStorage.subscribe", typeof api.jsonStorage.subscribe);
  }
}
function summary() {
  const globals = probeGlobals();
  let kind = "unknown host";
  try {
    if (typeof revenge !== "undefined") kind = "Revenge (Next API)";
    else if (typeof bunny !== "undefined") kind = "Revenge Classic (bunny)";
    else if (typeof vendetta !== "undefined") kind = "Vendetta-compat manager";
  } catch {
  }
  return kind + " \xB7 globals: " + (globals.join(", ") || "NONE");
}
var _React = null;
function react() {
  var _a, _b;
  if (_React) return _React;
  try {
    if (typeof revenge !== "undefined") {
      const r = revenge.react;
      if (r) _React = r.React || r;
    }
  } catch {
  }
  try {
    if (!_React && typeof bunny !== "undefined") {
      const b = bunny;
      _React = b.React || ((_a = b.common) == null ? void 0 : _a.React);
    }
  } catch {
  }
  try {
    if (!_React && typeof vendetta !== "undefined") _React = (_b = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _b.React;
  } catch {
  }
  return _React;
}
var _RN = null;
function reactNative() {
  var _a, _b, _c;
  if (_RN) return _RN;
  try {
    if (typeof revenge !== "undefined") _RN = (_a = revenge == null ? void 0 : revenge.react) == null ? void 0 : _a.ReactNative;
  } catch {
  }
  try {
    if (!_RN && typeof bunny !== "undefined") {
      const b = bunny;
      _RN = b.ReactNative || ((_b = b.common) == null ? void 0 : _b.ReactNative);
    }
  } catch {
  }
  try {
    if (!_RN && typeof vendetta !== "undefined") _RN = (_c = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _c.ReactNative;
  } catch {
  }
  return _RN;
}
function makeSettings() {
  const React = react();
  const RN = reactNative();
  if (!React || !RN) return null;
  const { View, Text, ScrollView } = RN;
  const el = React.createElement;
  return function Settings() {
    return el(
      ScrollView,
      { style: { flex: 1 } },
      el(View, { style: { padding: 12 } }, el(Text, { style: { fontWeight: "bold", marginBottom: 8 } }, summary())),
      rows.map(
        (r, i) => el(
          View,
          { key: i, style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 } },
          el(Text, { style: { flex: 1 } }, r.key),
          el(Text, { style: { opacity: 0.7 } }, r.value)
        )
      )
    );
  };
}
function showToastEverywhere(content, key) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const show = (fn, arg) => {
    try {
      if (typeof fn !== "function") return false;
      fn(arg);
      return true;
    } catch {
      return false;
    }
  };
  try {
    const a = typeof revenge !== "undefined" ? (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.actions : null;
    const open = (_c = (_b = a == null ? void 0 : a.ToastActionCreators) == null ? void 0 : _b.open) != null ? _c : a == null ? void 0 : a.open;
    if (show(open, { key, content })) return;
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const s = (_h = (_e = (_d = v == null ? void 0 : v.ui) == null ? void 0 : _d.toasts) == null ? void 0 : _e.showToast) != null ? _h : (_g = (_f = v == null ? void 0 : v.common) == null ? void 0 : _f.toasts) == null ? void 0 : _g.showToast;
    if (show(s, { key, content }) || show(s, content)) return;
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    if (show((_j = (_i = b == null ? void 0 : b.api) == null ? void 0 : _i.toasts) == null ? void 0 : _j.showToast, { key, content })) return;
  } catch {
  }
  try {
    const ta = (_k = reactNative()) == null ? void 0 : _k.ToastAndroid;
    (_m = ta == null ? void 0 : ta.show) == null ? void 0 : _m.call(ta, content, (_l = ta == null ? void 0 : ta.SHORT) != null ? _l : 0);
  } catch {
  }
}
function runProbe(startApi) {
  var _a, _b;
  rows.length = 0;
  push("probe at", (/* @__PURE__ */ new Date()).toLocaleTimeString());
  push("globals present", probeGlobals().join(", ") || "NONE");
  push("plugin factory injected", typeof plugin !== "undefined" && typeof plugin === "function");
  probeStorageApi(startApi);
  probeRevenge();
  probeBunny();
  probeVendetta();
  const oneLine = summary();
  showToastEverywhere("Host Probe: " + oneLine, "hostprobe-summary");
  try {
    (_b = (_a = typeof revenge !== "undefined" ? revenge == null ? void 0 : revenge.logger : null) == null ? void 0 : _a.log) == null ? void 0 : _b.call(_a, "[HostProbe] " + rows.map((r) => r.key + "=" + r.value).join(" | "));
  } catch {
  }
}
var _settings = null;
function SettingsComponent(props) {
  if (!_settings) _settings = makeSettings();
  if (!_settings) return null;
  const React = react();
  return _settings(props);
}
var instance = {
  jsonStorage: { load: true, default: {} },
  start(api) {
    try {
      runProbe(api);
    } catch (e) {
      showToastEverywhere("HostProbe probe failed: " + (e instanceof Error ? e.message : String(e)), "hostprobe-fail");
    }
  },
  stop() {
  },
  SettingsComponent
};
if (typeof plugin === "function") {
  instance = plugin(instance);
}
globalThis.plugin = instance;
instance.onLoad = function() {
  var _a;
  (_a = instance.start) == null ? void 0 : _a.call(instance);
};
instance.onUnload = function() {
  var _a;
  (_a = instance.stop) == null ? void 0 : _a.call(instance);
};
instance.settings = instance.SettingsComponent;
var index_default = globalThis.plugin;
; return (module.exports && module.exports.default) || module.exports; })()