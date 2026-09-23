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

// plugins/dev.8uvu.quick-check/js/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
function rn() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  let out = null;
  try {
    out = ((_b = (_a = typeof revenge !== "undefined" && revenge) == null ? void 0 : _a.react) == null ? void 0 : _b.ReactNative) || out;
  } catch {
  }
  try {
    out = ((_e = (_d = (_c = typeof bunny !== "undefined" && bunny) == null ? void 0 : _c.metro) == null ? void 0 : _d.common) == null ? void 0 : _e.ReactNative) || out;
  } catch {
  }
  try {
    out = ((_h = (_g = (_f = typeof vendetta !== "undefined" && vendetta) == null ? void 0 : _f.metro) == null ? void 0 : _g.common) == null ? void 0 : _h.ReactNative) || out;
  } catch {
  }
  try {
    out = ((_j = (_i = typeof vendetta !== "undefined" && vendetta) == null ? void 0 : _i.common) == null ? void 0 : _j.ReactNative) || out;
  } catch {
  }
  return out;
}
function react() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  let out = null;
  try {
    out = ((_b = (_a = typeof revenge !== "undefined" && revenge) == null ? void 0 : _a.react) == null ? void 0 : _b.React) || out;
  } catch {
  }
  try {
    out = ((_e = (_d = (_c = typeof bunny !== "undefined" && bunny) == null ? void 0 : _c.metro) == null ? void 0 : _d.common) == null ? void 0 : _e.React) || out;
  } catch {
  }
  try {
    out = ((_f = typeof bunny !== "undefined" && bunny) == null ? void 0 : _f.React) || out;
  } catch {
  }
  try {
    out = ((_i = (_h = (_g = typeof vendetta !== "undefined" && vendetta) == null ? void 0 : _g.metro) == null ? void 0 : _h.common) == null ? void 0 : _i.React) || out;
  } catch {
  }
  try {
    out = ((_k = (_j = typeof vendetta !== "undefined" && vendetta) == null ? void 0 : _j.common) == null ? void 0 : _k.React) || out;
  } catch {
  }
  return out;
}
function line(label, value) {
  return label + ": " + (value === void 0 ? "MISSING" : value === null ? "null" : String(value));
}
function diagnosis() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  const lines = [];
  let host = "UNKNOWN (none of revenge/bunny/vendetta found)";
  try {
    if (typeof revenge !== "undefined") host = "Revenge (Next)";
  } catch {
  }
  try {
    if (host.startsWith("UNKNOWN") && typeof bunny !== "undefined") host = "Revenge Classic (bunny)";
  } catch {
  }
  try {
    if (host.startsWith("UNKNOWN") && typeof vendetta !== "undefined") host = "Vendetta-compat manager";
  } catch {
  }
  lines.push("Host: " + host);
  lines.push("");
  const R = react();
  const RN = rn();
  lines.push(line("React", R ? typeof R.createElement : void 0));
  lines.push(line("ReactNative", RN ? "present" : void 0));
  lines.push(line("RN.Alert", (RN == null ? void 0 : RN.Alert) ? typeof RN.Alert.alert : void 0));
  lines.push("");
  let dispatcher = null;
  try {
    if (typeof revenge !== "undefined") dispatcher = (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.flux;
  } catch {
  }
  try {
    if (!dispatcher && typeof bunny !== "undefined") dispatcher = (_b = bunny == null ? void 0 : bunny.api) == null ? void 0 : _b.flux;
  } catch {
  }
  try {
    if (!dispatcher && typeof vendetta !== "undefined") {
      const v = vendetta;
      dispatcher = (_f = (_d = (_c = v == null ? void 0 : v.metro) == null ? void 0 : _c.common) == null ? void 0 : _d.FluxDispatcher) != null ? _f : (_e = v == null ? void 0 : v.common) == null ? void 0 : _e.FluxDispatcher;
    }
  } catch {
  }
  lines.push(line("Flux (Next API)", typeof revenge !== "undefined" ? typeof ((_h = (_g = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _g.flux) == null ? void 0 : _h.onFluxEventDispatched) : void 0));
  lines.push(line("Flux (bunny intercept)", typeof bunny !== "undefined" ? typeof ((_j = (_i = bunny == null ? void 0 : bunny.api) == null ? void 0 : _i.flux) == null ? void 0 : _j.intercept) : void 0));
  lines.push(line("FluxDispatcher.addInterceptor", typeof (dispatcher == null ? void 0 : dispatcher.addInterceptor)));
  lines.push("");
  let store = "none";
  try {
    const m = (_k = typeof bunny !== "undefined" ? bunny == null ? void 0 : bunny.metro : null) != null ? _k : typeof vendetta !== "undefined" ? vendetta == null ? void 0 : vendetta.metro : null;
    const us = (_l = m == null ? void 0 : m.findByStoreName) == null ? void 0 : _l.call(m, "UserStore");
    store = (us == null ? void 0 : us.getCurrentUser) ? "resolved" : us ? "found, no getCurrentUser" : "MISSING";
    if (us == null ? void 0 : us.getCurrentUser) {
      const u = us.getCurrentUser();
      store += " (user id: " + String((_m = u == null ? void 0 : u.id) != null ? _m : "?") + ")";
    }
  } catch (e) {
    store = "finder threw: " + (e instanceof Error ? e.message : String(e));
  }
  lines.push(line("UserStore (metro)", store));
  lines.push("");
  lines.push(line("FileModule", typeof revenge !== "undefined" && ((_o = (_n = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _n.native) == null ? void 0 : _o.FileModule) ? "present" : void 0));
  lines.push("");
  lines.push('If React/RN show "MISSING" or the host is UNKNOWN,');
  lines.push("the loader never injected this plugin correctly.");
  lines.push("Send this whole popup to the plugin developer.");
  return lines.join("\n");
}
function popIt() {
  var _a, _b, _c, _d;
  const RN = rn();
  const text = diagnosis();
  try {
    if ((_a = RN == null ? void 0 : RN.Alert) == null ? void 0 : _a.alert) {
      RN.Alert.alert("Quick Check", text);
      return;
    }
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    (_d = (_c = (_b = v == null ? void 0 : v.ui) == null ? void 0 : _b.alerts) == null ? void 0 : _c.showConfirmationAlert) == null ? void 0 : _d.call(_c, {
      title: "Quick Check",
      content: text,
      confirmText: "OK",
      cancelText: "Close",
      onConfirm: () => {
      },
      onCancel: () => {
      }
    });
  } catch {
  }
  try {
    console.log("[QuickCheck]\n" + text);
  } catch {
  }
}
function makeSettings() {
  const React = react();
  const RN = rn();
  if (!React || !RN) return null;
  const { View, Text, ScrollView } = RN;
  const el = React.createElement;
  return function Settings() {
    return el(
      ScrollView,
      { style: { flex: 1 } },
      el(View, { style: { padding: 12 } }, el(Text, null, diagnosis()))
    );
  };
}
var _settings = null;
function SettingsComponent(props) {
  try {
    if (!_settings) _settings = makeSettings();
    if (!_settings) {
      const React = react();
      const RN = rn();
      if (React && (RN == null ? void 0 : RN.Text)) return React.createElement(RN.Text, null, "React resolved late \u2014 toggle the plugin off and on.");
      return null;
    }
    return _settings(props);
  } catch (e) {
    const React = react();
    const RN = rn();
    if (React && (RN == null ? void 0 : RN.Text)) return React.createElement(RN.Text, null, "QuickCheck settings crashed: " + (e instanceof Error ? e.message : String(e)));
    return null;
  }
}
var instance = {
  jsonStorage: { load: true, default: {} },
  start() {
    var _a;
    try {
      popIt();
    } catch (e) {
      try {
        console.log("[QuickCheck] probe crashed: " + (e instanceof Error ? e.stack : String(e)));
      } catch {
      }
      const RN = rn();
      try {
        (_a = RN == null ? void 0 : RN.Alert) == null ? void 0 : _a.alert("QuickCheck crashed", String(e instanceof Error ? e.message : e));
      } catch {
      }
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