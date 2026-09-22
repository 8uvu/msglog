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
  default: () => index_default2
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
  try {
    return revenge.discord.flux || null;
  } catch {
    return null;
  }
}
var cfg = { ...DEFAULT_SETTINGS };
var cfgStorage = null;
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
  const React = (function() {
    try {
      const r = revenge.react;
      return r.React || r;
    } catch {
      return null;
    }
  })();
  if (!React) return () => null;
  const el = React.createElement.bind(React);
  const RN = (function() {
    try {
      return revenge.react.ReactNative || {};
    } catch {
      return {};
    }
  })();
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
  return function SettingsComponent2({ api }) {
    var _a, _b, _c, _d, _e;
    const settings = (_c = (_b = (_a = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a.use) == null ? void 0 : _b.call(_a)) != null ? _c : cfg;
    const [, force] = React.useState(0);
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
          defaultValue: (settings == null ? void 0 : settings.mode) === "whitelist" ? (_d = settings == null ? void 0 : settings.customWhitelist) != null ? _d : "" : (_e = settings == null ? void 0 : settings.customBlacklist) != null ? _e : "",
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
var _SettingsComponent = null;
function SettingsComponent(props) {
  if (!_SettingsComponent) _SettingsComponent = makeSettingsComponent();
  return _SettingsComponent(props);
}
var index_default = plugin({
  jsonStorage: {
    load: true,
    default: DEFAULT_SETTINGS
  },
  async start({ cleanup, jsonStorage, logger }) {
    var _a, _b, _c, _d, _e, _f;
    try {
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
      (_e = logger == null ? void 0 : logger.log) == null ? void 0 : _e.call(logger, "[CleanUrls] started");
    } catch (e) {
      (_f = logger == null ? void 0 : logger.error) == null ? void 0 : _f.call(logger, "[CleanUrls] start failed", e);
    }
  },
  SettingsComponent
});
var index_default2 = index_default;
; return (module.exports && module.exports.default) || module.exports; })()