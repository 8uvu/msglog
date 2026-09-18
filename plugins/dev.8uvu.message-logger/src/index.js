(() => { const module = { exports: {} }; const exports = module.exports; var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// D:/Revenge plugins/message-logger/js/index.tsx
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_react = (({ default: revenge.react.React, ...revenge.react.React }));
var import_react_native = (({ ...revenge.react.ReactNative }));
var import_clipboard = __toESM((({ default: revenge.externals.ReactNativeClipboard.Clipboard, ...revenge.externals.ReactNativeClipboard.Clipboard })));
var import_actions = (revenge.discord.actions);
var import_design = (revenge.discord.design);
var import_flux = (revenge.discord.flux);
var import_native = (revenge.discord.native);
var import_jsx_runtime = (({ jsx: revenge.react.ReactJSXRuntime.jsx, jsxs: revenge.react.ReactJSXRuntime.jsxs, Fragment: revenge.react.ReactJSXRuntime.Fragment }));
var LOG_FILE = "message-logger/logs.json";
var log = {};
var logDir = "";
var flushTimer = null;
var apiRef = null;
function logPath() {
  return logDir + "/" + LOG_FILE;
}
async function loadLog(logger) {
  var _a;
  try {
    logDir = import_native.FileModule.getConstants().DocumentsDirPath;
    const raw = await import_native.FileModule.readFile(logPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") log = parsed;
  } catch (e) {
    log = {};
    (_a = logger == null ? void 0 : logger.log) == null ? void 0 : _a.call(logger, "MessageLogger: starting with an empty log");
  }
}
async function persistLog() {
  var _a, _b;
  try {
    await import_native.FileModule.writeFile("documents", LOG_FILE, JSON.stringify(log), "utf8");
  } catch (e) {
    (_b = (_a = apiRef == null ? void 0 : apiRef.logger) == null ? void 0 : _a.error) == null ? void 0 : _b.call(_a, "MessageLogger: failed to write log file");
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
    return String((_e = (_d = (_c = (_b = (_a = import_flux.Stores) == null ? void 0 : _a.UserStore) == null ? void 0 : _b.getCurrentUser) == null ? void 0 : _c.call(_b)) == null ? void 0 : _d.id) != null ? _e : "");
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
    authorId: String((_e = author == null ? void 0 : author.id) != null ? _e : ""),
    authorTag: (author == null ? void 0 : author.globalName) || (author == null ? void 0 : author.username) || "Unknown",
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
function toastGhostPing(entry) {
  var _a, _b, _c;
  try {
    let where = "a channel";
    try {
      const ch = (_c = (_b = (_a = import_flux.Stores) == null ? void 0 : _a.ChannelStore) == null ? void 0 : _b.getChannel) == null ? void 0 : _c.call(_b, entry.channelId);
      if (ch == null ? void 0 : ch.name) where = "#" + ch.name;
    } catch {
    }
    import_actions.ToastActionCreators.open({
      key: "msglogger-ghostping-" + entry.id,
      content: `Ghost ping by ${entry.authorTag} in ${where}: ${entry.content.slice(0, 120)}`
    });
  } catch {
  }
}
function handleCreate(payload, cfg) {
  var _a, _b, _c, _d;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  if (!cfg.enabled) return;
  const channelId = String((_b = (_a = message.channelId) != null ? _a : message.channel_id) != null ? _b : "");
  if (inList(channelId, cfg.ignoredChannels)) return;
  const authorId = String((_d = (_c = message == null ? void 0 : message.author) == null ? void 0 : _c.id) != null ? _d : "");
  if (authorId && inList(authorId, cfg.ignoredUsers)) return;
  seen.set(String(message.id), snapshotOf(message, currentUserId()));
  if (seen.size > cfg.maxStored * 4) {
    const first = seen.keys().next();
    if (!first.done) seen.delete(first.value);
  }
}
function handleDelete(payload, cfg) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  if (!cfg.enabled || !cfg.logDeletes) return;
  const id = String((_c = (_b = (_a = payload == null ? void 0 : payload.message) == null ? void 0 : _a.id) != null ? _b : payload == null ? void 0 : payload.id) != null ? _c : "");
  const channelId = String((_f = (_e = (_d = payload == null ? void 0 : payload.message) == null ? void 0 : _d.channelId) != null ? _e : payload == null ? void 0 : payload.channelId) != null ? _f : "");
  if (!id || inList(channelId, cfg.ignoredChannels)) return;
  const snap = (_h = seen.get(id)) != null ? _h : { ...snapshotOf((_g = payload == null ? void 0 : payload.message) != null ? _g : { id, channelId }, currentUserId()) };
  if (inList(snap.authorId, cfg.ignoredUsers)) {
    seen.delete(id);
    return;
  }
  seen.delete(id);
  const ghost = cfg.ghostPings && snap.mentionsMe;
  log[id] = { ...snap, status: "deleted", edits: (_j = (_i = log[id]) == null ? void 0 : _i.edits) != null ? _j : [], mentionsMe: snap.mentionsMe, ghostPing: ghost };
  prune(cfg.maxStored);
  persistLog();
  if (ghost) toastGhostPing(log[id]);
}
function handleUpdate(payload, cfg) {
  var _a, _b, _c, _d;
  if (!cfg.enabled || !cfg.logEdits) return;
  const message = payload == null ? void 0 : payload.message;
  if (!(message == null ? void 0 : message.id)) return;
  const id = String(message.id);
  const channelId = String((_b = (_a = message.channelId) != null ? _a : message.channel_id) != null ? _b : "");
  if (inList(channelId, cfg.ignoredChannels)) return;
  const prev = seen.get(id);
  const snap = snapshotOf(message, currentUserId());
  if (inList(snap.authorId, cfg.ignoredUsers)) return;
  seen.set(id, snap);
  const oldContent = prev && prev.content !== snap.content ? prev.content : null;
  const existing = log[id];
  log[id] = {
    ...snap,
    status: "edited",
    edits: [...(_c = existing == null ? void 0 : existing.edits) != null ? _c : [], ...oldContent ? [oldContent] : []].slice(-10),
    mentionsMe: snap.mentionsMe,
    ghostPing: (_d = existing == null ? void 0 : existing.ghostPing) != null ? _d : false
  };
  prune(cfg.maxStored);
  persistLog();
}
function readCfg(jsonStorage) {
  var _a, _b, _c, _d, _e;
  const c = (_a = jsonStorage == null ? void 0 : jsonStorage.cache) != null ? _a : {};
  return {
    enabled: (_b = c.enabled) != null ? _b : true,
    logDeletes: (_c = c.logDeletes) != null ? _c : true,
    logEdits: (_d = c.logEdits) != null ? _d : true,
    ghostPings: (_e = c.ghostPings) != null ? _e : true,
    maxStored: typeof c.maxStored === "number" ? c.maxStored : 300,
    ignoredChannels: typeof c.ignoredChannels === "string" ? c.ignoredChannels : "",
    ignoredUsers: typeof c.ignoredUsers === "string" ? c.ignoredUsers : ""
  };
}
var index_default = plugin({
  jsonStorage: {
    load: true,
    default: {
      enabled: true,
      logDeletes: true,
      logEdits: true,
      ghostPings: true,
      maxStored: 300,
      ignoredChannels: "",
      ignoredUsers: ""
    }
  },
  async start({ cleanup, jsonStorage, logger }) {
    apiRef = { logger };
    await loadLog(logger);
    cleanup(
      (0, import_flux.onFluxEventDispatched)("MESSAGE_CREATE", (payload) => {
        try {
          handleCreate(payload, readCfg(jsonStorage));
        } catch (e) {
          logger.error("create handler failed");
        }
        return payload;
      }),
      (0, import_flux.onFluxEventDispatched)("MESSAGE_DELETE", (payload) => {
        try {
          handleDelete(payload, readCfg(jsonStorage));
        } catch (e) {
          logger.error("delete handler failed");
        }
        return payload;
      }),
      (0, import_flux.onFluxEventDispatched)("MESSAGE_UPDATE", (payload) => {
        try {
          handleUpdate(payload, readCfg(jsonStorage));
        } catch (e) {
          logger.error("update handler failed");
        }
        return payload;
      }),
      () => {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        persistLog();
        seen.clear();
        apiRef = null;
      }
    );
    logger.log("MessageLogger started");
  },
  SettingsComponent({ api }) {
    var _a, _b, _c, _d;
    const settings = api.jsonStorage.use();
    const [entries, setEntries] = (0, import_react.useState)([]);
    const [filter, setFilter] = (0, import_react.useState)("all");
    const [query, setQuery] = (0, import_react.useState)("");
    const [refreshTick, setRefreshTick] = (0, import_react.useState)(0);
    const reload = async () => {
      var _a2;
      try {
        const raw = await import_native.FileModule.readFile(logPath(), "utf8");
        const list = Object.values((_a2 = JSON.parse(raw)) != null ? _a2 : {});
        list.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(list.slice(0, 100));
      } catch {
        setEntries([]);
      }
    };
    (0, import_react.useEffect)(() => {
      reload();
    }, [refreshTick]);
    const { TableRowGroup, TableSwitchRow, Text: DText } = import_design.Design;
    const visible = entries.filter((m) => {
      if (filter === "deleted" && m.status !== "deleted") return false;
      if (filter === "edited" && m.status !== "edited") return false;
      if (filter === "ghost" && !m.ghostPing) return false;
      const q = query.trim().toLowerCase();
      if (q && !(m.content.toLowerCase().includes(q) || m.authorTag.toLowerCase().includes(q))) return false;
      return true;
    });
    const removeEntry = async (id) => {
      var _a2;
      try {
        const raw = await import_native.FileModule.readFile(logPath(), "utf8");
        const obj = (_a2 = JSON.parse(raw)) != null ? _a2 : {};
        delete obj[id];
        delete log[id];
        await import_native.FileModule.writeFile("documents", LOG_FILE, JSON.stringify(obj), "utf8");
        reload();
      } catch {
      }
    };
    const exportLog = async () => {
      try {
        const raw = await import_native.FileModule.readFile(logPath(), "utf8");
        import_clipboard.default.setString(typeof raw === "string" ? raw : JSON.stringify(raw));
        import_actions.ToastActionCreators.open({ key: "msglogger-export", content: "Log copied to clipboard" });
      } catch {
        import_actions.ToastActionCreators.open({ key: "msglogger-export-fail", content: "Export failed \u2014 see log file" });
      }
    };
    const clearLog = async () => {
      log = {};
      await persistLog();
      reload();
    };
    const tab = (key, label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { onPress: () => setFilter(key), style: { paddingVertical: 8, paddingHorizontal: 10 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { fontWeight: filter === key ? "bold" : "normal" }, children: label }) }, key);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRowGroup, { title: "MessageLogger", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          TableSwitchRow,
          {
            label: "Enabled",
            value: (_a = settings == null ? void 0 : settings.enabled) != null ? _a : true,
            onValueChange: (v) => api.jsonStorage.set({ enabled: v })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          TableSwitchRow,
          {
            label: "Log deleted messages",
            value: (_b = settings == null ? void 0 : settings.logDeletes) != null ? _b : true,
            onValueChange: (v) => api.jsonStorage.set({ logDeletes: v })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          TableSwitchRow,
          {
            label: "Log edited messages",
            value: (_c = settings == null ? void 0 : settings.logEdits) != null ? _c : true,
            onValueChange: (v) => api.jsonStorage.set({ logEdits: v })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          TableSwitchRow,
          {
            label: "Ghost ping toasts",
            subLabel: "Toast when a message mentioning you is deleted",
            value: (_d = settings == null ? void 0 : settings.ghostPings) != null ? _d : true,
            onValueChange: (v) => api.jsonStorage.set({ ghostPings: v })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRowGroup, { title: `Saved log (${visible.length} shown)`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { flexDirection: "row" }, children: [
          tab("all", "All"),
          tab("deleted", "Deleted"),
          tab("edited", "Edited"),
          tab("ghost", "Ghost pings")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_react_native.TextInput,
          {
            placeholder: "Search author or text\u2026",
            value: query,
            onChangeText: setQuery,
            style: { padding: 8 }
          }
        ),
        visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DText, { children: "Nothing logged yet. Deleted and edited messages will appear here." }) : visible.slice(0, 50).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { paddingVertical: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DText, { children: [
            "[",
            m.ghostPing ? "GHOST PING" : m.status === "deleted" ? "DELETED" : "EDITED",
            "] ",
            m.authorTag,
            " \u2014 ",
            new Date(m.timestamp).toLocaleString()
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DText, { children: m.content || "(no text content)" }),
          m.attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DText, { children: [
            m.attachments.length,
            " attachment(s) saved as links"
          ] }),
          m.edits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DText, { children: [
            "Previous versions: ",
            m.edits.join("  |  ")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { onPress: () => removeEntry(m.id), style: { paddingVertical: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { children: "Delete entry" }) })
        ] }, m.id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react_native.View, { style: { padding: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { onPress: exportLog, style: { padding: 12, alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { fontWeight: "bold" }, children: "Copy log JSON to clipboard" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { onPress: clearLog, style: { padding: 12, alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { style: { fontWeight: "bold" }, children: "Clear saved log" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Pressable, { onPress: () => reload(), style: { padding: 12, alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native.Text, { children: "Refresh list" }) })
      ] })
    ] });
  }
});
; return (module.exports && module.exports.default) || module.exports; })()