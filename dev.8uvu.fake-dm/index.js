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

// plugins/dev.8uvu.fake-dm/js/index.tsx
var index_exports = {};
__export(index_exports, {
  SYSTEM_TYPES: () => SYSTEM_TYPES,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var DEFAULT_SETTINGS = {
  jitterSeconds: true
  // randomize seconds like the desktop plugin's randomSeconds
};
function getReact() {
  var _a, _b, _c, _d, _e, _f;
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
      const r = b.React || ((_a = b.common) == null ? void 0 : _a.React) || ((_c = (_b = b.metro) == null ? void 0 : _b.common) == null ? void 0 : _c.React);
      if (r) return r;
    }
  } catch {
  }
  try {
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const r = ((_d = v.common) == null ? void 0 : _d.React) || ((_f = (_e = v.metro) == null ? void 0 : _e.common) == null ? void 0 : _f.React) || v.React;
      if (r) return r;
    }
  } catch {
  }
  return null;
}
function getRN() {
  var _a, _b, _c, _d, _e, _f, _g;
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
    if (typeof vendetta !== "undefined") {
      const v = vendetta;
      const rn = ((_e = v.common) == null ? void 0 : _e.ReactNative) || ((_g = (_f = v.metro) == null ? void 0 : _f.common) == null ? void 0 : _g.ReactNative);
      if (rn) return rn;
    }
  } catch {
  }
  return null;
}
function getMetro() {
  try {
    const n = typeof revenge !== "undefined" && (revenge == null ? void 0 : revenge.metro) || null;
    if (n) return n;
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    if (b == null ? void 0 : b.metro) return b.metro;
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    if (v == null ? void 0 : v.metro) return v.metro;
  } catch {
  }
  return null;
}
function getDispatch() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    const f = typeof revenge !== "undefined" && ((_b = (_a = revenge == null ? void 0 : revenge.discord) == null ? void 0 : _a.flux) == null ? void 0 : _b.dispatcher) || null;
    if (f && typeof f.dispatch === "function") return f.dispatch.bind(f);
  } catch {
  }
  try {
    const metro = getMetro();
    const rd = (_c = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _c.call(metro, "dispatch", "subscribe");
    if (rd && typeof rd.dispatch === "function") return rd.dispatch.bind(rd);
    const rd2 = (_d = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _d.call(metro, "dispatch", "_dispatcher");
    if (rd2 && typeof rd2.dispatch === "function") return rd2.dispatch.bind(rd2);
  } catch {
  }
  try {
    const v = typeof vendetta !== "undefined" ? vendetta : null;
    const fd = ((_f = (_e = v == null ? void 0 : v.metro) == null ? void 0 : _e.common) == null ? void 0 : _f.FluxDispatcher) || ((_g = v == null ? void 0 : v.common) == null ? void 0 : _g.FluxDispatcher);
    if (fd == null ? void 0 : fd.dispatch) return fd.dispatch.bind(fd);
  } catch {
  }
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    const fd = ((_i = (_h = b == null ? void 0 : b.metro) == null ? void 0 : _h.common) == null ? void 0 : _i.FluxDispatcher) || ((_j = b == null ? void 0 : b.common) == null ? void 0 : _j.FluxDispatcher);
    if (fd == null ? void 0 : fd.dispatch) return fd.dispatch.bind(fd);
  } catch {
  }
  return null;
}
function findStore(name, props) {
  var _a, _b, _c, _d, _e, _f;
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
  try {
    const b = typeof bunny !== "undefined" ? bunny : null;
    if ((_f = (_e = b == null ? void 0 : b.metro) == null ? void 0 : _e.common) == null ? void 0 : _f[name]) return b.metro.common[name];
  } catch {
  }
  return null;
}
function getUserStore() {
  return findStore("UserStore", ["getCurrentUser"]);
}
function getChannelStore() {
  return findStore("ChannelStore", ["getChannel"]);
}
function getMessageStore() {
  return findStore("MessageStore", ["getMessage", "getMessages"]);
}
function getSelectedChannelStore() {
  return findStore("SelectedChannelStore", ["getChannelId", "getSelectedChannelId"]);
}
function getGuildMemberStore() {
  return findStore("GuildMemberStore", ["getMembers", "getMember"]);
}
function currentChannelId() {
  var _a, _b, _c, _d;
  try {
    const s = getSelectedChannelStore();
    return String((_d = (_c = (_a = s == null ? void 0 : s.getChannelId) == null ? void 0 : _a.call(s)) != null ? _c : (_b = s == null ? void 0 : s.getSelectedChannelId) == null ? void 0 : _b.call(s)) != null ? _d : "");
  } catch {
    return "";
  }
}
function hostError(msg, e) {
  var _a, _b, _c;
  try {
    const logger = typeof revenge !== "undefined" && (revenge == null ? void 0 : revenge.logger) || typeof bunny !== "undefined" && ((_a = bunny == null ? void 0 : bunny.plugin) == null ? void 0 : _a.logger) || typeof vendetta !== "undefined" && (vendetta == null ? void 0 : vendetta.logger) || console;
    ((_c = (_b = logger == null ? void 0 : logger.error) != null ? _b : logger == null ? void 0 : logger.log) != null ? _c : (() => {
    })).call(logger, "[FakeDM] " + msg, e != null ? e : "");
  } catch {
  }
}
var jsonStorageApi = null;
var storageProxy = null;
var storageKind = "";
var cfg = { ...DEFAULT_SETTINGS };
var fakesCache = [];
function readFakes() {
  return Array.isArray(fakesCache) ? fakesCache : [];
}
function persistFakes(list) {
  var _a;
  fakesCache = list;
  try {
    if (jsonStorageApi) {
      void ((_a = jsonStorageApi.set) == null ? void 0 : _a.call(jsonStorageApi, { fakes: list }));
      return;
    }
    if (storageProxy) {
      if (storageKind === "bunny" && storageProxy.data) {
        storageProxy.data = { ...storageProxy.data, fakes: list };
      } else {
        storageProxy.fakes = list;
      }
    }
  } catch (e) {
    hostError("could not persist fakes", e);
  }
}
function refreshConfigFromStorage() {
  var _a, _b, _c, _d;
  try {
    if (jsonStorageApi) {
      const s = (_b = (_a = jsonStorageApi.use) == null ? void 0 : _a.call(jsonStorageApi)) != null ? _b : null;
      if (s && typeof s === "object") cfg = { ...DEFAULT_SETTINGS, ...s };
      const f = s == null ? void 0 : s.fakes;
      if (Array.isArray(f)) fakesCache = f;
      return;
    }
    if (storageProxy) {
      const s = storageKind === "bunny" ? (_c = storageProxy == null ? void 0 : storageProxy.data) == null ? void 0 : _c.settings : storageProxy == null ? void 0 : storageProxy.settings;
      if (s && typeof s === "object") cfg = { ...DEFAULT_SETTINGS, ...s };
      const f = storageKind === "bunny" ? (_d = storageProxy == null ? void 0 : storageProxy.data) == null ? void 0 : _d.fakes : storageProxy == null ? void 0 : storageProxy.fakes;
      if (Array.isArray(f)) fakesCache = f;
    }
  } catch (e) {
    hostError("could not read settings", e);
  }
}
var _idCounter = 0;
function uniqueSnowflake(date) {
  try {
    const offset = _idCounter++ % 4096;
    const ms = Math.max(0, date.getTime() - 14200704e5);
    return (BigInt(ms) << /* @__PURE__ */ BigInt("22") | BigInt(offset)).toString();
  } catch {
    return String(date.getTime()) + String(_idCounter++ % 4096).padStart(4, "0");
  }
}
function randomSeconds(date) {
  if (!cfg.jitterSeconds) return new Date(Math.floor(date.getTime() / 1e3) * 1e3);
  const sec = 1 + Math.floor(Math.random() * 59);
  return new Date(date.getTime() + sec * 1e3);
}
function buildAuthor(user) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  return {
    id: String(user.id),
    username: (_a = user.username) != null ? _a : "unknown",
    discriminator: (_b = user.discriminator) != null ? _b : "0",
    avatar: (_c = user.avatar) != null ? _c : null,
    public_flags: (_e = (_d = user.publicFlags) != null ? _d : user.public_flags) != null ? _e : 0,
    flags: (_f = user.flags) != null ? _f : 0,
    banner: (_g = user.banner) != null ? _g : null,
    accent_color: null,
    global_name: (_i = (_h = user.globalName) != null ? _h : user.global_name) != null ? _i : user.username,
    bot: !!user.bot
  };
}
function toDiscordEmbed(embed) {
  var _a, _b, _c;
  const d = {};
  if (embed.title) d.title = embed.title;
  if (embed.description) d.description = embed.description;
  if (embed.url) d.url = embed.url;
  if (embed.color !== void 0) d.color = embed.color;
  if ((_a = embed.image) == null ? void 0 : _a.url) d.image = { url: embed.image.url, proxy_url: embed.image.url };
  if ((_b = embed.thumbnail) == null ? void 0 : _b.url) d.thumbnail = { url: embed.thumbnail.url, proxy_url: embed.thumbnail.url };
  if ((_c = embed.fields) == null ? void 0 : _c.length) d.fields = embed.fields.map((f) => ({ name: f.name, value: f.value, inline: !!f.inline }));
  return d;
}
var _attachIdCounter = 0;
function injectMessage(channelId, author, content, date, persistedId, attachments, replyTo, embeds) {
  const dispatch = getDispatch();
  if (!dispatch || !(author == null ? void 0 : author.id)) return null;
  const actualDate = persistedId ? date : randomSeconds(date);
  const id = persistedId != null ? persistedId : uniqueSnowflake(actualDate);
  const attach = (attachments != null ? attachments : []).map((a, i) => {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
      id: (_a = a.id) != null ? _a : String(++_attachIdCounter),
      filename: (_b = a.filename) != null ? _b : "image.png",
      size: (_c = a.size) != null ? _c : 0,
      url: a.url,
      proxy_url: (_d = a.proxy_url) != null ? _d : a.url,
      width: (_e = a.width) != null ? _e : 0,
      height: (_f = a.height) != null ? _f : 0,
      content_type: (_g = a.content_type) != null ? _g : "image/png"
    };
  });
  const message = {
    attachments: attach,
    components: [],
    embeds: [],
    mention_roles: [],
    mentions: [],
    author: buildAuthor(author),
    channel_id: channelId,
    content: String(content != null ? content : ""),
    edited_timestamp: null,
    flags: 0,
    id,
    mention_everyone: false,
    nonce: id,
    pinned: false,
    timestamp: actualDate.toISOString(),
    tts: false,
    type: 0
  };
  if (replyTo == null ? void 0 : replyTo.messageId) {
    message.message_reference = { channel_id: channelId, message_id: replyTo.messageId };
  }
  if (embeds && embeds.length > 0) {
    message.embeds = embeds.map(toDiscordEmbed);
  }
  try {
    dispatch({ type: "MESSAGE_CREATE", channelId, message, optimistic: false, isPushNotification: false });
  } catch (e) {
    hostError("injectMessage dispatch failed", e);
    return null;
  }
  if (!persistedId) {
    const list = readFakes().slice();
    list.push({
      type: "message",
      channelId,
      authorId: String(author.id),
      content: String(content != null ? content : ""),
      attachments: attach,
      timestamp: actualDate.toISOString(),
      snowflakeId: id,
      replyToId: replyTo == null ? void 0 : replyTo.messageId,
      embeds
    });
    persistFakes(list);
  }
  return id;
}
function injectCall(channelId, caller, other, missed, durationSec, date, persistedId, persistedEndedTs) {
  var _a, _b;
  const dispatch = getDispatch();
  if (!dispatch || !(caller == null ? void 0 : caller.id)) return null;
  const actualDate = persistedId ? date : randomSeconds(date);
  const id = persistedId != null ? persistedId : uniqueSnowflake(actualDate);
  const participants = missed ? [String(caller.id)] : [String(caller.id), String((_a = other == null ? void 0 : other.id) != null ? _a : caller.id)];
  const endedDate = missed ? actualDate : persistedEndedTs ? new Date(persistedEndedTs) : new Date(actualDate.getTime() + durationSec * 1e3);
  try {
    dispatch({
      type: "MESSAGE_CREATE",
      channelId,
      message: {
        attachments: [],
        components: [],
        embeds: [],
        mention_roles: [],
        mentions: [],
        author: buildAuthor(caller),
        channel_id: channelId,
        content: "",
        edited_timestamp: null,
        flags: 0,
        id,
        mention_everyone: false,
        nonce: id,
        pinned: false,
        timestamp: actualDate.toISOString(),
        tts: false,
        type: 3,
        call: {
          participants,
          ended_timestamp: endedDate.toISOString(),
          duration: missed ? void 0 : durationSec
        }
      },
      optimistic: false,
      isPushNotification: false
    });
  } catch (e) {
    hostError("injectCall dispatch failed", e);
    return null;
  }
  if (!persistedId) {
    const list = readFakes().slice();
    list.push({
      type: "call",
      channelId,
      callerId: String(caller.id),
      otherId: String((_b = other == null ? void 0 : other.id) != null ? _b : ""),
      missed,
      durationSec,
      timestamp: actualDate.toISOString(),
      endedTimestamp: endedDate.toISOString(),
      snowflakeId: id
    });
    persistFakes(list);
  }
  return id;
}
var SYSTEM_TYPES = [
  { value: 1, label: "User joined" },
  { value: 2, label: "User left" },
  { value: 4, label: "Name change" },
  { value: 5, label: "Icon change" },
  { value: 6, label: "Pinned a message" },
  { value: 7, label: "Joined server" }
];
function injectSystemMessage(channelId, author, systemType, content, date) {
  const dispatch = getDispatch();
  if (!dispatch || !(author == null ? void 0 : author.id)) return null;
  const actualDate = randomSeconds(date);
  const id = uniqueSnowflake(actualDate);
  try {
    dispatch({
      type: "MESSAGE_CREATE",
      channelId,
      message: {
        attachments: [],
        components: [],
        embeds: [],
        mention_roles: [],
        mentions: [],
        author: buildAuthor(author),
        channel_id: channelId,
        content: String(content != null ? content : ""),
        edited_timestamp: null,
        flags: 0,
        id,
        mention_everyone: false,
        nonce: id,
        pinned: false,
        timestamp: actualDate.toISOString(),
        tts: false,
        type: systemType
      },
      optimistic: false,
      isPushNotification: false
    });
  } catch (e) {
    hostError("injectSystemMessage dispatch failed", e);
    return null;
  }
  const list = readFakes().slice();
  list.push({
    type: "message",
    channelId,
    authorId: String(author.id),
    content: String(content != null ? content : ""),
    timestamp: actualDate.toISOString(),
    snowflakeId: id,
    systemType
  });
  persistFakes(list);
  return id;
}
function injectReaction(channelId, messageId, userId, emoji) {
  const dispatch = getDispatch();
  if (!dispatch || !channelId || !messageId || !emoji) return false;
  try {
    dispatch({
      type: "MESSAGE_REACTION_ADD",
      channelId,
      messageId,
      userId,
      emoji: { name: emoji, id: null, animated: false }
    });
  } catch (e) {
    hostError("injectReaction dispatch failed", e);
    return false;
  }
  const list = readFakes().slice();
  list.push({ type: "reaction", channelId, messageId, userId, emoji, snowflakeId: uniqueSnowflake(/* @__PURE__ */ new Date()) });
  persistFakes(list);
  return true;
}
function editFakeMessage(channelId, messageId, newContent, newTimestamp) {
  var _a, _b;
  const dispatch = getDispatch();
  if (!dispatch) return false;
  const cached = (_b = (_a = getMessageStore()) == null ? void 0 : _a.getMessage) == null ? void 0 : _b.call(_a, channelId, messageId);
  if (!cached) {
    hostError("editFakeMessage: message not in cache, cannot edit safely");
    return false;
  }
  const ts = newTimestamp ? new Date(newTimestamp).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
  const updated = { ...cached, content: newContent, edited_timestamp: ts };
  try {
    dispatch({ type: "MESSAGE_UPDATE", channelId, message: updated });
  } catch (e) {
    hostError("editFakeMessage dispatch failed", e);
    return false;
  }
  const list = readFakes();
  for (const f of list) {
    if (f.type === "message" && f.snowflakeId === messageId) {
      f.content = newContent;
      break;
    }
  }
  persistFakes(list);
  return true;
}
function clearFakesInChannel(channelId, ids) {
  const dispatch = getDispatch();
  const list = readFakes();
  const target = ids != null ? ids : new Set(list.filter((f) => f.type !== "reaction" && f.channelId === channelId).map((f) => f.snowflakeId));
  let n = 0;
  for (const f of list) {
    if (f.type === "reaction") continue;
    if (f.channelId !== channelId || !target.has(f.snowflakeId)) continue;
    if (dispatch) {
      try {
        dispatch({ type: "MESSAGE_DELETE", channelId, id: f.snowflakeId, mlDeleted: true });
      } catch {
      }
    }
    n++;
  }
  persistFakes(list.filter((f) => !(f.type !== "reaction" && f.channelId === channelId && target.has(f.snowflakeId))));
  return n;
}
function removeFakeById(id) {
  const f = readFakes().find((x) => x.snowflakeId === id);
  if (!f || f.type === "reaction") return false;
  return clearFakesInChannel(f.channelId, /* @__PURE__ */ new Set([f.snowflakeId])) > 0;
}
var restoredThisSession = false;
function messageInCache(channelId, messageId) {
  var _a, _b;
  try {
    return !!((_b = (_a = getMessageStore()) == null ? void 0 : _a.getMessage) == null ? void 0 : _b.call(_a, channelId, messageId));
  } catch {
    return false;
  }
}
function doRestore() {
  var _a, _b, _c;
  if (restoredThisSession) return 0;
  restoredThisSession = true;
  const userStore = getUserStore();
  let n = 0;
  for (const f of readFakes()) {
    try {
      if (f.type === "message") {
        if (messageInCache(f.channelId, f.snowflakeId)) continue;
        const author = (_a = userStore == null ? void 0 : userStore.getUser) == null ? void 0 : _a.call(userStore, f.authorId);
        if (!author) continue;
        injectMessage(f.channelId, author, f.content, new Date(f.timestamp), f.snowflakeId, f.attachments, f.replyToId ? { messageId: f.replyToId } : void 0, f.embeds);
        n++;
      } else if (f.type === "call") {
        if (messageInCache(f.channelId, f.snowflakeId)) continue;
        const caller = (_b = userStore == null ? void 0 : userStore.getUser) == null ? void 0 : _b.call(userStore, f.callerId);
        const other = (_c = userStore == null ? void 0 : userStore.getUser) == null ? void 0 : _c.call(userStore, f.otherId);
        if (!caller) continue;
        injectCall(f.channelId, caller, other != null ? other : caller, f.missed, f.durationSec, new Date(f.timestamp), f.snowflakeId, f.endedTimestamp);
        n++;
      }
    } catch (e) {
      hostError("restore failed for a fake", e);
    }
  }
  return n;
}
function scheduleRestore(onConnectionOpen) {
  var _a;
  try {
    const dispatch = getDispatch();
    const rawDispatcher = null;
    void rawDispatcher;
    const metro = getMetro();
    const fd = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "dispatch", "subscribe");
    if (fd && typeof fd.subscribe === "function" && typeof onConnectionOpen === "function") {
      const handler = () => {
        try {
          fd.unsubscribe("CONNECTION_OPEN", handler);
        } catch {
        }
        setTimeout(onConnectionOpen, 1200);
      };
      fd.subscribe("CONNECTION_OPEN", handler);
      void dispatch;
    }
  } catch (e) {
    hostError("could not subscribe CONNECTION_OPEN", e);
  }
  setTimeout(() => {
    try {
      doRestore();
    } catch (e) {
      hostError("timed restore failed", e);
    }
  }, 2e3);
}
function parseBatchScript(text) {
  var _a;
  const lines = [];
  for (const raw of String(text != null ? text : "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^\[?(\d{1,2}):(\d{2})\]?\s*(?:([^:]+?):)?\s*(.+)$/);
    if (!m) continue;
    lines.push({
      time: String(Math.min(23, parseInt(m[1], 10))).padStart(2, "0") + ":" + m[2],
      senderName: ((_a = m[3]) != null ? _a : "").trim(),
      content: m[4].trim()
    });
  }
  return lines;
}
function resolveBatchAuthor(name, candidates, me) {
  var _a, _b, _c, _d, _e, _f;
  if (!name) return me;
  const lower = name.toLowerCase();
  if (lower === "me") return me;
  for (const u of candidates) {
    const uname = String((_c = (_b = (_a = u.globalName) != null ? _a : u.global_name) != null ? _b : u.username) != null ? _c : "").toLowerCase();
    if (uname === lower || String((_d = u.username) != null ? _d : "").toLowerCase() === lower) return u;
  }
  if (/^\d{5,}$/.test(name)) {
    const byId = (_f = (_e = getUserStore()) == null ? void 0 : _e.getUser) == null ? void 0 : _f.call(_e, name);
    if (byId) return byId;
  }
  return null;
}
function injectBatch(channelId, lines, candidates, me, baseDate) {
  let n = 0;
  for (const line of lines) {
    const author = resolveBatchAuthor(line.senderName, candidates, me);
    if (!author) continue;
    const [h, m] = line.time.split(":").map(Number);
    const msgDate = new Date(baseDate);
    msgDate.setHours(h, m, 0, 0);
    if (injectMessage(channelId, author, line.content, msgDate)) n++;
  }
  return n;
}
function memberCandidates() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const out = [];
  const me = (_b = (_a = getUserStore()) == null ? void 0 : _a.getCurrentUser) == null ? void 0 : _b.call(_a);
  if (me) out.push(me);
  try {
    const chId = currentChannelId();
    const ch = (_d = (_c = getChannelStore()) == null ? void 0 : _c.getChannel) == null ? void 0 : _d.call(_c, chId);
    const ids = (_g = (_f = ch == null ? void 0 : ch.recipients) != null ? _f : (_e = ch == null ? void 0 : ch.rawRecipients) == null ? void 0 : _e.map((r) => r.id)) != null ? _g : [];
    for (const id of ids) {
      const u = (_i = (_h = getUserStore()) == null ? void 0 : _h.getUser) == null ? void 0 : _i.call(_h, id);
      if (u) out.push(u);
    }
    const guildId = (_j = ch == null ? void 0 : ch.guild_id) != null ? _j : ch == null ? void 0 : ch.guildId;
    if (guildId) {
      const members = (_m = (_l = (_k = getGuildMemberStore()) == null ? void 0 : _k.getMembers) == null ? void 0 : _l.call(_k, guildId)) != null ? _m : [];
      for (const m of members.slice(0, 40)) {
        const u = (_q = (_n = getUserStore()) == null ? void 0 : _n.getUser) == null ? void 0 : _q.call(_n, (_p = m.userId) != null ? _p : (_o = m == null ? void 0 : m.user) == null ? void 0 : _o.id);
        if (u && !out.some((x) => String(x.id) === String(u.id))) out.push(u);
      }
    }
  } catch {
  }
  return out.slice(0, 45);
}
function userLabel(u) {
  var _a, _b, _c;
  if (!u) return "Unknown";
  return String((_c = (_b = (_a = u.globalName) != null ? _a : u.global_name) != null ? _b : u.username) != null ? _c : u.id);
}
function memberById(id) {
  var _a, _b, _c;
  if (!id) return null;
  return (_c = (_b = (_a = getUserStore()) == null ? void 0 : _a.getUser) == null ? void 0 : _b.call(_a, id)) != null ? _c : { id, username: "ID " + id };
}
function recentMessages(channelId) {
  var _a, _b, _c, _d, _e;
  try {
    let list = (_b = (_a = getMessageStore()) == null ? void 0 : _a.getMessages) == null ? void 0 : _b.call(_a, channelId);
    if (Array.isArray(list)) return list.filter((m) => m == null ? void 0 : m.id).slice(-12).reverse();
    const arr = Array.from((_e = (_d = (_c = list == null ? void 0 : list._map) == null ? void 0 : _c.values) == null ? void 0 : _d.call(_c)) != null ? _e : []);
    if (arr.length) return arr.filter((m) => m == null ? void 0 : m.id).slice(-12).reverse();
  } catch {
  }
  return [];
}
async function pickImageFromGallery() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const metro = getMetro();
  try {
    const p = (_a = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _a.call(metro, "openMediaPicker");
    if (typeof (p == null ? void 0 : p.openMediaPicker) === "function") {
      const res = await new Promise((resolve) => {
        try {
          p.openMediaPicker({ type: "image", multiple: false, onMediaSelected: (r) => resolve(r), onCanceled: () => resolve(null), onCancel: () => resolve(null) });
        } catch (e) {
          resolve(null);
        }
      });
      const uri = (_g = (_f = (_c = res == null ? void 0 : res.uri) != null ? _c : (_b = res == null ? void 0 : res[0]) == null ? void 0 : _b.uri) != null ? _f : (_e = (_d = res == null ? void 0 : res.assets) == null ? void 0 : _d[0]) == null ? void 0 : _e.uri) != null ? _g : typeof res === "string" ? res : null;
      if (uri) return String(uri);
    }
  } catch {
  }
  try {
    const p = (_h = metro == null ? void 0 : metro.findByProps) == null ? void 0 : _h.call(metro, "launchImageLibrary");
    if (typeof (p == null ? void 0 : p.launchImageLibrary) === "function") {
      const res = await new Promise((resolve) => {
        try {
          p.launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (r) => resolve(r));
        } catch {
          resolve(null);
        }
      });
      const uri = (_l = (_k = (_j = (_i = res == null ? void 0 : res.assets) == null ? void 0 : _i[0]) == null ? void 0 : _j.uri) != null ? _k : res == null ? void 0 : res.uri) != null ? _l : null;
      if (uri) return String(uri);
    }
  } catch {
  }
  return null;
}
function resolveQuickUser(text, candidates) {
  var _a, _b, _c;
  const q = String(text != null ? text : "").trim();
  if (!q) return null;
  if (/^\d{5,}$/.test(q)) return (_c = (_b = (_a = getUserStore()) == null ? void 0 : _a.getUser) == null ? void 0 : _b.call(_a, q)) != null ? _c : null;
  const lower = q.toLowerCase().replace(/^@/, "");
  for (const u of candidates) {
    const names = [u.username, u.globalName, u.global_name].filter(Boolean).map((s) => String(s).toLowerCase());
    if (names.some((n) => n === lower)) return u;
  }
  for (const u of candidates) {
    const names = [u.username, u.globalName, u.global_name].filter(Boolean).map((s) => String(s).toLowerCase());
    if (names.some((n) => n.includes(lower))) return u;
  }
  return null;
}
function presetDate(key) {
  const now = Date.now();
  if (key === "now") return new Date(now);
  const m = key.match(/^m(\d+)$/);
  if (m) return new Date(now - parseInt(m[1], 10) * 6e4);
  if (key === "yesterday-evening") {
    const d = new Date(now - 864e5);
    d.setHours(20, 34, 0, 0);
    return d;
  }
  return new Date(now);
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
      open({ key: "fakedm-" + Date.now(), content: text });
      return;
    }
  } catch {
  }
  try {
    const RN = getRN();
    (_f = (_c = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _c.show) == null ? void 0 : _f.call(_c, text, (_e = (_d = RN == null ? void 0 : RN.ToastAndroid) == null ? void 0 : _d.SHORT) != null ? _e : 0);
    return;
  } catch {
  }
  hostError("no toast channel available");
}
function hexToInt(hex) {
  const m = String(hex != null ? hex : "").trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return void 0;
  return parseInt(m, 16);
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
  const C = isDark ? { bg: "#111214", card: "#1a1b1e", text: "#ffffff", sub: "#9ba0a8", input: "#232428", chip: "#2b2d31", blurple: "#5865F2", danger: "#f04747", ok: "#23a55a", amber: "#faa61a" } : { bg: "#f2f3f5", card: "#ffffff", text: "#060607", sub: "#5c5e66", input: "#ebedef", chip: "#e3e5e8", blurple: "#5865F2", danger: "#d83c3e", ok: "#248046", amber: "#c28516" };
  function Card(props) {
    const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
    return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
  }
  function Row(props) {
    return el(View, { style: { paddingHorizontal: 14, paddingVertical: 8 } }, props.children);
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
      { onPress: props.onPress, style: [{ backgroundColor: props.danger ? C.danger : props.ok ? C.ok : C.blurple, borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 2 }, props.style] },
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
  function MemberChips(props) {
    const kids = props.members.map((u) => el(Pressable, {
      key: String(u.id),
      onPress: () => props.value === String(u.id) ? props.onChange("") : props.onChange(String(u.id)),
      style: { backgroundColor: props.value === String(u.id) ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }
    }, el(Text, { style: { color: props.value === String(u.id) ? "#ffffff" : C.text, fontSize: 13 } }, userLabel(u))));
    return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 6 } }, ...kids);
  }
  function TypeChips(props) {
    const kids = props.options.map((o) => el(Pressable, {
      key: String(o.value),
      onPress: () => props.value === o.value ? props.onChange(null) : props.onChange(o.value),
      style: { backgroundColor: props.value === o.value ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }
    }, el(Text, { style: { color: props.value === o.value ? "#ffffff" : C.text, fontSize: 13 } }, o.label)));
    return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 6 } }, ...kids);
  }
  function MsgPicker(props) {
    const msgs = recentMessages(props.channelId);
    if (!msgs.length) {
      return el(Text, { style: { color: C.sub, fontSize: 12 } }, "Open the chat, then come back here to pick a message.");
    }
    const kids = msgs.map((m) => el(Pressable, {
      key: String(m.id),
      onPress: () => props.value === String(m.id) ? props.onChange("") : props.onChange(String(m.id)),
      style: { backgroundColor: props.value === String(m.id) ? C.blurple : C.chip, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, maxWidth: 240 }
    }, el(Text, { numberOfLines: 1, style: { color: props.value === String(m.id) ? "#ffffff" : C.text, fontSize: 12 } }, String(m.content || "(attachment/embed)") + " \u2014 " + userLabel(m.author))));
    return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 6 } }, ...kids);
  }
  const TABS = [
    { key: "quick", label: "\u2605 Quick" },
    { key: "message", label: "Message" },
    { key: "call", label: "Call" },
    { key: "system", label: "System" },
    { key: "react", label: "React" },
    { key: "batch", label: "Batch" },
    { key: "fakes", label: "Fakes" }
  ];
  return function FakeDMSettings(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (jsonStorageApi == null && ((_a = props == null ? void 0 : props.api) == null ? void 0 : _a.jsonStorage)) {
      jsonStorageApi = props.api.jsonStorage;
    }
    refreshConfigFromStorage();
    const [tab, setTab] = React.useState("quick");
    const [qUser, setQUser] = React.useState("");
    const [qUserId, setQUserId] = React.useState("");
    const [qText, setQText] = React.useState("");
    const [qPreset, setQPreset] = React.useState("now");
    const [qReply, setQReply] = React.useState("");
    const [qImage, setQImage] = React.useState("");
    const [qPicking, setQPicking] = React.useState(false);
    const [senderId, setSenderId] = React.useState("");
    const [content, setContent] = React.useState("");
    const [timeText, setTimeText] = React.useState("");
    const [dateText, setDateText] = React.useState("");
    const [replyId, setReplyId] = React.useState("");
    const [imageUrl, setImageUrl] = React.useState("");
    const [embedOn, setEmbedOn] = React.useState(false);
    const [embedTitle, setEmbedTitle] = React.useState("");
    const [embedDesc, setEmbedDesc] = React.useState("");
    const [embedColor, setEmbedColor] = React.useState("#5865F2");
    const [embedImage, setEmbedImage] = React.useState("");
    const [callerId, setCallerId] = React.useState("");
    const [receiverId, setReceiverId] = React.useState("");
    const [missed, setMissed] = React.useState(false);
    const [durationMin, setDurationMin] = React.useState("2");
    const [sysSenderId, setSysSenderId] = React.useState("");
    const [sysType, setSysType] = React.useState(6);
    const [sysContent, setSysContent] = React.useState("");
    const [reactMsgId, setReactMsgId] = React.useState("");
    const [reactEmoji, setReactEmoji] = React.useState("");
    const [reactUserId, setReactUserId] = React.useState("");
    const [batchText, setBatchText] = React.useState("");
    const [batchSenderId, setBatchSenderId] = React.useState("");
    const [batchTime, setBatchTime] = React.useState("");
    const [batchDate, setBatchDate] = React.useState("");
    const [fakeTick, setFakeTick] = React.useState(0);
    const candidates = memberCandidates();
    const me = (_d = (_c = (_b = getUserStore()) == null ? void 0 : _b.getCurrentUser) == null ? void 0 : _c.call(_b)) != null ? _d : null;
    const channelId = currentChannelId();
    const [defaultsInit, setDefaultsInit] = React.useState(0);
    if (!defaultsInit && (me == null ? void 0 : me.id)) {
      setDefaultsInit(1);
      setSenderId(String(me.id));
      setBatchSenderId(String(me.id));
      setReactUserId(String(me.id));
    }
    function parseWhen(timeText2, dateText2) {
      const d = /* @__PURE__ */ new Date();
      const dm = String(dateText2 != null ? dateText2 : "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dm) d.setFullYear(parseInt(dm[1], 10), parseInt(dm[2], 10) - 1, parseInt(dm[3], 10));
      const tm = String(timeText2 != null ? timeText2 : "").trim().match(/^(\d{1,2}):(\d{2})$/);
      if (tm) d.setHours(Math.min(23, parseInt(tm[1], 10)), parseInt(tm[2], 10), 0, 0);
      return d;
    }
    const sendAs = () => el(
      View,
      null,
      el(Label, null, "Send as \u2014 tap a person (you is pre-picked)"),
      el(MemberChips, { members: candidates, value: senderId, onChange: setSenderId }),
      el(Input, { placeholder: "...or paste a user ID", value: senderId, onChangeText: (t) => setSenderId(t.replace(/[^0-9]/g, "")) })
    );
    const whenInputs = () => el(
      View,
      null,
      el(Label, null, "Time (HH:MM, optional \u2014 default now)"),
      el(Input, { placeholder: "14:30", value: timeText, onChangeText: setTimeText }),
      el(Label, null, "Date (YYYY-MM-DD, optional)"),
      el(Input, { placeholder: "2026-09-26", value: dateText, onChangeText: setDateText })
    );
    let body = null;
    if (tab === "quick") {
      const quickUser = qUserId ? memberById(qUserId) : resolveQuickUser(qUser, candidates);
      const PRESETS = [
        { key: "now", label: "Now" },
        { key: "m5", label: "5m ago" },
        { key: "m30", label: "30m ago" },
        { key: "m120", label: "2h ago" },
        { key: "yesterday-evening", label: "Yesterday 8:34 PM" }
      ];
      body = el(
        View,
        null,
        el(Label, null, "1. Who says it? Tap a friend or type their name"),
        el(MemberChips, { members: candidates, value: quickUser ? String(quickUser.id) : "", onChange: (id) => {
          setQUserId(id);
          setQUser(id ? userLabel(memberById(id)) : "");
        } }),
        el(Input, { placeholder: "@username (or leave empty = you)", value: qUser, onChangeText: (t) => {
          setQUser(t);
          setQUserId("");
        } }),
        quickUser ? el(Text, { style: { color: C.ok, fontSize: 12, marginBottom: 6 } }, "\u2713 " + userLabel(quickUser)) : el(Text, { style: { color: C.sub, fontSize: 12, marginBottom: 6 } }, "Empty = sent by you"),
        el(Label, null, "2. What do they say?"),
        el(Input, { placeholder: "Type the message\u2026", value: qText, onChangeText: setQText, multiline: true, style: { minHeight: 56, textAlignVertical: "top" } }),
        el(Label, null, "3. When? (optional)"),
        el(TypeChips, { options: PRESETS, value: qPreset, onChange: setQPreset }),
        el(Label, null, "Reply to one of YOUR messages (optional)"),
        el(MsgPicker, { channelId, value: qReply, onChange: setQReply }),
        el(
          View,
          { style: { flexDirection: "row", alignItems: "center", marginBottom: 8 } },
          el(Pressable, {
            disabled: qPicking,
            onPress: async () => {
              setQPicking(true);
              try {
                const uri = await pickImageFromGallery();
                if (uri) {
                  setQImage(uri);
                  toast("Photo attached");
                } else toast("Gallery picker not available on this build \u2014 use the Message tab for image URLs");
              } finally {
                setQPicking(false);
              }
            },
            style: { backgroundColor: C.chip, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 }
          }, el(Text, { style: { color: C.text, fontSize: 13, fontWeight: "700" } }, qPicking ? "Opening\u2026" : "\u{1F4F7} Pick photo")),
          qImage ? el(Text, { numberOfLines: 1, style: { color: C.ok, fontSize: 12, flex: 1 } }, "\u2713 photo attached") : null
        ),
        qImage ? el(Pressable, { onPress: () => setQImage(""), style: { marginBottom: 8 } }, el(Text, { style: { color: C.danger, fontSize: 12 } }, "\u2715 Remove photo")) : null,
        el(Btn, {
          label: "Inject",
          onPress: () => {
            const author = quickUser != null ? quickUser : me;
            if (!author) return toast("Could not find that user");
            const when = presetDate(qPreset);
            const attachments = qImage ? [{ url: qImage, filename: "image.png", local: true }] : void 0;
            const id = injectMessage(channelId, author, qText, when, void 0, attachments, qReply ? { messageId: qReply } : void 0, void 0);
            toast(id ? "Fake sent \u2713" : "Inject failed");
            if (id) {
              setQText("");
              setQReply("");
              setQImage("");
              setQPreset("now");
            }
            setFakeTick((n) => n + 1);
          }
        })
      );
    } else if (tab === "message") {
      body = el(
        View,
        null,
        sendAs(),
        el(Label, null, "Message"),
        el(Input, { placeholder: "Message text\u2026", value: content, onChangeText: setContent, multiline: true, style: { minHeight: 60, textAlignVertical: "top" } }),
        whenInputs(),
        el(Label, null, "Reply to \u2014 tap a message from the chat"),
        el(MsgPicker, { channelId, value: replyId, onChange: setReplyId }),
        el(Input, { placeholder: "...or paste a message ID", value: replyId, onChangeText: (t) => setReplyId(t.replace(/[^0-9]/g, "")) }),
        el(Label, null, "Image URL (optional attachment)"),
        el(Input, { placeholder: "https://\u2026/image.png", value: imageUrl, onChangeText: setImageUrl }),
        el(SwitchRow, { label: "Attach an embed", value: embedOn, onValueChange: setEmbedOn }),
        embedOn ? el(
          View,
          null,
          el(Input, { placeholder: "Embed title", value: embedTitle, onChangeText: setEmbedTitle }),
          el(Input, { placeholder: "Embed description", value: embedDesc, onChangeText: setEmbedDesc, multiline: true }),
          el(Input, { placeholder: "#5865F2", value: embedColor, onChangeText: setEmbedColor }),
          el(Input, { placeholder: "Embed image URL", value: embedImage, onChangeText: setEmbedImage })
        ) : null,
        el(Btn, {
          label: "Inject message",
          onPress: () => {
            var _a2, _b2;
            const author = memberById(senderId || ((_b2 = (_a2 = candidates[0]) == null ? void 0 : _a2.id) != null ? _b2 : ""));
            if (!author) return toast("Pick who sends it first");
            const embeds = embedOn ? [{ title: embedTitle || void 0, description: embedDesc || void 0, color: hexToInt(embedColor), image: embedImage ? { url: embedImage } : void 0 }] : void 0;
            const attachments = imageUrl ? [{ url: imageUrl, filename: imageUrl.split("/").pop() || "image.png" }] : void 0;
            const id = injectMessage(channelId, author, content, parseWhen(timeText, dateText), void 0, attachments, replyId ? { messageId: replyId } : void 0, embeds);
            toast(id ? "Fake message injected" : "Inject failed (no dispatcher?)");
            setFakeTick((n) => n + 1);
          }
        })
      );
    } else if (tab === "call") {
      body = el(
        View,
        null,
        el(Label, null, "Caller"),
        el(MemberChips, { members: candidates, value: callerId, onChange: setCallerId }),
        el(Label, null, "Receiver"),
        el(MemberChips, { members: candidates, value: receiverId, onChange: setReceiverId }),
        el(SwitchRow, { label: "Missed call", value: missed, onValueChange: setMissed }),
        el(Label, null, "Duration (minutes, ignored when missed)"),
        el(Input, { placeholder: "2", value: durationMin, onChangeText: (t) => setDurationMin(t.replace(/[^0-9]/g, "")) }),
        whenInputs(),
        el(Btn, {
          label: "Inject call",
          onPress: () => {
            var _a2, _b2, _c2, _d2;
            const caller = memberById(callerId || ((_b2 = (_a2 = candidates[0]) == null ? void 0 : _a2.id) != null ? _b2 : ""));
            if (!caller) return toast("Pick a caller first");
            const other = memberById(receiverId || ((_d2 = (_c2 = candidates.find((u) => String(u.id) !== String(caller.id))) == null ? void 0 : _c2.id) != null ? _d2 : caller.id));
            const sec = Math.max(0, parseInt(durationMin || "0", 10) || 0) * 60;
            const id = injectCall(channelId, caller, other, missed, sec, parseWhen(timeText, dateText));
            toast(id ? "Fake call injected" : "Inject failed");
            setFakeTick((n) => n + 1);
          }
        })
      );
    } else if (tab === "system") {
      body = el(
        View,
        null,
        el(Label, null, "Actor (who did it)"),
        el(MemberChips, { members: candidates, value: sysSenderId, onChange: setSysSenderId }),
        el(Label, null, "Type"),
        el(TypeChips, { options: SYSTEM_TYPES, value: sysType, onChange: setSysType }),
        el(Label, null, "Custom text (optional)"),
        el(Input, { placeholder: "Usually empty", value: sysContent, onChangeText: setSysContent, multiline: true }),
        whenInputs(),
        el(Btn, {
          label: "Inject system message",
          onPress: () => {
            var _a2, _b2;
            const author = memberById(sysSenderId || ((_b2 = (_a2 = candidates[0]) == null ? void 0 : _a2.id) != null ? _b2 : ""));
            if (!author) return toast("Pick an actor first");
            const id = injectSystemMessage(channelId, author, sysType != null ? sysType : 6, sysContent, parseWhen(timeText, dateText));
            toast(id ? "System message injected" : "Inject failed");
            setFakeTick((n) => n + 1);
          }
        })
      );
    } else if (tab === "react") {
      body = el(
        View,
        null,
        el(Label, null, "Message \u2014 tap one from the chat"),
        el(MsgPicker, { channelId, value: reactMsgId, onChange: setReactMsgId }),
        el(Label, null, "Emoji"),
        el(Input, { placeholder: "\u{1F600}", value: reactEmoji, onChangeText: setReactEmoji }),
        el(Label, null, "React as (you is pre-picked)"),
        el(MemberChips, { members: candidates, value: reactUserId, onChange: setReactUserId }),
        el(Btn, {
          label: "Inject reaction",
          onPress: () => {
            var _a2;
            const uid = reactUserId || String((_a2 = me == null ? void 0 : me.id) != null ? _a2 : "");
            if (!reactMsgId || !reactEmoji) return toast("Pick a message and an emoji first");
            const ok = injectReaction(channelId, reactMsgId, uid, reactEmoji);
            toast(ok ? "Reaction added" : "Inject failed");
            setFakeTick((n) => n + 1);
          }
        })
      );
    } else if (tab === "batch") {
      const parsed = parseBatchScript(batchText);
      body = el(
        View,
        null,
        el(Label, null, "Default sender (lines without a name)"),
        el(MemberChips, { members: candidates, value: batchSenderId, onChange: setBatchSenderId }),
        el(Label, null, "Script \u2014 one message per line, [HH:MM] optional name"),
        el(Input, {
          placeholder: "[14:30] Me: hey\n[14:31] " + userLabel((_e = candidates[1]) != null ? _e : me) + ": sup\n[14:32] Me: check this out",
          value: batchText,
          onChangeText: setBatchText,
          multiline: true,
          style: { minHeight: 100, textAlignVertical: "top" }
        }),
        el(Text, { style: { color: C.sub, fontSize: 12, marginBottom: 6 } }, parsed.length + " message(s) parsed"),
        el(Label, null, "Base date (YYYY-MM-DD, optional \u2014 times come from the script)"),
        el(Input, { placeholder: "2026-09-26", value: batchDate, onChangeText: setBatchDate }),
        el(Btn, {
          label: "Inject " + parsed.length + " messages",
          onPress: () => {
            var _a2;
            if (!parsed.length) return toast("Nothing parsed \u2014 check the format");
            const base = parseWhen(batchTime, batchDate);
            const n = injectBatch(channelId, parsed, candidates, memberById(batchSenderId || ((_a2 = me == null ? void 0 : me.id) != null ? _a2 : "")), base);
            toast(n + " fake message(s) injected" + (n < parsed.length ? " \u2014 some names unknown" : ""));
            setFakeTick((nn) => nn + 1);
          }
        })
      );
    } else {
      void fakeTick;
      const all = readFakes();
      const inChannel = all.filter((f) => f.type !== "reaction" && f.channelId === channelId);
      const shown = inChannel.length ? inChannel : all;
      body = el(
        View,
        null,
        el(
          Text,
          { style: { color: C.sub, fontSize: 12, paddingHorizontal: 14, paddingTop: 6 } },
          inChannel.length ? "Fakes in this channel: " + inChannel.length : "No fakes in this channel \u2014 showing all " + all.length
        ),
        el(Btn, {
          label: "Clear all fakes in this channel",
          danger: true,
          onPress: () => {
            const n = clearFakesInChannel(channelId);
            toast(n + " fake(s) cleared");
            setFakeTick((x) => x + 1);
          }
        }),
        ...shown.slice().reverse().slice(0, 60).map((f, i) => {
          const isMsg = f.type === "message";
          const label = isMsg ? f.systemType ? "SYSTEM" : "MESSAGE" : f.type === "call" ? "CALL" : "REACT";
          const color = isMsg ? C.blurple : f.type === "call" ? C.ok : C.amber;
          const authorName = userLabel(memberById(isMsg ? f.authorId : f.type === "call" ? f.callerId : f.userId));
          return el(
            View,
            { key: String(f.snowflakeId) + ":" + i, style: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.input } },
            el(
              View,
              { style: { flexDirection: "row", justifyContent: "space-between" } },
              el(Text, { style: { color, fontSize: 11, fontWeight: "800" } }, label + " \xB7 " + authorName),
              el(Text, { style: { color: C.sub, fontSize: 11 } }, new Date(isMsg || f.type === "call" ? f.timestamp : Date.now()).toLocaleString())
            ),
            el(
              Text,
              { style: { color: C.text, fontSize: 13, marginTop: 2 } },
              isMsg ? String(f.content || "(no text)") : f.type === "call" ? f.missed ? "Missed call" : "Call \xB7 " + Math.round(f.durationSec / 60) + " min" : ":" + f.emoji + ":"
            ),
            isMsg ? el(
              View,
              { style: { flexDirection: "row", marginTop: 6 } },
              el(Pressable, {
                onPress: () => {
                  var _a2;
                  const next = String((_a2 = f.content) != null ? _a2 : "");
                  const ok = editFakeMessage(f.channelId, f.snowflakeId, next + " ");
                  toast(ok ? "Edited (added a space \u2014 full inline editor coming)" : "Not in cache \u2014 open the channel first");
                },
                style: { backgroundColor: C.chip, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 }
              }, el(Text, { style: { color: C.text, fontSize: 12 } }, "Edit (cache)")),
              el(Pressable, {
                onPress: () => {
                  const ok = removeFakeById(f.snowflakeId);
                  toast(ok ? "Removed" : "Remove failed");
                  setFakeTick((x) => x + 1);
                },
                style: { backgroundColor: C.danger, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }
              }, el(Text, { style: { color: "#ffffff", fontSize: 12 } }, "Delete"))
            ) : null
          );
        })
      );
    }
    return el(
      ScrollView,
      { style: { flex: 1, backgroundColor: C.bg } },
      el(
        View,
        { style: { paddingHorizontal: 16, paddingTop: 14 } },
        el(Text, { style: { color: C.text, fontSize: 18, fontWeight: "800" } }, "FakeDM"),
        el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, "Injects into: " + (channelId ? (_i = (_h = (_g = (_f = getChannelStore()) == null ? void 0 : _f.getChannel) == null ? void 0 : _g.call(_f, channelId)) == null ? void 0 : _h.name) != null ? _i : "DM \xB7 " + channelId.slice(-6) : "no channel open \u2014 open a DM first"))
      ),
      el(
        ScrollView,
        { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginTop: 10, paddingHorizontal: 12 } },
        ...TABS.map((t) => el(Pressable, {
          key: t.key,
          onPress: () => setTab(t.key),
          style: { backgroundColor: tab === t.key ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 }
        }, el(Text, { style: { color: tab === t.key ? "#ffffff" : C.text, fontSize: 13, fontWeight: "700" } }, t.label)))
      ),
      body,
      el(View, { style: { height: 30 } })
    );
  };
}
var cleanupFns = [];
async function startNext(api) {
  var _a, _b;
  jsonStorageApi = (_a = api == null ? void 0 : api.jsonStorage) != null ? _a : null;
  try {
    await ((_b = jsonStorageApi == null ? void 0 : jsonStorageApi.get) == null ? void 0 : _b.call(jsonStorageApi));
  } catch (e) {
    hostError("jsonStorage unavailable", e);
  }
  refreshConfigFromStorage();
  if (jsonStorageApi == null ? void 0 : jsonStorageApi.subscribe) {
    const off = jsonStorageApi.subscribe(() => {
      try {
        refreshConfigFromStorage();
      } catch {
      }
    });
    if (typeof off === "function") cleanupFns.push(off);
  }
  scheduleRestore(doRestore);
  toast("FakeDM loaded \u2014 open its settings to inject");
}
async function startClassic() {
  var _a, _b;
  const b = typeof bunny !== "undefined" ? bunny : {};
  const v = typeof vendetta !== "undefined" ? vendetta : null;
  try {
    if ((_a = b.plugin) == null ? void 0 : _a.createStorage) {
      const store = b.plugin.createStorage();
      const promise = store == null ? void 0 : store[Symbol.for("bunny.storage.promise")];
      if (promise && typeof promise.then === "function") await promise.catch(() => {
      });
      storageProxy = store;
      storageKind = "bunny";
    } else if ((_b = v == null ? void 0 : v.plugin) == null ? void 0 : _b.storage) {
      storageProxy = v.plugin.storage;
      storageKind = "vendetta";
    }
  } catch (e) {
    hostError("plugin storage unavailable", e);
  }
  refreshConfigFromStorage();
  scheduleRestore(doRestore);
}
var __instance = {
  jsonStorage: {
    load: true,
    default: { ...DEFAULT_SETTINGS, fakes: [] }
  },
  async start(api) {
    try {
      if (api && typeof api === "object" && (api.cleanup || api.jsonStorage)) {
        if (api.cleanup && typeof api.cleanup === "function") api.cleanup(() => {
        });
        await startNext(api);
      } else {
        await startClassic();
      }
    } catch (e) {
      hostError("start failed", e);
    }
  },
  stop() {
    var _a;
    while (cleanupFns.length) {
      try {
        (_a = cleanupFns.pop()) == null ? void 0 : _a();
      } catch {
      }
    }
    restoredThisSession = false;
    fakesCache = [];
    jsonStorageApi = null;
    storageProxy = null;
    storageKind = "";
  },
  SettingsComponent: null
};
var __builtSettings = null;
function settingsComponentLazy(props) {
  var _a, _b;
  if (!__builtSettings) {
    try {
      __builtSettings = buildSettingsComponent();
    } catch (e) {
      hostError("settings component build failed", e);
    }
  }
  if (!__builtSettings) {
    const React = getReact();
    const RN = getRN();
    const el = React == null ? void 0 : React.createElement;
    if (el && RN) return el((_a = RN.View) != null ? _a : "view", null, el((_b = RN.Text) != null ? _b : "text", null, "FakeDM: UI unavailable on this host"));
    return null;
  }
  return __builtSettings(props);
}
__instance.SettingsComponent = settingsComponentLazy;
__instance.__engine = {
  injectMessage,
  injectCall,
  injectSystemMessage,
  injectReaction,
  injectBatch,
  parseBatchScript,
  editFakeMessage,
  clearFakesInChannel,
  removeFakeById,
  doRestore,
  memberCandidates,
  getFakes: readFakes
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
var index_default = __instance;
; return (module.exports && module.exports.default) || module.exports; })()