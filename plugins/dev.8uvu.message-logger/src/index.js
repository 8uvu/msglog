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

// js/index.tsx
var index_exports = {};
__export(index_exports, {
  default: () => index_default2
});
module.exports = __toCommonJS(index_exports);
var LOG_FILE = "message-logger.json";
var DEFAULT_SETTINGS = {
  enabled: true,
  logDeletes: true,
  logEdits: true,
  ghostPings: true,
  ignoreBots: true,
  ignoreSelf: false,
  maxStored: 300,
  ignoredChannels: "",
  ignoredUsers: ""
};
function getReact() {
  try {
    const r = revenge.react;
    return r.React || r;
  } catch {
    return null;
  }
}
function getRN() {
  try {
    return revenge.react.ReactNative || null;
  } catch {
    return null;
  }
}
function getFlux() {
  try {
    return revenge.discord.flux || null;
  } catch {
    return null;
  }
}
function getActions() {
  try {
    return revenge.discord.actions || null;
  } catch {
    return null;
  }
}
function getFileModule() {
  try {
    return revenge.discord.native.FileModule || null;
  } catch {
    return null;
  }
}
function getDesign() {
  try {
    const d = revenge.discord.design;
    return d && (d.Design || d) || null;
  } catch {
    return null;
  }
}
function getClipboard() {
  try {
    return revenge.externals.ReactNativeClipboard.Clipboard || null;
  } catch {
    return null;
  }
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
    ignoreBots: c.ignoreBots !== false,
    ignoreSelf: !!c.ignoreSelf,
    maxStored: typeof c.maxStored === "number" && c.maxStored >= 10 && c.maxStored <= 1e4 ? Math.floor(c.maxStored) : DEFAULT_SETTINGS.maxStored,
    ignoredChannels: typeof c.ignoredChannels === "string" ? c.ignoredChannels : "",
    ignoredUsers: typeof c.ignoredUsers === "string" ? c.ignoredUsers : ""
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
  try {
    (_b = (_a = apiRef == null ? void 0 : apiRef.logger) == null ? void 0 : _a.error) == null ? void 0 : _b.call(
      _a,
      "[MessageLogger] " + msg,
      e instanceof Error ? e.message : e
    );
  } catch {
  }
}
async function loadLog() {
  var _a;
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
function currentUserId() {
  var _a, _b, _c, _d, _e;
  try {
    return String((_e = (_d = (_c = (_b = (_a = getFlux()) == null ? void 0 : _a.Stores) == null ? void 0 : _b.UserStore) == null ? void 0 : _c.getCurrentUser) == null ? void 0 : _d.call(_c).id) != null ? _e : "");
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
  var _a, _b, _c, _d, _e, _f;
  const author = (_a = message == null ? void 0 : message.author) != null ? _a : {};
  return {
    id: String((_b = message == null ? void 0 : message.id) != null ? _b : ""),
    channelId: String((_d = (_c = message == null ? void 0 : message.channelId) != null ? _c : message == null ? void 0 : message.channel_id) != null ? _d : ""),
    authorId: String((_e = author.id) != null ? _e : ""),
    authorTag: author.globalName || author.username || "Unknown",
    bot: !!author.bot,
    content: String((_f = message == null ? void 0 : message.content) != null ? _f : ""),
    attachments: Array.isArray(message == null ? void 0 : message.attachments) ? message.attachments.map((a) => {
      var _a2, _b2;
      return String((_b2 = (_a2 = a == null ? void 0 : a.url) != null ? _a2 : a == null ? void 0 : a.proxy_url) != null ? _b2 : "");
    }).filter(Boolean).slice(0, 3) : [],
    timestamp: Date.parse(message == null ? void 0 : message.timestamp) || Date.now(),
    mentionsMe: me !== "" && mentionsOf(message).includes(me)
  };
}
var seen = /* @__PURE__ */ new Map();
function toast(content, key) {
  var _a, _b, _c;
  try {
    (_c = (_b = (_a = getActions()) == null ? void 0 : _a.ToastActionCreators) == null ? void 0 : _b.open) == null ? void 0 : _c.call(_b, { key, content });
  } catch {
  }
}
function toastGhostPing(entry) {
  var _a, _b, _c, _d;
  let where = "a channel";
  try {
    const ch = (_d = (_c = (_b = (_a = getFlux()) == null ? void 0 : _a.Stores) == null ? void 0 : _b.ChannelStore) == null ? void 0 : _c.getChannel) == null ? void 0 : _d.call(_c, entry.channelId);
    if (ch == null ? void 0 : ch.name) where = "#" + ch.name;
  } catch {
  }
  toast(
    "Ghost ping by " + entry.authorTag + " in " + where + ": " + entry.content.slice(0, 120),
    "msglogger-ghostping-" + entry.id
  );
}
function handleCreate(payload) {
  var _a, _b;
  if (!cfg.enabled) return;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  const channelId = String((_b = (_a = message.channelId) != null ? _a : message.channel_id) != null ? _b : "");
  if (inList(channelId, cfg.ignoredChannels)) return;
  const snap = snapshotOf(message, currentUserId());
  if (cfg.ignoreBots && snap.bot) return;
  if (cfg.ignoreSelf && snap.authorId && snap.authorId === currentUserId()) return;
  if (inList(snap.authorId, cfg.ignoredUsers)) return;
  seen.set(snap.id, snap);
  if (seen.size > cfg.maxStored * 4) {
    const first = seen.keys().next();
    if (!first.done) seen.delete(first.value);
  }
}
function handleDelete(payload) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  if (!cfg.enabled || !cfg.logDeletes) return;
  const id = String((_c = (_b = (_a = payload == null ? void 0 : payload.message) == null ? void 0 : _a.id) != null ? _b : payload == null ? void 0 : payload.id) != null ? _c : "");
  const channelId = String((_f = (_e = (_d = payload == null ? void 0 : payload.message) == null ? void 0 : _d.channelId) != null ? _e : payload == null ? void 0 : payload.channelId) != null ? _f : "");
  if (!id || inList(channelId, cfg.ignoredChannels)) return;
  const snap = (_h = seen.get(id)) != null ? _h : snapshotOf((_g = payload == null ? void 0 : payload.message) != null ? _g : { id, channelId }, currentUserId());
  if (cfg.ignoreBots && snap.bot) {
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
    edits: (_j = (_i = log[id]) == null ? void 0 : _i.edits) != null ? _j : [],
    mentionsMe: snap.mentionsMe,
    ghostPing: ghost
  };
  prune(cfg.maxStored);
  void persistLog();
  if (ghost) toastGhostPing(log[id]);
}
function handleDeleteBulk(payload) {
  const ids = Array.isArray(payload == null ? void 0 : payload.ids) ? payload.ids : [];
  for (const id of ids) {
    handleDelete({ message: { id, channelId: payload == null ? void 0 : payload.channelId } });
  }
}
function handleUpdate(payload) {
  var _a, _b, _c, _d;
  if (!cfg.enabled || !cfg.logEdits) return;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  const id = String(message.id);
  const channelId = String((_b = (_a = message.channelId) != null ? _a : message.channel_id) != null ? _b : "");
  if (inList(channelId, cfg.ignoredChannels)) return;
  const prev = seen.get(id);
  const snap = snapshotOf(message, currentUserId());
  if (cfg.ignoreBots && snap.bot) return;
  if (cfg.ignoreSelf && snap.authorId && snap.authorId === currentUserId()) return;
  if (inList(snap.authorId, cfg.ignoredUsers)) return;
  seen.set(id, snap);
  const prevContent = prev && typeof prev.content === "string" ? prev.content : null;
  const isRealEdit = prevContent !== null && !!message.edited_timestamp && prevContent !== snap.content;
  if (!isRealEdit && !log[id]) return;
  const existing = log[id];
  log[id] = {
    ...snap,
    status: "edited",
    edits: [
      ...(_c = existing == null ? void 0 : existing.edits) != null ? _c : [],
      ...isRealEdit && prevContent !== null ? [prevContent] : []
    ].slice(-10),
    mentionsMe: snap.mentionsMe,
    ghostPing: (_d = existing == null ? void 0 : existing.ghostPing) != null ? _d : false
  };
  prune(cfg.maxStored);
  void persistLog();
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
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center"
      }
    },
    el(Text, { style: { flex: 1 } }, props.label),
    el(Text, { style: { opacity: 0.7, marginLeft: 8 } }, props.value ? "On" : "Off")
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
    return el(
      View,
      { style: { marginVertical: 8 } },
      el(Text, { style: { fontWeight: "bold", padding: 12 } }, props.title),
      ...props.children
    );
  }
  const DText = (props) => {
    const design = getDesign();
    const T = design == null ? void 0 : design.Text;
    return el(T || Text, props, ...Array.isArray(props == null ? void 0 : props.children) ? props.children : [props == null ? void 0 : props.children]);
  };
  return function SettingsComponent2({ api }) {
    var _a, _b, _c, _d, _e;
    const settings = (_c = (_b = (_a = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a.use) == null ? void 0 : _b.call(_a)) != null ? _c : cfg;
    const [entries, setEntries] = React.useState([]);
    const [filter, setFilter] = React.useState("all");
    const [query, setQuery] = React.useState("");
    const [refreshTick, setRefreshTick] = React.useState(0);
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
      setEntries(list.slice(0, 100));
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
    const tab = (key, label) => el(
      Pressable,
      {
        key,
        onPress: () => setFilter(key),
        style: { paddingVertical: 8, paddingHorizontal: 10 }
      },
      el(
        Text,
        { style: { fontWeight: filter === key ? "bold" : "normal" } },
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
      View,
      null,
      el(
        RowGroup,
        { title: "MessageLogger" },
        sw("enabled", "Enabled"),
        sw("logDeletes", "Log deleted messages"),
        sw("logEdits", "Log edited messages"),
        sw("ghostPings", "Ghost ping toasts", "Toast when a message mentioning you is deleted"),
        sw("ignoreBots", "Ignore bot messages"),
        sw("ignoreSelf", "Ignore your own messages")
      ),
      el(
        RowGroup,
        { title: "Ignored IDs" },
        el(DText, null, "Comma-separated channel IDs never get logged."),
        el(TextInput, {
          placeholder: "Channel IDs",
          defaultValue: (_d = settings == null ? void 0 : settings.ignoredChannels) != null ? _d : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { ignoredChannels: t });
          },
          style: { padding: 8 }
        }),
        el(DText, null, "Comma-separated user IDs never get logged."),
        el(TextInput, {
          placeholder: "User IDs",
          defaultValue: (_e = settings == null ? void 0 : settings.ignoredUsers) != null ? _e : "",
          onChangeText: (t) => {
            var _a2, _b2;
            return (_b2 = (_a2 = api == null ? void 0 : api.jsonStorage) == null ? void 0 : _a2.set) == null ? void 0 : _b2.call(_a2, { ignoredUsers: t });
          },
          style: { padding: 8 }
        })
      ),
      el(
        RowGroup,
        { title: "Saved log (" + visible.length + " shown)" },
        el(View, { style: { flexDirection: "row" } }, tab("all", "All"), tab("deleted", "Deleted"), tab("edited", "Edited"), tab("ghost", "Ghost pings")),
        el(TextInput, {
          placeholder: "Search author or text\u2026",
          value: query,
          onChangeText: setQuery,
          style: { padding: 8 }
        }),
        visible.length === 0 ? el(DText, null, "Nothing logged yet. Deleted and edited messages will appear here.") : visible.slice(0, 50).map(
          (m) => el(
            View,
            { key: m.id, style: { paddingVertical: 6 } },
            el(
              DText,
              null,
              "[" + (m.ghostPing ? "GHOST PING" : m.status === "deleted" ? "DELETED" : "EDITED") + "] " + m.authorTag + " \u2014 " + new Date(m.timestamp).toLocaleString()
            ),
            el(DText, null, m.content || "(no text content)"),
            m.attachments.length > 0 && el(DText, null, m.attachments.length + " attachment(s) saved as links"),
            m.edits.length > 0 && el(DText, null, "Previous versions: " + m.edits.join("  |  ")),
            el(
              Pressable,
              { onPress: () => void removeEntry(m.id), style: { paddingVertical: 4 } },
              el(Text, null, "Delete entry")
            )
          )
        )
      ),
      el(
        View,
        { style: { padding: 12 } },
        el(
          Pressable,
          { onPress: () => void exportLog(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { fontWeight: "bold" } }, "Copy log JSON to clipboard")
        ),
        el(
          Pressable,
          { onPress: () => void clearLog(), style: { padding: 12, alignItems: "center" } },
          el(Text, { style: { fontWeight: "bold" } }, "Clear saved log")
        ),
        el(
          Pressable,
          { onPress: () => void reload(), style: { padding: 12, alignItems: "center" } },
          el(Text, null, "Refresh list")
        )
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
    apiRef = { logger };
    try {
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
      const flux = getFlux();
      if (!flux || typeof flux.onFluxEventDispatched !== "function") {
        hostError("flux API unavailable \u2014 capture disabled this session");
        toast("MessageLogger: flux unavailable", "msglogger-start-fail");
        return;
      }
      const register = (event, handler) => {
        try {
          cleanup(
            flux.onFluxEventDispatched(event, (payload) => {
              try {
                handler(payload);
              } catch (e) {
                hostError(event + " handler failed", e);
              }
              return payload;
            })
          );
          hostLog("registered " + event);
        } catch (e) {
          hostError("could not register " + event, e);
        }
      };
      register("MESSAGE_CREATE", handleCreate);
      register("MESSAGE_DELETE", handleDelete);
      register("MESSAGE_DELETE_BULK", handleDeleteBulk);
      register("MESSAGE_UPDATE", handleUpdate);
      cleanup(() => {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        void persistLog();
        seen.clear();
        apiRef = null;
      });
      hostLog("started");
    } catch (e) {
      hostError("start failed", e);
    }
  },
  SettingsComponent
});
var index_default2 = index_default;
; return (module.exports && module.exports.default) || module.exports; })()