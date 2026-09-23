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

// plugins/dev.8uvu.clean-urls/js/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var DEFAULT_SETTINGS = {
  enabled: true,
  mode: "blacklist",
  customBlacklist: "",
  customWhitelist: ""
};
var TRACKING_PARAMS = /* @__PURE__ */ new Set([
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "ttclid",
  "yclid",
  "igshid",
  "igsh",
  "si",
  "mkt_tok",
  "mc_eid",
  "mc_cid",
  "_hsenc",
  "_hsmi",
  "vero_conv",
  "vero_id",
  "ref_src",
  "ref_url",
  "spm",
  "scm",
  "share_source",
  "share_medium",
  "tt_from",
  "s_kwcid",
  "elqtrackid",
  "trk_contact",
  "trk_msg",
  "trk_module",
  "trk_sid",
  "rb_clickid",
  "oly_anon_id",
  "oly_enc_id",
  "wickedid",
  "hsa_cam",
  "hsa_grp",
  "hsa_ad",
  "hsa_src",
  "hsa_tgt",
  "hsa_kw",
  "hsa_mt",
  "hsa_net",
  "hsa_ver",
  "ml_subscriber",
  "ml_subscriber_hash",
  "trk"
]);
var TRACKING_PREFIXES = ["utm_", "fb_", "ga_", "mc_", "matomo_", "pk_", "mtm_"];
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
      const fd = (_f = (_c = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _c.FluxDispatcher) != null ? _f : (_e = (_d = vendetta == null ? void 0 : vendetta.metro) == null ? void 0 : _d.common) == null ? void 0 : _e.FluxDispatcher;
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
var cfg = { ...DEFAULT_SETTINGS };
var cfgStorage = null;
var hostKind = "next";
function coerce(raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: c.enabled !== false,
    mode: c.mode === "whitelist" ? "whitelist" : "blacklist",
    customBlacklist: typeof c.customBlacklist === "string" ? c.customBlacklist : "",
    customWhitelist: typeof c.customWhitelist === "string" ? c.customWhitelist : ""
  };
}
function refreshConfig() {
  try {
    if ((cfgStorage == null ? void 0 : cfgStorage.cache) && typeof cfgStorage.cache === "object") cfg = coerce(cfgStorage.cache);
  } catch {
  }
}
function splitList(raw) {
  return new Set(
    raw.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}
function isTracked(key, custom) {
  return TRACKING_PARAMS.has(key) || TRACKING_PREFIXES.some((p) => key.startsWith(p)) || custom.has(key);
}
function cleanUrl(url) {
  const schemeEnd = url.indexOf("://");
  const hostStart = schemeEnd === -1 ? url.startsWith("//") ? 2 : 0 : schemeEnd + 3;
  const afterHost = url.indexOf("/", hostStart);
  const authority = afterHost === -1 ? url : url.slice(0, afterHost);
  const rest = afterHost === -1 ? "" : url.slice(afterHost);
  const queryStart = rest.indexOf("?");
  if (queryStart === -1) return url;
  const hashStart = rest.indexOf("#");
  const path = rest.slice(0, queryStart);
  const queryEnd = hashStart === -1 ? rest.length : hashStart;
  const query = rest.slice(queryStart + 1, queryEnd);
  const hashPart = hashStart === -1 ? "" : rest.slice(hashStart);
  const keep = [];
  const custom = splitList(cfg.mode === "whitelist" ? cfg.customWhitelist : cfg.customBlacklist);
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    let key = rawKey;
    try {
      key = decodeURIComponent(rawKey);
    } catch {
    }
    key = key.toLowerCase();
    if (cfg.mode === "whitelist") {
      if (custom.size === 0 || custom.has(key)) keep.push(pair);
    } else if (!isTracked(key, custom)) {
      keep.push(pair);
    }
  }
  const cleaned = path + (keep.length ? "?" + keep.join("&") : "") + hashPart;
  return authority + cleaned;
}
var URL_RE = /https?:\/\/[^\s<>"')\]]+/g;
function cleanText(text) {
  if (!text || typeof text !== "string" || !text.includes("?")) return text;
  return text.replace(URL_RE, (m) => {
    const trimmed = m.match(/[.,;:!?]+$/);
    const body = trimmed ? m.slice(0, m.length - trimmed[0].length) : m;
    return cleanUrl(body) + (trimmed ? trimmed[0] : "");
  });
}
function handlePayload(payload) {
  if (!cfg.enabled) return payload;
  const message = payload == null ? void 0 : payload.message;
  if (!message || typeof message.content !== "string") return payload;
  const cleaned = cleanText(message.content);
  if (cleaned !== message.content) message.content = cleaned;
  return payload;
}
function makeSettingsComponent() {
  const React = getReact();
  if (!React) return () => null;
  const el = React.createElement.bind(React);
  const RN = getRN() || {};
  const { View = "view", Text = "text", TextInput = "input", Pressable = View } = RN;
  const SwitchRowFallback = (props) => el(
    Pressable,
    {
      onPress: () => props.onValueChange(!props.value),
      style: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" }
    },
    el(Text, { style: { flex: 1 } }, props.label),
    el(Text, { style: { opacity: 0.7, marginLeft: 8 } }, props.value ? "On" : "Off")
  );
  function SwitchRow(props) {
    var _a, _b;
    let design = null;
    try {
      design = revenge.discord.design;
    } catch {
    }
    const Row = (_b = design == null ? void 0 : design.TableSwitchRow) != null ? _b : (_a = design == null ? void 0 : design.Design) == null ? void 0 : _a.TableSwitchRow;
    if (Row) return el(Row, props, null);
    return el(SwitchRowFallback, props, null);
  }
  function RowGroup(props) {
    var _a, _b;
    let design = null;
    try {
      design = revenge.discord.design;
    } catch {
    }
    const Group = (_b = design == null ? void 0 : design.TableRowGroup) != null ? _b : (_a = design == null ? void 0 : design.Design) == null ? void 0 : _a.TableRowGroup;
    if (Group) return el(Group, { title: props.title }, ...props.children);
    return el(
      View,
      { style: { marginVertical: 8 } },
      el(Text, { style: { fontWeight: "bold", padding: 12 } }, props.title),
      ...props.children
    );
  }
  return function SettingsComponent2(props) {
    var _a, _b, _c, _d, _e, _f;
    const api = (_a = props == null ? void 0 : props.api) != null ? _a : classicSettingsApi();
    const settings = (_d = (_c = (_b = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _b.use) == null ? void 0 : _c.call(_b)) != null ? _d : cfg;
    const [, force] = React.useState(0);
    React.useEffect(() => {
      settingsChangedCb = () => force((n) => n + 1);
      return () => {
        settingsChangedCb = null;
      };
    }, []);
    const toggleMode = (mode) => {
      var _a2, _b2;
      (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { mode });
      force((n) => n + 1);
    };
    const btn = (mode, label) => el(
      Pressable,
      {
        key: mode,
        onPress: () => toggleMode(mode),
        style: { paddingVertical: 8, paddingHorizontal: 12 }
      },
      el(Text, { style: { fontWeight: (settings == null ? void 0 : settings.mode) === mode ? "bold" : "normal" } }, label)
    );
    return el(
      View,
      null,
      el(
        RowGroup,
        { title: "Clean URLs" },
        el(SwitchRow, {
          key: "enabled",
          label: "Enabled",
          value: (settings == null ? void 0 : settings.enabled) !== false,
          onValueChange: (v) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { enabled: v });
          }
        }),
        el(View, { style: { flexDirection: "row", paddingVertical: 4 } }, btn("blacklist", "Blacklist mode"), btn("whitelist", "Whitelist mode")),
        el(
          Text,
          { style: { paddingHorizontal: 16, opacity: 0.7 } },
          (settings == null ? void 0 : settings.mode) === "whitelist" ? "Only keep the query parameters listed below." : "Strip known tracking parameters (plus any custom ones below)."
        )
      ),
      el(
        RowGroup,
        { title: (settings == null ? void 0 : settings.mode) === "whitelist" ? "Whitelisted parameters" : "Extra blacklisted parameters" },
        el(TextInput, {
          placeholder: (settings == null ? void 0 : settings.mode) === "whitelist" ? "ref, q, \u2026" : "my_param, another_one, \u2026",
          defaultValue: (settings == null ? void 0 : settings.mode) === "whitelist" ? (_e = settings == null ? void 0 : settings.customWhitelist) != null ? _e : "" : (_f = settings == null ? void 0 : settings.customBlacklist) != null ? _f : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(
              _a2,
              (settings == null ? void 0 : settings.mode) === "whitelist" ? { customWhitelist: t } : { customBlacklist: t }
            );
          },
          style: { padding: 8 }
        })
      )
    );
  };
}
function getReact() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
    const r = (_i = (_f = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _f.React) != null ? _i : (_h = (_g = vendetta == null ? void 0 : vendetta.metro) == null ? void 0 : _g.common) == null ? void 0 : _h.React;
    if (r) return r;
  } catch {
  }
  return null;
}
function getRN() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
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
      const rn = b.ReactNative || ((_b = b.common) == null ? void 0 : _b.ReactNative) || ((_d = (_c = b.metro) == null ? void 0 : _c.common) == null ? void 0 : _d.ReactNative);
      if (rn) return rn;
    }
  } catch {
  }
  try {
    const rn = (_h = (_e = vendetta == null ? void 0 : vendetta.common) == null ? void 0 : _e.ReactNative) != null ? _h : (_g = (_f = vendetta == null ? void 0 : vendetta.metro) == null ? void 0 : _f.common) == null ? void 0 : _g.ReactNative;
    if (rn) return rn;
  } catch {
  }
  return null;
}
var classicDisposers = [];
var classicStorageProxy = null;
var classicStorageKind = null;
function refreshClassicConfig() {
  try {
    const data = classicStorageKind === "vendetta" ? classicStorageProxy : classicStorageProxy == null ? void 0 : classicStorageProxy.data;
    if (data && typeof data === "object") cfg = coerce(data.settings);
  } catch {
  }
}
function classicSettingsApi() {
  return {
    use: () => ({ ...cfg }),
    set: (update) => {
      try {
        if (!classicStorageProxy || typeof classicStorageProxy !== "object") return;
        if (classicStorageKind === "vendetta") {
          classicStorageProxy.settings = { ...coerce(classicStorageProxy.settings), ...update };
        } else {
          const data = classicStorageProxy.data && typeof classicStorageProxy.data === "object" ? classicStorageProxy.data : {};
          classicStorageProxy.data = {
            ...data,
            settings: { ...coerce(data.settings), ...update }
          };
        }
        refreshClassicConfig();
        settingsChangedCb == null ? void 0 : settingsChangedCb();
      } catch {
      }
    }
  };
}
var settingsChangedCb = null;
async function startClassic() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const b = typeof bunny !== "undefined" && bunny || {};
  const v = typeof vendetta !== "undefined" ? vendetta : null;
  const p = (_b = (_a = b.plugin) != null ? _a : v) != null ? _b : {};
  try {
    if (!((_c = b.plugin) == null ? void 0 : _c.createStorage) && ((_d = v == null ? void 0 : v.plugin) == null ? void 0 : _d.storage) && typeof v.plugin.storage === "object") {
      classicStorageProxy = v.plugin.storage;
      classicStorageKind = "vendetta";
      if (!classicStorageProxy.settings || typeof classicStorageProxy.settings !== "object") {
        classicStorageProxy.settings = { ...DEFAULT_SETTINGS };
      }
      const emitter = classicStorageProxy[Symbol.for("vendetta.storage.emitter")];
      const off = (_e = emitter == null ? void 0 : emitter.on) == null ? void 0 : _e.call(emitter, "SET", () => {
        try {
          refreshClassicConfig();
        } catch {
        }
      });
      if (typeof off === "function") classicDisposers.push(off);
      refreshClassicConfig();
    }
    const store = (_f = p.createStorage) == null ? void 0 : _f.call(p);
    const promise = store == null ? void 0 : store[Symbol.for("bunny.storage.promise")];
    if (promise && typeof promise.then === "function") await promise.catch(() => {
    });
    if (store && typeof store === "object") {
      classicStorageProxy = store;
      classicStorageKind = "bunny";
      const data = store.data && typeof store.data === "object" ? store.data : {};
      if (!data.settings) store.data = { ...data, settings: { ...DEFAULT_SETTINGS } };
      refreshClassicConfig();
      const emitter = store[Symbol.for("vendetta.storage.emitter")];
      const off = (_g = emitter == null ? void 0 : emitter.on) == null ? void 0 : _g.call(emitter, "SET", () => {
        try {
          refreshClassicConfig();
        } catch {
        }
      });
      if (typeof off === "function") classicDisposers.push(off);
    }
  } catch (e) {
    (_i = (_h = p.logger) == null ? void 0 : _h.error) == null ? void 0 : _i.call(_h, "[CleanUrls] classic storage unavailable, using defaults", e);
  }
  const flux = getFlux();
  if (!flux || typeof flux.onFluxEventDispatched !== "function") {
    (_k = (_j = p.logger) == null ? void 0 : _j.error) == null ? void 0 : _k.call(_j, "[CleanUrls] flux API unavailable \u2014 plugin idle this session");
    return;
  }
  for (const event of ["MESSAGE_CREATE", "MESSAGE_UPDATE"]) {
    try {
      const off = flux.onFluxEventDispatched(event, (payload) => {
        try {
          return handlePayload(payload);
        } catch {
          return payload;
        }
      });
      if (typeof off === "function") classicDisposers.push(off);
      (_m = (_l = p.logger) == null ? void 0 : _l.log) == null ? void 0 : _m.call(_l, "[CleanUrls] registered " + event);
    } catch (e) {
      (_o = (_n = p.logger) == null ? void 0 : _n.error) == null ? void 0 : _o.call(_n, "[CleanUrls] could not register " + event, e);
    }
  }
  (_q = (_p = p.logger) == null ? void 0 : _p.log) == null ? void 0 : _q.call(_p, "[CleanUrls] started (Revenge Classic / vendetta host)");
}
var _SettingsComponent = null;
function SettingsComponent(props) {
  if (!_SettingsComponent) {
    _SettingsComponent = makeSettingsComponent();
  }
  if (hostKind !== "next") refreshClassicConfig();
  return _SettingsComponent(props);
}
var __instance = {
  jsonStorage: {
    load: true,
    default: DEFAULT_SETTINGS
  },
  async start(api) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
      if (api && typeof api === "object" && (api.cleanup || api.jsonStorage)) {
        hostKind = "next";
        const { cleanup, jsonStorage, logger } = api;
        cfgStorage = jsonStorage != null ? jsonStorage : null;
        refreshConfig();
        if (jsonStorage) {
          try {
            await jsonStorage.get();
            refreshConfig();
            cleanup(jsonStorage.subscribe(() => refreshConfig()));
          } catch (e) {
            (_a = logger == null ? void 0 : logger.error) == null ? void 0 : _a.call(logger, "[CleanUrls] jsonStorage unavailable, using defaults", e);
          }
        }
        const flux = getFlux();
        if (!flux || typeof flux.onFluxEventDispatched !== "function") {
          (_b = logger == null ? void 0 : logger.error) == null ? void 0 : _b.call(logger, "[CleanUrls] flux API unavailable \u2014 plugin idle this session");
          return;
        }
        for (const event of ["MESSAGE_CREATE", "MESSAGE_UPDATE"]) {
          try {
            cleanup(
              flux.onFluxEventDispatched(event, (payload) => {
                try {
                  return handlePayload(payload);
                } catch {
                  return payload;
                }
              })
            );
            (_c = logger == null ? void 0 : logger.log) == null ? void 0 : _c.call(logger, "[CleanUrls] registered " + event);
          } catch (e) {
            (_d = logger == null ? void 0 : logger.error) == null ? void 0 : _d.call(logger, "[CleanUrls] could not register " + event, e);
          }
        }
        (_e = logger == null ? void 0 : logger.log) == null ? void 0 : _e.call(logger, "[CleanUrls] started (Revenge Next)");
      } else {
        hostKind = "classic";
        await startClassic();
      }
    } catch (e) {
      try {
        (_h = (_g = typeof bunny !== "undefined" ? (_f = bunny.plugin) == null ? void 0 : _f.logger : null) == null ? void 0 : _g.error) == null ? void 0 : _h.call(_g, "[CleanUrls] start failed", e);
      } catch {
      }
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