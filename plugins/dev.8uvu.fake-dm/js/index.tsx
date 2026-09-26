// FakeDM — mobile port of Epitav 8uvu's Equicord fakeDM plugin
// (C:\Users\Epitaph\Equicord\src\userplugins\fakeDM — read-only reference).
//
// Injects fake local messages, calls, system messages, reactions and embeds
// into any DM or channel through Discord's own FluxDispatcher, persists them
// across restarts, and can batch-inject a whole fake conversation from a
// simple "[14:30] Name: text" script.
//
// Desktop-only pieces (chat-bar button portal, context-menu edit, CSS) have no
// Revenge equivalent — here everything lives in the plugin's settings page,
// organized into tabs. Clearing fakes dispatches MESSAGE_DELETE with the
// mlDeleted marker, which MessageLogger 1.6.2+ understands (no red rows).
//
// Host contract (proven in MessageLogger): lazy host lookups only, dual
// storage generation (jsonStorage on Next / plugin storage on Classic),
// universal start/stop export shape.

// ---- Settings ---------------------------------------------------------------

const DEFAULT_SETTINGS = {
    jitterSeconds: true, // randomize seconds like the desktop plugin's randomSeconds
};

type FakeEmbed = {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    image?: { url: string };
    thumbnail?: { url: string };
    fields?: { name: string; value: string; inline?: boolean }[];
};

type PersistedMessage = {
    type: 'message';
    channelId: string;
    authorId: string;
    content: string;
    attachments?: any[];
    timestamp: string;
    snowflakeId: string;
    replyToId?: string;
    embeds?: FakeEmbed[];
    systemType?: number;
};
type PersistedCall = {
    type: 'call';
    channelId: string;
    callerId: string;
    otherId: string;
    missed: boolean;
    durationSec: number;
    timestamp: string;
    endedTimestamp: string | null;
    snowflakeId: string;
};
type PersistedReaction = {
    type: 'reaction';
    channelId: string;
    messageId: string;
    userId: string;
    emoji: string;
    snowflakeId: string;
};
type PersistedFake = PersistedMessage | PersistedCall | PersistedReaction;

type BatchLine = { time: string; senderName: string; content: string };

// ---- Lazy host accessors (never call these at eval/module time) -------------

declare const revenge: any;
declare const bunny: any;
declare const vendetta: any;

function getReact(): any {
    try { if (typeof revenge !== 'undefined') { const r = revenge.react; if (r) return r.React || r; } } catch {}
    try { if (typeof bunny !== 'undefined') { const b = bunny; const r = b.React || b.common?.React || b.metro?.common?.React; if (r) return r; } } catch {}
    try { if (typeof vendetta !== 'undefined') { const v = vendetta; const r = v.common?.React || v.metro?.common?.React || v.React; if (r) return r; } } catch {}
    return null;
}

function getRN(): any {
    try { if (typeof revenge !== 'undefined') { const rn = revenge.react?.ReactNative; if (rn) return rn; } } catch {}
    try { if (typeof bunny !== 'undefined') { const b = bunny; const rn = b.ReactNative || b.common?.ReactNative || b.metro?.common?.ReactNative; if (rn) return rn; } } catch {}
    try { if (typeof vendetta !== 'undefined') { const v = vendetta; const rn = v.common?.ReactNative || v.metro?.common?.ReactNative; if (rn) return rn; } } catch {}
    return null;
}

function getMetro(): any {
    try { const n = (typeof revenge !== 'undefined' && revenge?.metro) || null; if (n) return n; } catch {}
    try { const b = typeof bunny !== 'undefined' ? bunny : null; if (b?.metro) return b.metro; } catch {}
    try { const v = typeof vendetta !== 'undefined' ? vendetta : null; if (v?.metro) return v.metro; } catch {}
    return null;
}

// A real FluxDispatcher with .dispatch — found through metro on every host.
function getDispatch(): ((ev: any) => void) | null {
    try {
        const f = (typeof revenge !== 'undefined' && revenge?.discord?.flux?.dispatcher) || null;
        if (f && typeof f.dispatch === 'function') return f.dispatch.bind(f);
    } catch {}
    try {
        const metro = getMetro();
        const rd = metro?.findByProps?.('dispatch', 'subscribe');
        if (rd && typeof rd.dispatch === 'function') return rd.dispatch.bind(rd);
        const rd2 = metro?.findByProps?.('dispatch', '_dispatcher');
        if (rd2 && typeof rd2.dispatch === 'function') return rd2.dispatch.bind(rd2);
    } catch {}
    try { const v = typeof vendetta !== 'undefined' ? vendetta : null; const fd = v?.metro?.common?.FluxDispatcher || v?.common?.FluxDispatcher; if (fd?.dispatch) return fd.dispatch.bind(fd); } catch {}
    try { const b = typeof bunny !== 'undefined' ? bunny : null; const fd = b?.metro?.common?.FluxDispatcher || b?.common?.FluxDispatcher; if (fd?.dispatch) return fd.dispatch.bind(fd); } catch {}
    return null;
}

function findStore(name: string, props: string[]): any {
    try {
        const s = (typeof revenge !== 'undefined' && revenge?.discord?.flux?.Stores) || null;
        if (s?.[name]) return s[name];
    } catch {}
    try {
        const metro = getMetro();
        if (metro?.findByStoreName) {
            const m = metro.findByStoreName(name);
            if (m) return m;
        }
        if (metro?.findByProps) {
            const m = metro.findByProps(...props);
            if (m) return m;
        }
    } catch {}
    try { const v = typeof vendetta !== 'undefined' ? vendetta : null; if (v?.metro?.common?.[name]) return v.metro.common[name]; } catch {}
    try { const b = typeof bunny !== 'undefined' ? bunny : null; if (b?.metro?.common?.[name]) return b.metro.common[name]; } catch {}
    return null;
}

function getUserStore(): any {
    return findStore('UserStore', ['getCurrentUser']);
}
function getChannelStore(): any {
    return findStore('ChannelStore', ['getChannel']);
}
function getMessageStore(): any {
    return findStore('MessageStore', ['getMessage', 'getMessages']);
}
function getSelectedChannelStore(): any {
    return findStore('SelectedChannelStore', ['getChannelId', 'getSelectedChannelId']);
}
function getGuildMemberStore(): any {
    return findStore('GuildMemberStore', ['getMembers', 'getMember']);
}

function currentChannelId(): string {
    try {
        const s = getSelectedChannelStore();
        return String(s?.getChannelId?.() ?? s?.getSelectedChannelId?.() ?? '');
    } catch {
        return '';
    }
}

function hostError(msg: string, e?: unknown) {
    try {
        const logger = (typeof revenge !== 'undefined' && revenge?.logger) || (typeof bunny !== 'undefined' && bunny?.plugin?.logger) || (typeof vendetta !== 'undefined' && vendetta?.logger) || console;
        (logger?.error ?? logger?.log ?? (() => {})).call(logger, '[FakeDM] ' + msg, e ?? '');
    } catch {}
}

// ---- Storage (settings + fakes) ----------------------------------------------

let jsonStorageApi: any = null;
let storageProxy: any = null;
let storageKind: '' | 'bunny' | 'vendetta' = '';
let cfg: any = { ...DEFAULT_SETTINGS };
let fakesCache: PersistedFake[] = [];

function readFakes(): PersistedFake[] {
    return Array.isArray(fakesCache) ? fakesCache : [];
}

function persistFakes(list: PersistedFake[]) {
    fakesCache = list;
    try {
        if (jsonStorageApi) {
            void jsonStorageApi.set?.({ fakes: list });
            return;
        }
        if (storageProxy) {
            if (storageKind === 'bunny' && storageProxy.data) {
                storageProxy.data = { ...storageProxy.data, fakes: list };
            } else {
                storageProxy.fakes = list;
            }
        }
    } catch (e) {
        hostError('could not persist fakes', e);
    }
}

function refreshConfigFromStorage() {
    try {
        if (jsonStorageApi) {
            const s = jsonStorageApi.use?.() ?? null;
            if (s && typeof s === 'object') cfg = { ...DEFAULT_SETTINGS, ...s };
            const f = (s as any)?.fakes;
            if (Array.isArray(f)) fakesCache = f;
            return;
        }
        if (storageProxy) {
            const s = storageKind === 'bunny' ? storageProxy?.data?.settings : storageProxy?.settings;
            if (s && typeof s === 'object') cfg = { ...DEFAULT_SETTINGS, ...s };
            const f = storageKind === 'bunny' ? storageProxy?.data?.fakes : storageProxy?.fakes;
            if (Array.isArray(f)) fakesCache = f;
        }
    } catch (e) {
        hostError('could not read settings', e);
    }
}

// ---- Core engine (ported from injection.ts + storage.ts) ---------------------

let _idCounter = 0;
function uniqueSnowflake(date: Date): string {
    try {
        const offset = _idCounter++ % 4096;
        const ms = Math.max(0, date.getTime() - 1420070400000);
        return ((BigInt(ms) << 22n) | BigInt(offset)).toString();
    } catch {
        // BigInt-less Hermes fallback: timestamp + counter is unique enough here.
        return String(date.getTime()) + String(_idCounter++ % 4096).padStart(4, '0');
    }
}

function randomSeconds(date: Date): Date {
    if (!cfg.jitterSeconds) return new Date(Math.floor(date.getTime() / 1000) * 1000);
    const sec = 1 + Math.floor(Math.random() * 59);
    return new Date(date.getTime() + sec * 1000);
}

function avatarUrl(user: any): string {
    if (!user) return '';
    if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;
    try {
        const idx = user.discriminator && user.discriminator !== '0'
            ? parseInt(user.discriminator) % 5
            : Number(BigInt(user.id) >> 22n) % 6;
        return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
        return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
}

function buildAuthor(user: any) {
    return {
        id: String(user.id),
        username: user.username ?? 'unknown',
        discriminator: user.discriminator ?? '0',
        avatar: user.avatar ?? null,
        public_flags: user.publicFlags ?? user.public_flags ?? 0,
        flags: user.flags ?? 0,
        banner: user.banner ?? null,
        accent_color: null,
        global_name: user.globalName ?? user.global_name ?? user.username,
        bot: !!user.bot,
    };
}

function toDiscordEmbed(embed: FakeEmbed): any {
    const d: any = {};
    if (embed.title) d.title = embed.title;
    if (embed.description) d.description = embed.description;
    if (embed.url) d.url = embed.url;
    if (embed.color !== undefined) d.color = embed.color;
    if (embed.image?.url) d.image = { url: embed.image.url, proxy_url: embed.image.url };
    if (embed.thumbnail?.url) d.thumbnail = { url: embed.thumbnail.url, proxy_url: embed.thumbnail.url };
    if (embed.fields?.length) d.fields = embed.fields.map((f) => ({ name: f.name, value: f.value, inline: !!f.inline }));
    return d;
}

let _attachIdCounter = 0;

function injectMessage(
    channelId: string,
    author: any,
    content: string,
    date: Date,
    persistedId?: string,
    attachments?: any[],
    replyTo?: { messageId: string },
    embeds?: FakeEmbed[],
): string | null {
    const dispatch = getDispatch();
    if (!dispatch || !author?.id) return null;
    const actualDate = persistedId ? date : randomSeconds(date);
    const id = persistedId ?? uniqueSnowflake(actualDate);
    const attach = (attachments ?? []).map((a, i) => ({
        id: a.id ?? String(++_attachIdCounter),
        filename: a.filename ?? 'image.png',
        size: a.size ?? 0,
        url: a.url,
        proxy_url: a.proxy_url ?? a.url,
        width: a.width ?? 0,
        height: a.height ?? 0,
        content_type: a.content_type ?? 'image/png',
    }));

    const message: any = {
        attachments: attach, components: [], embeds: [], mention_roles: [], mentions: [],
        author: buildAuthor(author),
        channel_id: channelId,
        content: String(content ?? ''),
        edited_timestamp: null,
        flags: 0,
        id,
        mention_everyone: false,
        nonce: id,
        pinned: false,
        timestamp: actualDate.toISOString(),
        tts: false,
        type: 0,
    };
    if (replyTo?.messageId) {
        message.message_reference = { channel_id: channelId, message_id: replyTo.messageId };
    }
    if (embeds && embeds.length > 0) {
        message.embeds = embeds.map(toDiscordEmbed);
    }

    try {
        dispatch({ type: 'MESSAGE_CREATE', channelId, message, optimistic: false, isPushNotification: false });
    } catch (e) {
        hostError('injectMessage dispatch failed', e);
        return null;
    }
    if (!persistedId) {
        const list = readFakes().slice();
        list.push({
            type: 'message', channelId, authorId: String(author.id), content: String(content ?? ''),
            attachments: attach, timestamp: actualDate.toISOString(), snowflakeId: id,
            replyToId: replyTo?.messageId, embeds,
        });
        persistFakes(list);
    }
    return id;
}

function injectCall(
    channelId: string,
    caller: any,
    other: any,
    missed: boolean,
    durationSec: number,
    date: Date,
    persistedId?: string,
    persistedEndedTs?: string | null,
): string | null {
    const dispatch = getDispatch();
    if (!dispatch || !caller?.id) return null;
    const actualDate = persistedId ? date : randomSeconds(date);
    const id = persistedId ?? uniqueSnowflake(actualDate);
    const participants = missed ? [String(caller.id)] : [String(caller.id), String(other?.id ?? caller.id)];
    const endedDate = missed
        ? actualDate
        : (persistedEndedTs ? new Date(persistedEndedTs) : new Date(actualDate.getTime() + durationSec * 1000));

    try {
        dispatch({
            type: 'MESSAGE_CREATE',
            channelId,
            message: {
                attachments: [], components: [], embeds: [], mention_roles: [], mentions: [],
                author: buildAuthor(caller),
                channel_id: channelId,
                content: '',
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
                    duration: missed ? undefined : durationSec,
                },
            },
            optimistic: false,
            isPushNotification: false,
        });
    } catch (e) {
        hostError('injectCall dispatch failed', e);
        return null;
    }
    if (!persistedId) {
        const list = readFakes().slice();
        list.push({
            type: 'call', channelId, callerId: String(caller.id), otherId: String(other?.id ?? ''),
            missed, durationSec, timestamp: actualDate.toISOString(), endedTimestamp: endedDate.toISOString(), snowflakeId: id,
        });
        persistFakes(list);
    }
    return id;
}

export const SYSTEM_TYPES: { value: number; label: string }[] = [
    { value: 1, label: 'User joined' },
    { value: 2, label: 'User left' },
    { value: 4, label: 'Name change' },
    { value: 5, label: 'Icon change' },
    { value: 6, label: 'Pinned a message' },
    { value: 7, label: 'Joined server' },
];

function injectSystemMessage(
    channelId: string,
    author: any,
    systemType: number,
    content: string,
    date: Date,
): string | null {
    const dispatch = getDispatch();
    if (!dispatch || !author?.id) return null;
    const actualDate = randomSeconds(date);
    const id = uniqueSnowflake(actualDate);
    try {
        dispatch({
            type: 'MESSAGE_CREATE',
            channelId,
            message: {
                attachments: [], components: [], embeds: [], mention_roles: [], mentions: [],
                author: buildAuthor(author),
                channel_id: channelId,
                content: String(content ?? ''),
                edited_timestamp: null,
                flags: 0,
                id,
                mention_everyone: false,
                nonce: id,
                pinned: false,
                timestamp: actualDate.toISOString(),
                tts: false,
                type: systemType,
            },
            optimistic: false,
            isPushNotification: false,
        });
    } catch (e) {
        hostError('injectSystemMessage dispatch failed', e);
        return null;
    }
    const list = readFakes().slice();
    list.push({
        type: 'message', channelId, authorId: String(author.id), content: String(content ?? ''),
        timestamp: actualDate.toISOString(), snowflakeId: id, systemType,
    });
    persistFakes(list);
    return id;
}

function injectReaction(channelId: string, messageId: string, userId: string, emoji: string): boolean {
    const dispatch = getDispatch();
    if (!dispatch || !channelId || !messageId || !emoji) return false;
    try {
        dispatch({
            type: 'MESSAGE_REACTION_ADD',
            channelId,
            messageId,
            userId,
            emoji: { name: emoji, id: null, animated: false },
        });
    } catch (e) {
        hostError('injectReaction dispatch failed', e);
        return false;
    }
    const list = readFakes().slice();
    list.push({ type: 'reaction', channelId, messageId, userId, emoji, snowflakeId: uniqueSnowflake(new Date()) });
    persistFakes(list);
    return true;
}

// Desktop notes: dispatching a PARTIAL message through MESSAGE_UPDATE crashes
// the renderer — always merge into the full cached record.
function editFakeMessage(channelId: string, messageId: string, newContent: string, newTimestamp?: string): boolean {
    const dispatch = getDispatch();
    if (!dispatch) return false;
    const cached = getMessageStore()?.getMessage?.(channelId, messageId);
    if (!cached) {
        hostError('editFakeMessage: message not in cache, cannot edit safely');
        return false;
    }
    const ts = newTimestamp ? new Date(newTimestamp).toISOString() : new Date().toISOString();
    const updated: any = { ...cached, content: newContent, edited_timestamp: ts };
    try {
        dispatch({ type: 'MESSAGE_UPDATE', channelId, message: updated });
    } catch (e) {
        hostError('editFakeMessage dispatch failed', e);
        return false;
    }
    const list = readFakes();
    for (const f of list) {
        if (f.type === 'message' && f.snowflakeId === messageId) {
            f.content = newContent;
            break;
        }
    }
    persistFakes(list);
    return true;
}

// Removes fake messages from a channel. Dispatches MESSAGE_DELETE with the
// mlDeleted marker so MessageLogger (1.6.2+) lets the rows vanish normally.
function clearFakesInChannel(channelId: string, ids?: Set<string>): number {
    const dispatch = getDispatch();
    const list = readFakes();
    const target = ids ?? new Set(list.filter((f) => f.type !== 'reaction' && f.channelId === channelId).map((f) => (f as any).snowflakeId));
    let n = 0;
    for (const f of list) {
        if (f.type === 'reaction') continue;
        if (f.channelId !== channelId || !target.has((f as any).snowflakeId)) continue;
        if (dispatch) {
            try {
                dispatch({ type: 'MESSAGE_DELETE', channelId, id: (f as any).snowflakeId, mlDeleted: true });
            } catch {}
        }
        n++;
    }
    persistFakes(list.filter((f) => !(f.type !== 'reaction' && f.channelId === channelId && target.has((f as any).snowflakeId))));
    return n;
}

function removeFakeById(id: string): boolean {
    const f = readFakes().find((x) => (x as any).snowflakeId === id);
    if (!f || f.type === 'reaction') return false;
    return clearFakesInChannel(f.channelId, new Set([(f as any).snowflakeId])) > 0;
}

// ---- Restore on start (desktop doRestore + CONNECTION_OPEN) -------------------

let restoredThisSession = false;

function messageInCache(channelId: string, messageId: string): boolean {
    try {
        return !!getMessageStore()?.getMessage?.(channelId, messageId);
    } catch {
        return false;
    }
}

function doRestore(): number {
    if (restoredThisSession) return 0;
    restoredThisSession = true;
    const userStore = getUserStore();
    let n = 0;
    for (const f of readFakes()) {
        try {
            if (f.type === 'message') {
                if (messageInCache(f.channelId, f.snowflakeId)) continue;
                const author = userStore?.getUser?.(f.authorId);
                if (!author) continue;
                injectMessage(f.channelId, author, f.content, new Date(f.timestamp), f.snowflakeId, f.attachments, f.replyToId ? { messageId: f.replyToId } : undefined, f.embeds);
                n++;
            } else if (f.type === 'call') {
                if (messageInCache(f.channelId, f.snowflakeId)) continue;
                const caller = userStore?.getUser?.(f.callerId);
                const other = userStore?.getUser?.(f.otherId);
                if (!caller) continue;
                injectCall(f.channelId, caller, other ?? caller, f.missed, f.durationSec, new Date(f.timestamp), f.snowflakeId, f.endedTimestamp);
                n++;
            }
            // Reactions are replayed on the fly — nothing to restore (desktop parity).
        } catch (e) {
            hostError('restore failed for a fake', e);
        }
    }
    return n;
}

function scheduleRestore(onConnectionOpen?: () => void) {
    // Same trick as desktop: re-inject only once Discord is connected, with a
    // timer fallback in case CONNECTION_OPEN fired before we subscribed.
    try {
        const dispatch = getDispatch();
        const rawDispatcher: any = null;
        void rawDispatcher;
        const metro = getMetro();
        const fd = metro?.findByProps?.('dispatch', 'subscribe');
        if (fd && typeof fd.subscribe === 'function' && typeof onConnectionOpen === 'function') {
            const handler = () => {
                try { fd.unsubscribe('CONNECTION_OPEN', handler); } catch {}
                setTimeout(onConnectionOpen, 1200);
            };
            fd.subscribe('CONNECTION_OPEN', handler);
            void dispatch;
        }
    } catch (e) {
        hostError('could not subscribe CONNECTION_OPEN', e);
    }
    setTimeout(() => { try { doRestore(); } catch (e) { hostError('timed restore failed', e); } }, 2000);
}

// ---- Batch injection (desktop injectBatch + parse) ----------------------------

function parseBatchScript(text: string): BatchLine[] {
    const lines: BatchLine[] = [];
    for (const raw of String(text ?? '').split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const m = line.match(/^\[?(\d{1,2}):(\d{2})\]?\s*(?:([^:]+?):)?\s*(.+)$/);
        if (!m) continue;
        lines.push({
            time: String(Math.min(23, parseInt(m[1], 10))).padStart(2, '0') + ':' + m[2],
            senderName: (m[3] ?? '').trim(),
            content: m[4].trim(),
        });
    }
    return lines;
}

function resolveBatchAuthor(name: string, candidates: any[], me: any): any | null {
    if (!name) return me;
    const lower = name.toLowerCase();
    if (lower === 'me') return me;
    for (const u of candidates) {
        const uname = String(u.globalName ?? u.global_name ?? u.username ?? '').toLowerCase();
        if (uname === lower || String(u.username ?? '').toLowerCase() === lower) return u;
    }
    // Manual entry: numeric name treated as a user ID.
    if (/^\d{5,}$/.test(name)) {
        const byId = getUserStore()?.getUser?.(name);
        if (byId) return byId;
    }
    return null;
}

function injectBatch(channelId: string, lines: BatchLine[], candidates: any[], me: any, baseDate: Date): number {
    let n = 0;
    for (const line of lines) {
        const author = resolveBatchAuthor(line.senderName, candidates, me);
        if (!author) continue;
        const [h, m] = line.time.split(':').map(Number);
        const msgDate = new Date(baseDate);
        msgDate.setHours(h, m, 0, 0);
        if (injectMessage(channelId, author, line.content, msgDate)) n++;
    }
    return n;
}

// ---- Member candidates for pickers --------------------------------------------

function memberCandidates(): any[] {
    const out: any[] = [];
    const me = getUserStore()?.getCurrentUser?.();
    if (me) out.push(me);
    try {
        const chId = currentChannelId();
        const ch = getChannelStore()?.getChannel?.(chId);
        const ids: string[] = ch?.recipients ?? ch?.rawRecipients?.map((r: any) => r.id) ?? [];
        for (const id of ids) {
            const u = getUserStore()?.getUser?.(id);
            if (u) out.push(u);
        }
        const guildId = ch?.guild_id ?? ch?.guildId;
        if (guildId) {
            const members = getGuildMemberStore()?.getMembers?.(guildId) ?? [];
            for (const m of members.slice(0, 40)) {
                const u = getUserStore()?.getUser?.(m.userId ?? m?.user?.id);
                if (u && !out.some((x) => String(x.id) === String(u.id))) out.push(u);
            }
        }
    } catch {}
    return out.slice(0, 45);
}

function userLabel(u: any): string {
    if (!u) return 'Unknown';
    return String(u.globalName ?? u.global_name ?? u.username ?? u.id);
}

function memberById(id: string): any {
    if (!id) return null;
    return getUserStore()?.getUser?.(id) ?? { id, username: 'ID ' + id };
}

// ---- Toast --------------------------------------------------------------------

function toast(content: string) {
    try {
        const ui = (typeof revenge !== 'undefined' && revenge?.ui) || null;
        if (ui?.showToast) return void ui.showToast(content, ui.ToastType?.INFO ?? 0);
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        if (b?.api?.toasts?.showToast) {
            return void b.api.toasts.showToast({ content, type: 1 });
        }
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        if (v?.ui?.toasts?.showToast) return void v.ui.toasts.showToast({ content, type: 1 });
    } catch (e) {
        hostError('toast failed', e);
    }
}

// ---- Settings UI ---------------------------------------------------------------

function hexToInt(hex: string): number | undefined {
    const m = String(hex ?? '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(m)) return undefined;
    return parseInt(m, 16);
}

function buildSettingsComponent() {
    const React = getReact();
    const RN = getRN();
    if (!React || !RN) return null;
    const el = React.createElement;
    const { View = 'view', Text = 'text', TextInput = 'input', Pressable = View, ScrollView = View, Switch = null } = RN;

    const isDark = (() => {
        try {
            const tm = findStore('ThemeManager', ['theme', 'resolvedTheme']) ?? getMetro()?.findByProps?.('theme', 'setTheme');
            const t = tm?.theme ?? tm?.resolvedTheme ?? tm?.currentTheme;
            if (t) return String(t).toLowerCase().includes('dark');
        } catch {}
        return true;
    })();
    const C = isDark
        ? { bg: '#111214', card: '#1a1b1e', text: '#ffffff', sub: '#9ba0a8', input: '#232428', chip: '#2b2d31', blurple: '#5865F2', danger: '#f04747', ok: '#23a55a', amber: '#faa61a' }
        : { bg: '#f2f3f5', card: '#ffffff', text: '#060607', sub: '#5c5e66', input: '#ebedef', chip: '#e3e5e8', blurple: '#5865F2', danger: '#d83c3e', ok: '#248046', amber: '#c28516' };

    function Card(props: any) {
        const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
        return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
    }
    function Row(props: any) {
        return el(View, { style: { paddingHorizontal: 14, paddingVertical: 8 } }, props.children);
    }
    function Label(props: any) {
        return el(Text, { style: { color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 4 } }, props.children);
    }
    function Input(props: any) {
        return el(TextInput, {
            placeholderTextColor: C.sub,
            ...props,
            style: [{ backgroundColor: C.input, color: C.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginBottom: 8 }, props.style],
        });
    }
    function Btn(props: any) {
        return el(Pressable, { onPress: props.onPress, style: [{ backgroundColor: props.danger ? C.danger : props.ok ? C.ok : C.blurple, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 2 }, props.style] },
            el(Text, { style: { color: '#ffffff', fontWeight: '700', fontSize: 14 } }, props.label));
    }
    function SwitchRow(props: any) {
        const toggle = Switch
            ? el(Switch, { value: !!props.value, onValueChange: props.onValueChange, trackColor: { false: 'rgba(128,128,128,0.35)', true: C.blurple }, thumbColor: '#ffffff' })
            : el(Text, { style: { color: C.sub }, onPress: () => props.onValueChange(!props.value) }, props.value ? 'On' : 'Off');
        return el(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 } },
            el(Text, { style: { color: C.text, fontSize: 15, flex: 1, paddingRight: 12 } }, props.label),
            toggle);
    }
    function MemberChips(props: any) {
        const kids = props.members.map((u: any) =>
            el(Pressable, {
                key: String(u.id),
                onPress: () => props.value === String(u.id) ? props.onChange('') : props.onChange(String(u.id)),
                style: { backgroundColor: props.value === String(u.id) ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
            }, el(Text, { style: { color: props.value === String(u.id) ? '#ffffff' : C.text, fontSize: 13 } }, userLabel(u))));
        return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 6 } }, ...kids);
    }
    function TypeChips(props: any) {
        const kids = props.options.map((o: any) =>
            el(Pressable, {
                key: String(o.value),
                onPress: () => props.value === o.value ? props.onChange(null) : props.onChange(o.value),
                style: { backgroundColor: props.value === o.value ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
            }, el(Text, { style: { color: props.value === o.value ? '#ffffff' : C.text, fontSize: 13 } }, o.label)));
        return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 6 } }, ...kids);
    }

    const TABS = [
        { key: 'message', label: 'Message' },
        { key: 'call', label: 'Call' },
        { key: 'system', label: 'System' },
        { key: 'react', label: 'React' },
        { key: 'batch', label: 'Batch' },
        { key: 'fakes', label: 'Fakes' },
    ];

    return function FakeDMSettings(props: any) {
        if (jsonStorageApi == null && props?.api?.jsonStorage) {
            jsonStorageApi = props.api.jsonStorage;
        }
        refreshConfigFromStorage();

        const [tab, setTab] = React.useState('message');
        // message tab
        const [senderId, setSenderId] = React.useState('');
        const [content, setContent] = React.useState('');
        const [timeText, setTimeText] = React.useState('');
        const [dateText, setDateText] = React.useState('');
        const [replyId, setReplyId] = React.useState('');
        const [imageUrl, setImageUrl] = React.useState('');
        const [embedOn, setEmbedOn] = React.useState(false);
        const [embedTitle, setEmbedTitle] = React.useState('');
        const [embedDesc, setEmbedDesc] = React.useState('');
        const [embedColor, setEmbedColor] = React.useState('#5865F2');
        const [embedImage, setEmbedImage] = React.useState('');
        // call tab
        const [callerId, setCallerId] = React.useState('');
        const [receiverId, setReceiverId] = React.useState('');
        const [missed, setMissed] = React.useState(false);
        const [durationMin, setDurationMin] = React.useState('2');
        // system tab
        const [sysSenderId, setSysSenderId] = React.useState('');
        const [sysType, setSysType] = React.useState<number | null>(6);
        const [sysContent, setSysContent] = React.useState('');
        // react tab
        const [reactMsgId, setReactMsgId] = React.useState('');
        const [reactEmoji, setReactEmoji] = React.useState('');
        const [reactUserId, setReactUserId] = React.useState('');
        // batch tab
        const [batchText, setBatchText] = React.useState('');
        const [batchSenderId, setBatchSenderId] = React.useState('');
        const [batchTime, setBatchTime] = React.useState('');
        const [batchDate, setBatchDate] = React.useState('');
        // fakes tab
        const [fakeTick, setFakeTick] = React.useState(0);

        const candidates = memberCandidates();
        const me = getUserStore()?.getCurrentUser?.() ?? null;
        const channelId = currentChannelId();

        function parseWhen(timeText: string, dateText: string): Date {
            const d = new Date();
            const dm = String(dateText ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dm) d.setFullYear(parseInt(dm[1], 10), parseInt(dm[2], 10) - 1, parseInt(dm[3], 10));
            const tm = String(timeText ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
            if (tm) d.setHours(Math.min(23, parseInt(tm[1], 10)), parseInt(tm[2], 10), 0, 0);
            return d;
        }

        const sendAs = () => el(View, null,
            el(Label, null, 'Send as'),
            el(MemberChips, { members: candidates, value: senderId, onChange: setSenderId }),
            el(Input, { placeholder: '...or paste a user ID', value: senderId, onChangeText: (t: string) => setSenderId(t.replace(/[^0-9]/g, '')) }));

        const whenInputs = () => el(View, null,
            el(Label, null, 'Time (HH:MM, optional — default now)'),
            el(Input, { placeholder: '14:30', value: timeText, onChangeText: setTimeText }),
            el(Label, null, 'Date (YYYY-MM-DD, optional)'),
            el(Input, { placeholder: '2026-09-26', value: dateText, onChangeText: setDateText }));

        let body: any = null;
        if (tab === 'message') {
            body = el(View, null,
                sendAs(),
                el(Label, null, 'Message'),
                el(Input, { placeholder: 'Message text…', value: content, onChangeText: setContent, multiline: true, style: { minHeight: 60, textAlignVertical: 'top' } }),
                whenInputs(),
                el(Label, null, 'Reply to message ID (optional)'),
                el(Input, { placeholder: 'Message ID', value: replyId, onChangeText: (t: string) => setReplyId(t.replace(/[^0-9]/g, '')) }),
                el(Label, null, 'Image URL (optional attachment)'),
                el(Input, { placeholder: 'https://…/image.png', value: imageUrl, onChangeText: setImageUrl }),
                el(SwitchRow, { label: 'Attach an embed', value: embedOn, onValueChange: setEmbedOn }),
                embedOn ? el(View, null,
                    el(Input, { placeholder: 'Embed title', value: embedTitle, onChangeText: setEmbedTitle }),
                    el(Input, { placeholder: 'Embed description', value: embedDesc, onChangeText: setEmbedDesc, multiline: true }),
                    el(Input, { placeholder: '#5865F2', value: embedColor, onChangeText: setEmbedColor }),
                    el(Input, { placeholder: 'Embed image URL', value: embedImage, onChangeText: setEmbedImage }),
                ) : null,
                el(Btn, {
                    label: 'Inject message', onPress: () => {
                        const author = memberById(senderId || (candidates[0]?.id ?? ''));
                        if (!author) return toast('Pick who sends it first');
                        const embeds: FakeEmbed[] | undefined = embedOn ? [{ title: embedTitle || undefined, description: embedDesc || undefined, color: hexToInt(embedColor), image: embedImage ? { url: embedImage } : undefined }] : undefined;
                        const attachments = imageUrl ? [{ url: imageUrl, filename: imageUrl.split('/').pop() || 'image.png' }] : undefined;
                        const id = injectMessage(channelId, author, content, parseWhen(timeText, dateText), undefined, attachments, replyId ? { messageId: replyId } : undefined, embeds);
                        toast(id ? 'Fake message injected' : 'Inject failed (no dispatcher?)');
                        setFakeTick((n: number) => n + 1);
                    },
                }));
        } else if (tab === 'call') {
            body = el(View, null,
                el(Label, null, 'Caller'),
                el(MemberChips, { members: candidates, value: callerId, onChange: setCallerId }),
                el(Label, null, 'Receiver'),
                el(MemberChips, { members: candidates, value: receiverId, onChange: setReceiverId }),
                el(SwitchRow, { label: 'Missed call', value: missed, onValueChange: setMissed }),
                el(Label, null, 'Duration (minutes, ignored when missed)'),
                el(Input, { placeholder: '2', value: durationMin, onChangeText: (t: string) => setDurationMin(t.replace(/[^0-9]/g, '')) }),
                whenInputs(),
                el(Btn, {
                    label: 'Inject call', onPress: () => {
                        const caller = memberById(callerId || (candidates[0]?.id ?? ''));
                        if (!caller) return toast('Pick a caller first');
                        const other = memberById(receiverId || (candidates.find((u: any) => String(u.id) !== String(caller.id))?.id ?? caller.id));
                        const sec = Math.max(0, parseInt(durationMin || '0', 10) || 0) * 60;
                        const id = injectCall(channelId, caller, other, missed, sec, parseWhen(timeText, dateText));
                        toast(id ? 'Fake call injected' : 'Inject failed');
                        setFakeTick((n: number) => n + 1);
                    },
                }));
        } else if (tab === 'system') {
            body = el(View, null,
                el(Label, null, 'Actor (who did it)'),
                el(MemberChips, { members: candidates, value: sysSenderId, onChange: setSysSenderId }),
                el(Label, null, 'Type'),
                el(TypeChips, { options: SYSTEM_TYPES, value: sysType, onChange: setSysType }),
                el(Label, null, 'Custom text (optional)'),
                el(Input, { placeholder: 'Usually empty', value: sysContent, onChangeText: setSysContent, multiline: true }),
                whenInputs(),
                el(Btn, {
                    label: 'Inject system message', onPress: () => {
                        const author = memberById(sysSenderId || (candidates[0]?.id ?? ''));
                        if (!author) return toast('Pick an actor first');
                        const id = injectSystemMessage(channelId, author, sysType ?? 6, sysContent, parseWhen(timeText, dateText));
                        toast(id ? 'System message injected' : 'Inject failed');
                        setFakeTick((n: number) => n + 1);
                    },
                }));
        } else if (tab === 'react') {
            body = el(View, null,
                el(Label, null, 'Message ID'),
                el(Input, { placeholder: 'Paste message ID', value: reactMsgId, onChangeText: (t: string) => setReactMsgId(t.replace(/[^0-9]/g, '')) }),
                el(Label, null, 'Emoji'),
                el(Input, { placeholder: '😀', value: reactEmoji, onChangeText: setReactEmoji }),
                el(Label, null, 'React as'),
                el(MemberChips, { members: candidates, value: reactUserId, onChange: setReactUserId }),
                el(Btn, {
                    label: 'Inject reaction', onPress: () => {
                        const uid = reactUserId || String(me?.id ?? '');
                        if (!reactMsgId || !reactEmoji) return toast('Need a message ID and an emoji');
                        const ok = injectReaction(channelId, reactMsgId, uid, reactEmoji);
                        toast(ok ? 'Reaction added' : 'Inject failed');
                        setFakeTick((n: number) => n + 1);
                    },
                }));
        } else if (tab === 'batch') {
            const parsed = parseBatchScript(batchText);
            body = el(View, null,
                el(Label, null, 'Default sender (lines without a name)'),
                el(MemberChips, { members: candidates, value: batchSenderId, onChange: setBatchSenderId }),
                el(Label, null, 'Script — one message per line, [HH:MM] optional name'),
                el(Input, {
                    placeholder: '[14:30] Me: hey\n[14:31] ' + userLabel(candidates[1] ?? me) + ': sup\n[14:32] Me: check this out',
                    value: batchText, onChangeText: setBatchText, multiline: true, style: { minHeight: 100, textAlignVertical: 'top' },
                }),
                el(Text, { style: { color: C.sub, fontSize: 12, marginBottom: 6 } }, parsed.length + ' message(s) parsed'),
                el(Label, null, 'Base date (YYYY-MM-DD, optional — times come from the script)'),
                el(Input, { placeholder: '2026-09-26', value: batchDate, onChangeText: setBatchDate }),
                el(Btn, {
                    label: 'Inject ' + parsed.length + ' messages', onPress: () => {
                        if (!parsed.length) return toast('Nothing parsed — check the format');
                        const base = parseWhen(batchTime, batchDate);
                        const n = injectBatch(channelId, parsed, candidates, memberById(batchSenderId || (me?.id ?? '')), base);
                        toast(n + ' fake message(s) injected' + (n < parsed.length ? ' — some names unknown' : ''));
                        setFakeTick((nn: number) => nn + 1);
                    },
                }));
        } else {
            // Fakes tab
            void fakeTick;
            const all = readFakes();
            const inChannel = all.filter((f) => f.type !== 'reaction' && f.channelId === channelId);
            const shown = inChannel.length ? inChannel : all;
            body = el(View, null,
                el(Text, { style: { color: C.sub, fontSize: 12, paddingHorizontal: 14, paddingTop: 6 } },
                    inChannel.length ? 'Fakes in this channel: ' + inChannel.length : 'No fakes in this channel — showing all ' + all.length),
                el(Btn, {
                    label: 'Clear all fakes in this channel', danger: true, onPress: () => {
                        const n = clearFakesInChannel(channelId);
                        toast(n + ' fake(s) cleared');
                        setFakeTick((x: number) => x + 1);
                    },
                }),
                ...shown.slice().reverse().slice(0, 60).map((f, i) => {
                    const isMsg = f.type === 'message';
                    const label = isMsg
                        ? ((f as PersistedMessage).systemType ? 'SYSTEM' : 'MESSAGE')
                        : f.type === 'call' ? 'CALL' : 'REACT';
                    const color = isMsg ? C.blurple : f.type === 'call' ? C.ok : C.amber;
                    const authorName = userLabel(memberById(isMsg ? (f as PersistedMessage).authorId : f.type === 'call' ? (f as PersistedCall).callerId : (f as PersistedReaction).userId));
                    return el(View, { key: String(f.snowflakeId) + ':' + i, style: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.input } },
                        el(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
                            el(Text, { style: { color, fontSize: 11, fontWeight: '800' } }, label + ' · ' + authorName),
                            el(Text, { style: { color: C.sub, fontSize: 11 } }, new Date(isMsg || f.type === 'call' ? (f as any).timestamp : Date.now()).toLocaleString())),
                        el(Text, { style: { color: C.text, fontSize: 13, marginTop: 2 } },
                            isMsg ? String((f as PersistedMessage).content || '(no text)') : f.type === 'call' ? ((f as PersistedCall).missed ? 'Missed call' : 'Call · ' + Math.round((f as PersistedCall).durationSec / 60) + ' min') : ':' + (f as PersistedReaction).emoji + ':'),
                        isMsg ? el(View, { style: { flexDirection: 'row', marginTop: 6 } },
                            el(Pressable, {
                                onPress: () => {
                                    const next = String((f as PersistedMessage).content ?? '');
                                    const ok = editFakeMessage(f.channelId, f.snowflakeId, next + ' ');
                                    toast(ok ? 'Edited (added a space — full inline editor coming)' : 'Not in cache — open the channel first');
                                },
                                style: { backgroundColor: C.chip, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
                            }, el(Text, { style: { color: C.text, fontSize: 12 } }, 'Edit (cache)')),
                            el(Pressable, {
                                onPress: () => {
                                    const ok = removeFakeById(f.snowflakeId);
                                    toast(ok ? 'Removed' : 'Remove failed');
                                    setFakeTick((x: number) => x + 1);
                                },
                                style: { backgroundColor: C.danger, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
                            }, el(Text, { style: { color: '#ffffff', fontSize: 12 } }, 'Delete')),
                        ) : null,
                    );
                }));
        }

        return el(ScrollView, { style: { flex: 1, backgroundColor: C.bg } },
            el(View, { style: { paddingHorizontal: 16, paddingTop: 14 } },
                el(Text, { style: { color: C.text, fontSize: 18, fontWeight: '800' } }, 'FakeDM'),
                el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, 'Injects into: ' + (channelId ? (getChannelStore()?.getChannel?.(channelId)?.name ?? 'DM · ' + channelId.slice(-6)) : 'no channel open — open a DM first'))),
            el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginTop: 10, paddingHorizontal: 12 } },
                ...TABS.map((t) => el(Pressable, {
                    key: t.key,
                    onPress: () => setTab(t.key),
                    style: { backgroundColor: tab === t.key ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
                }, el(Text, { style: { color: tab === t.key ? '#ffffff' : C.text, fontSize: 13, fontWeight: '700' } }, t.label)))),
            body,
            el(View, { style: { height: 30 } }),
        );
    };
}

// ---- Start / stop ---------------------------------------------------------------

let cleanupFns: (() => void)[] = [];

async function startNext(api: any) {
    jsonStorageApi = api?.jsonStorage ?? null;
    try {
        await jsonStorageApi?.get?.();
    } catch (e) {
        hostError('jsonStorage unavailable', e);
    }
    refreshConfigFromStorage();
    if (jsonStorageApi?.subscribe) {
        const off = jsonStorageApi.subscribe(() => { try { refreshConfigFromStorage(); } catch {} });
        if (typeof off === 'function') cleanupFns.push(off);
    }
    scheduleRestore(doRestore);
    toast('FakeDM loaded — open its settings to inject');
}

async function startClassic() {
    const b: any = typeof bunny !== 'undefined' ? bunny : {};
    const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
    try {
        if (b.plugin?.createStorage) {
            const store = b.plugin.createStorage();
            const promise = store?.[Symbol.for('bunny.storage.promise')];
            if (promise && typeof promise.then === 'function') await promise.catch(() => {});
            storageProxy = store;
            storageKind = 'bunny';
        } else if (v?.plugin?.storage) {
            storageProxy = v.plugin.storage;
            storageKind = 'vendetta';
        }
    } catch (e) {
        hostError('plugin storage unavailable', e);
    }
    refreshConfigFromStorage();
    scheduleRestore(doRestore);
}

let __instance: any = {
    jsonStorage: {
        load: true,
        default: { ...DEFAULT_SETTINGS, fakes: [] },
    },
    async start(api: any) {
        try {
            if (api && typeof api === 'object' && (api.cleanup || api.jsonStorage)) {
                if (api.cleanup && typeof api.cleanup === 'function') api.cleanup(() => {});
                await startNext(api);
            } else {
                await startClassic();
            }
        } catch (e) {
            hostError('start failed', e);
        }
    },
    stop() {
        while (cleanupFns.length) {
            try { cleanupFns.pop()?.(); } catch {}
        }
        restoredThisSession = false;
        fakesCache = [];
        jsonStorageApi = null;
        storageProxy = null;
        storageKind = '';
    },
    SettingsComponent: null as any,
};

// SettingsComponent must resolve the host LAZILY — building it at eval time
// touches revenge.* and risks the eval-time-crash class of bugs.
let __builtSettings: any = null;
function settingsComponentLazy(props: any) {
    if (!__builtSettings) {
        try {
            __builtSettings = buildSettingsComponent();
        } catch (e) {
            hostError('settings component build failed', e);
        }
    }
    if (!__builtSettings) {
        const React = getReact();
        const RN = getRN();
        const el = React?.createElement;
        if (el && RN) return el(RN.View ?? 'view', null, el(RN.Text ?? 'text', null, 'FakeDM: UI unavailable on this host'));
        return null;
    }
    return __builtSettings(props);
}
__instance.SettingsComponent = settingsComponentLazy;

// Engine handle: used by the verifier to drive the real code paths, and
// handy for power users debugging from logs. Not part of the UI.
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
    getFakes: readFakes,
};

if (typeof plugin === 'function') {
    __instance = plugin(__instance);
}
globalThis.plugin = __instance;

__instance.onLoad = function () {
    return __instance.start?.();
};
__instance.onUnload = function () {
    return __instance.stop?.();
};
__instance.settings = __instance.SettingsComponent;

export default __instance;
