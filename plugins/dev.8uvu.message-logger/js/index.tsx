// MessageLogger for Revenge, by 8uvu.
// Saves deleted + edited messages to a persistent on-device file,
// flags ghost pings, and ships a searchable log viewer with export.
//
// NOTE (honest limit, same as desktop loggers): only messages that arrive
// while the app is running can be cached. Anything sent, edited or deleted
// while Discord was fully closed was never seen and cannot be recovered.
//
// HOST-COMPAT RULES (learned the hard way):
// - UNIVERSAL BUILD, works on BOTH hosts:
//   * Revenge Next wraps the script as `return <script>` inside
//     new Function('revenge','plugin',...) and uses <result>.default.
//   * Revenge Classic wraps it as `(bunny,definePlugin)=>{<script>;
//     return plugin?.default ?? plugin}` — so the script must ASSIGN a
//     `plugin` variable (globalThis.plugin). The build wrapper does this.
//   => ZERO `revenge.*` property access at eval time on either host.
// - `start()` receives no arguments on Classic (api comes from the `bunny`
//   global) and the API object on Next, so it adapts to whichever is present.
// - No JSX: the jsx-runtime lives at different paths on different builds.
//   React.createElement works everywhere.

// Ambient globals provided by the Revenge host at eval time.
declare const revenge: any;
declare const bunny: any;
declare const vendetta: any;
declare const plugin: any;

// Which host loaded us: Next passes the API into start(); Classic exposes
// the `bunny` global. Set once start() runs.
let hostKind: 'next' | 'classic' = 'next';

// Start diagnostics: surfaced in the settings Status panel so a silent
// loader failure is distinguishable from a broken flux/store hookup.
let startedAt: number | null = null;
let lastStartError: string | null = null;
let handlersRegistered = 0;
const PLUGIN_VERSION = '1.6.1';

// In-chat highlighting state (Vencord-style). deletedMessageMap holds the ids
// Discord was told to keep visible via the MESSAGE_EDIT_FAILED_AUTOMOD
// rewrite; manualDeletes are ids the user deleted themselves (never kept).
const deletedMessageMap = new Map<string, { channelId: string; timestamp: number }>();
const editedMessageMap = new Map<string, { channelId: string; timestamp: number }>();
const manualDeletes = new Set<string>();
const HIGHLIGHT_MAX = 500;

interface Settings {
    enabled: boolean;
    logDeletes: boolean;
    logEdits: boolean;
    restoreDeletedInChat: boolean;
    keepSelfDeletes: boolean;
    deletedInfo: boolean;
    inlineEdits: boolean;
    ghostPings: boolean;
    colorHighlights: boolean;
    ignoreBots: boolean;
    ignoreWebhooks: boolean;
    ignoreSelf: boolean;
    ignoreSelfEdits: boolean;
    saveImages: boolean;
    imageQuotaGB: number;
    attachmentSizeLimitMB: number;
    attachmentExtensions: string;
    timeBasedCleanupMinutes: number;
    maxStored: number;
    ignoredChannels: string;
    ignoredUsers: string;
    ignoredGuilds: string;
    whitelistedIds: string;
}

interface LoggedMessage {
    id: string;
    channelId: string;
    authorId: string;
    authorTag: string;
    content: string;
    attachments: string[];
    timestamp: number;
    status: 'deleted' | 'edited';
    edits: string[];
    mentionsMe: boolean;
    ghostPing: boolean;
    savedImages?: number;
    bot?: boolean;
}

const LOG_FILE = 'message-logger.json';

const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    logDeletes: true,
    logEdits: true,
    restoreDeletedInChat: true,
    keepSelfDeletes: true,
    deletedInfo: true,
    inlineEdits: true,
    ghostPings: true,
    colorHighlights: true,
    ignoreBots: true,
    ignoreWebhooks: false,
    ignoreSelf: false,
    ignoreSelfEdits: false,
    saveImages: true,
    imageQuotaGB: 2,
    attachmentSizeLimitMB: 100,
    attachmentExtensions: 'png,jpg,jpeg,gif,webp',
    timeBasedCleanupMinutes: 0,
    maxStored: 300,
    ignoredChannels: '',
    ignoredUsers: '',
    ignoredGuilds: '',
    whitelistedIds: '',
};

// ---- Lazy host accessors (never call these at eval/module time) ----------

function getReact(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const r: any = revenge.react;
            if (r) return r.React || r;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            const r = b.React || b.common?.React || b.metro?.common?.React || b.api?.react?.React;
            if (r) return r;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            // The vendetta compat object nests Discord's modules under
            // vendetta.metro.common (NOT vendetta.common).
            const r = v.common?.React || v.metro?.common?.React || v.React;
            if (r) return r;
        }
    } catch {}
    return null;
}

function getRN(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const rn: any = revenge.react?.ReactNative;
            if (rn) return rn;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            const rn = b.ReactNative || b.common?.ReactNative || b.metro?.common?.ReactNative || b.api?.react?.ReactNative;
            if (rn) return rn;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            const rn = v.common?.ReactNative || v.metro?.common?.ReactNative;
            if (rn) return rn;
        }
    } catch {}
    return null;
}

function getFlux(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const f: any = revenge.discord?.flux;
            if (f && typeof f.onFluxEventDispatched === 'function') return f;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const f: any = bunny.api?.flux;
            if (f && typeof f.intercept === 'function') {
                // Adapt Classic's intercept (all events; nullish = pass,
                // falsy = block, object = modify) to the Next-style
                // onFluxEventDispatched(type, patch) signature.
                return {
                    onFluxEventDispatched: (type: string, patch: (payload: any) => any) =>
                        f.intercept((payload: any) => {
                            if (payload?.type !== type) return;
                            return patch(payload);
                        }),
                };
            }
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            // Compat object: vendetta.metro.common.FluxDispatcher.
            const fd: any = v?.common?.FluxDispatcher ?? v?.metro?.common?.FluxDispatcher;
            if (fd && typeof fd.addInterceptor === 'function') {
                // Same adapter shape: the dispatcher's interceptors receive
                // every dispatch; returning false blocks, undefined passes.
                return {
                    onFluxEventDispatched: (type: string, patch: (payload: any) => any) =>
                        fd.addInterceptor((payload: any) => {
                            if (payload?.type !== type) return;
                            return patch(payload);
                        }),
                };
            }
        }
    } catch {}
    return null;
}

// Raw dispatch-channel for the rewrite engine. Each host exposes the
// pre-dispatch mutation point differently, so this returns a normalized
// { addInterceptor } adapter:
//   - Next:     revenge.discord.flux.onAnyFluxEventDispatched (falsy blocks,
//               returned object replaces/merges into the payload)
//   - Classic:  bunny.api.flux.intercept (nullish pass, falsy block, object merge)
//   - vendetta: metro.common.FluxDispatcher.addInterceptor (+ .dispatch)
function getRawFluxDispatcher(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const f: any = (revenge as any)?.discord?.flux;
            if (f && typeof f.onAnyFluxEventDispatched === 'function') {
                return { addInterceptor: (cb: any) => f.onAnyFluxEventDispatched(cb) };
            }
            if (f?.dispatcher && typeof f.dispatcher.addInterceptor === 'function') {
                return f.dispatcher;
            }
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        if (b?.api?.flux && typeof b.api.flux.intercept === 'function') {
            return { addInterceptor: (cb: any) => b.api.flux.intercept(cb) };
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        const fdB = b?.metro?.common?.FluxDispatcher;
        if (fdB && typeof fdB.addInterceptor === 'function') return fdB;
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const fdV = v?.metro?.common?.FluxDispatcher || v?.common?.FluxDispatcher;
        if (fdV && typeof fdV.addInterceptor === 'function') return fdV;
    } catch {}
    return null;
}

// Metro finders, needed to locate the native chat row manager / channel
// message caches. Tries the revenge API first, then bunny/vendetta.
function getMetro(): any {
    try {
        const n: any = (typeof revenge !== 'undefined' && (revenge as any)?.metro) || null;
        if (n) return n;
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        if (b?.metro) return b.metro;
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        if (v?.metro) return v.metro;
    } catch {}
    return null;
}

function getActions(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const a: any = revenge.discord?.actions;
            if (a) return a;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            // bunny has no common; ToastActionCreators lives in metro.common.toasts.
            const a = b.metro?.common?.toasts || b.api?.actions?.ToastActionCreators;
            if (a) return a;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            const show = v?.ui?.toasts?.showToast ?? v?.metro?.common?.toasts?.open;
            if (typeof show === 'function') {
                return { ToastActionCreators: { open: (t: any) => show(String(t?.content ?? '')) } };
            }
        }
    } catch {}
    return null;
}

function getFileModule(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const fm: any = revenge.discord?.native?.FileModule;
            if (fm) return fm;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            return b.api?.native?.FileModule || b.native?.FileModule || null;
        }
    } catch {}
    return null;
}

function getDesign(): any {
    // Classic has no design registry; its components come via bunny.ui
    // (availability varies). Fall back to plain rows when absent.
    try {
        const d: any = (revenge as any)?.discord?.design;
        const design = d && (d.Design || d);
        if (design) return design;
    } catch {}
    try {
        const ui = (bunny as any)?.ui;
        if (ui) return ui.FormTableRowGroup ? ui : ui.components || ui;
    } catch {}
    return null;
}

function getClipboard(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const c: any = (revenge as any)?.externals?.ReactNativeClipboard?.Clipboard;
            if (c) return c;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            // bunny has no common; the clipboard module lives in metro.common.
            const c: any = (bunny as any)?.metro?.common?.clipboard;
            if (c) return c;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            const c = v?.metro?.common?.clipboard ?? v?.common?.clipboard;
            if (c) return c;
        }
    } catch {}
    return null;
}

// ---- State ---------------------------------------------------------------

let log: Record<string, LoggedMessage> = {};
let docRoot = '';
let flushTimer: any = null;
let apiRef: any = null;

// Config cache. jsonStorage.get() is async, but flux handlers are sync, so we
// keep a plain snapshot that is refreshed from storage on every update.
let cfg: Settings = { ...DEFAULT_SETTINGS };
let cfgStorage: any = null;

function logPath(): string {
    return (docRoot.length ? docRoot.replace(/\/+$/, '') + '/' : '') + LOG_FILE;
}

function coerceSettings(raw: any): Settings {
    const c = raw && typeof raw === 'object' ? raw : {};
    return {
        enabled: c.enabled !== false,
        logDeletes: c.logDeletes !== false,
        logEdits: c.logEdits !== false,
        restoreDeletedInChat: c.restoreDeletedInChat !== false,
        keepSelfDeletes: c.keepSelfDeletes !== false,
        deletedInfo: c.deletedInfo !== false,
        ghostPings: c.ghostPings !== false,
        colorHighlights: c.colorHighlights !== false,
        inlineEdits: c.inlineEdits !== false,
        saveImages: c.saveImages !== false,
        imageQuotaGB:
            typeof c.imageQuotaGB === 'number' && c.imageQuotaGB >= 0.1 && c.imageQuotaGB <= 100
                ? c.imageQuotaGB
                : DEFAULT_SETTINGS.imageQuotaGB,
        attachmentSizeLimitMB:
            typeof c.attachmentSizeLimitMB === 'number' && c.attachmentSizeLimitMB >= 1 && c.attachmentSizeLimitMB <= 1024
                ? c.attachmentSizeLimitMB
                : DEFAULT_SETTINGS.attachmentSizeLimitMB,
        attachmentExtensions: typeof c.attachmentExtensions === 'string' ? c.attachmentExtensions : DEFAULT_SETTINGS.attachmentExtensions,
        timeBasedCleanupMinutes:
            typeof c.timeBasedCleanupMinutes === 'number' && c.timeBasedCleanupMinutes >= 0 && c.timeBasedCleanupMinutes <= 525600
                ? Math.floor(c.timeBasedCleanupMinutes)
                : 0,
        ignoreBots: c.ignoreBots !== false,
        ignoreWebhooks: !!c.ignoreWebhooks,
        ignoreSelf: !!c.ignoreSelf,
        ignoreSelfEdits: !!c.ignoreSelfEdits,
        maxStored:
            typeof c.maxStored === 'number' && c.maxStored >= 10 && c.maxStored <= 10000
                ? Math.floor(c.maxStored)
                : DEFAULT_SETTINGS.maxStored,
        ignoredChannels: typeof c.ignoredChannels === 'string' ? c.ignoredChannels : '',
        ignoredUsers: typeof c.ignoredUsers === 'string' ? c.ignoredUsers : '',
        ignoredGuilds: typeof c.ignoredGuilds === 'string' ? c.ignoredGuilds : '',
        whitelistedIds: typeof c.whitelistedIds === 'string' ? c.whitelistedIds : '',
    };
}

function refreshConfigFromStorage() {
    try {
        if (cfgStorage && cfgStorage.cache && typeof cfgStorage.cache === 'object') {
            cfg = coerceSettings(cfgStorage.cache);
        }
    } catch {
        /* keep previous cfg */
    }
}

function hostLog(msg: string) {
    try {
        apiRef?.logger?.log?.('[MessageLogger] ' + msg);
    } catch {}
}

function hostError(msg: string, e?: unknown) {
    lastStartError = msg + (e ? ' — ' + (e instanceof Error ? e.message : String(e)) : '');
    try {
        apiRef?.logger?.error?.(
            '[MessageLogger] ' + msg,
            e instanceof Error ? e.message : e,
        );
    } catch {}
}

// ---- Persistence ----------------------------------------------------------

// Classic-mode state: bunny/vendetta plugin storage (auto-persisted proxies).
let storageProxy: any = null;
let storageKind: 'bunny' | 'vendetta' | null = null;
const classicDisposers: Array<() => void> = [];

function hostData(): any {
    try {
        if (!storageProxy) return null;
        if (storageKind === 'bunny') {
            return storageProxy.data && typeof storageProxy.data === 'object' ? storageProxy.data : {};
        }
        if (storageKind === 'vendetta') {
            return { settings: storageProxy.settings, log: storageProxy.log };
        }
    } catch {}
    return null;
}

function refreshClassicConfig() {
    try {
        const data = hostData();
        if (data?.settings && typeof data.settings === 'object') cfg = coerceSettings(data.settings);
    } catch {}
}

async function loadLog() {
    if (hostKind !== 'next') {
        try {
            const data = hostData();
            if (data?.settings && typeof data.settings === 'object') {
                cfg = coerceSettings(data.settings);
            }
            if (data?.log && typeof data.log === 'object') log = data.log;
            hostLog('loaded ' + Object.keys(log).length + ' entries (plugin storage)');
            restoreHighlightsFromLog();
        } catch (e) {
            hostError('failed to read plugin storage', e);
        }
        return;
    }
    const fm = getFileModule();
    if (!fm) {
        hostError('FileModule unavailable — log cannot be loaded or saved');
        return;
    }
    try {
        docRoot = String(fm.getConstants().DocumentsDirPath ?? '');
    } catch {
        docRoot = '';
    }
    try {
        const raw = await fm.readFile(logPath(), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') log = parsed;
        hostLog('loaded ' + Object.keys(log).length + ' entries');
        restoreHighlightsFromLog();
    } catch {
        log = {};
        hostLog('starting with an empty log');
    }
}

async function persistLog() {
    if (hostKind !== 'next') {
        try {
            if (storageProxy && typeof storageProxy === 'object') {
                if (storageKind === 'bunny') {
                    const data = storageProxy.data && typeof storageProxy.data === 'object' ? storageProxy.data : {};
                    // Assigning the proxy property triggers the host's observer,
                    // which writes the whole storage back to disk.
                    storageProxy.data = { ...data, log };
                } else {
                    storageProxy.log = { ...log };
                }
            }
        } catch (e) {
            hostError('failed to write plugin storage', e);
        }
        return;
    }
    const fm = getFileModule();
    if (!fm) return;
    try {
        await fm.writeFile('documents', LOG_FILE, JSON.stringify(log), 'utf8');
    } catch (e) {
        hostError('failed to write log file', e);
    }
}

function prune(max: number) {
    const ids = Object.keys(log);
    if (ids.length <= max) return;
    ids
        .map((id) => log[id])
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, ids.length - max)
        .forEach((m) => {
            delete log[m.id];
        });
}

// ---- Helpers --------------------------------------------------------------

function inList(id: string, raw: string) {
    if (!raw) return false;
    return raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .includes(String(id));
}

function getUserStore(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const s: any = revenge.discord?.flux?.Stores;
            if (s?.UserStore) return s.UserStore;
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        const metro = b?.metro;
        for (const c of [b?.common?.UserStore, b?.api?.flux?.stores?.UserStore, metro?.common?.UserStore]) {
            if (c) return c;
        }
        if (metro?.findByStoreName) {
            const m = metro.findByStoreName('UserStore');
            if (m?.getCurrentUser) return m;
        }
        if (metro?.findByProps) {
            const m = metro.findByProps('getCurrentUser');
            if (m?.getCurrentUser) return m;
        }
        if (metro?.find) {
            const m = metro.find((x: any) => x && typeof x.getCurrentUser === 'function');
            if (m) return m;
        }
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const metro = v?.metro;
        if (metro?.findByStoreName) {
            const m = metro.findByStoreName('UserStore');
            if (m?.getCurrentUser) return m;
        }
        if (metro?.findByProps) {
            const m = metro.findByProps('getCurrentUser');
            if (m?.getCurrentUser) return m;
        }
    } catch {}
    return null;
}

function currentUserId(): string {
    try {
        return String(getUserStore()?.getCurrentUser?.().id ?? '');
    } catch {
        return '';
    }
}

function mentionsOf(message: any): string[] {
    const out: string[] = [];
    const raw = message?.mentions;
    if (Array.isArray(raw)) {
        for (const m of raw) {
            if (typeof m === 'string') out.push(m);
            else if (m && typeof m.id !== 'undefined') out.push(String(m.id));
        }
    }
    return out;
}

function snapshotOf(message: any, me: string) {
    const author = message?.author ?? {};
    return {
        id: String(message?.id ?? ''),
        channelId: String(message?.channelId ?? message?.channel_id ?? ''),
        guildId: String(message?.guildId ?? message?.guild_id ?? message?.messageSnapshots?.[0]?.message?.guildId ?? ''),
        webhook: !!author?.webhook || message?.webhookId != null,
        authorId: String(author.id ?? ''),
        authorTag: author.globalName || author.username || 'Unknown',
        bot: !!author.bot,
        content: String(message?.content ?? ''),
        editHistory: [] as string[],
        attachments: Array.isArray(message?.attachments)
            ? message.attachments
                  .map((a: any) => String(a?.url ?? a?.proxy_url ?? ''))
                  .filter(Boolean)
                  .slice(0, 10)
            : [],
        timestamp: Date.parse(message?.timestamp) || Date.now(),
        mentionsMe: me !== '' && mentionsOf(message).includes(me),
    };
}

const seen = new Map<string, ReturnType<typeof snapshotOf>>();

// Messages we skipped at create/update time (ignored bots/webhooks/self).
// Their later MESSAGE_DELETE must be ignored too — the delete payload carries
// no author info, so without this the fallback snapshot would log them.
const skippedIds = new Set<string>();
function rememberSkipped(id: string) {
    if (!id) return;
    skippedIds.add(id);
    if (skippedIds.size > 500) {
        const first = skippedIds.values().next();
        if (!first.done) skippedIds.delete(first.value);
    }
}
function takeSkipped(id: string): boolean {
    if (!skippedIds.has(id)) return false;
    skippedIds.delete(id);
    return true;
}

// Shared per-message gate (Equicord parity): whitelist overrides every other
// ignore; guild ignores apply to non-whitelisted messages.
function gateMessage(message: any, snap: ReturnType<typeof snapshotOf>): boolean {
    const id = snap.id;
    const channelId = snap.channelId;
    if (inList(id, cfg.whitelistedIds) || inList(channelId, cfg.whitelistedIds)) return true;
    if (inList(id, cfg.ignoredUsers) || inList(channelId, cfg.ignoredChannels) || inList(snap.guildId, cfg.ignoredGuilds)) return false;
    return true;
}

function toast(content: string, key: string) {
    try {
        const actions: any = getActions();
        const open = actions?.ToastActionCreators?.open ?? actions?.open;
        if (typeof open === 'function') {
            open({ key, content });
            return;
        }
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const show = v?.ui?.toasts?.showToast ?? v?.metro?.common?.toasts?.open ?? v?.common?.toasts?.showToast;
        if (typeof show === 'function') {
            try {
                show({ key, content });
                return;
            } catch {}
            try {
                show(content);
                return;
            } catch {}
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        // bunny.ui.toasts.showToast(content, asset) — content first.
        const show = b?.ui?.toasts?.showToast;
        if (typeof show === 'function') {
            show(content);
            return;
        }
    } catch {}
    try {
        // Last resort: raw Android toast so start feedback is always visible.
        const ta: any = getRN()?.ToastAndroid;
        ta?.show?.(content, ta?.SHORT ?? 0);
    } catch {}
}

function alertBox(title: string, msg: string) {
    // RN Alert works on every host and needs no design components — the one
    // UI primitive that cannot be defeated by a broken settings page.
    try {
        const Alert: any = getRN()?.Alert;
        if (Alert?.alert) {
            Alert.alert(title, msg);
            return;
        }
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const alertApi = v?.ui?.alerts?.showConfirmationAlert;
        if (typeof alertApi === 'function') {
            alertApi({ title, content: msg, confirmText: 'OK', cancelText: 'Close', onConfirm: () => {}, onCancel: () => {} });
        }
    } catch {}
}

function getChannelStore(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const s: any = revenge.discord?.flux?.Stores;
            if (s?.ChannelStore) return s.ChannelStore;
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        const metro = b?.metro;
        for (const c of [b?.common?.ChannelStore, metro?.common?.ChannelStore]) {
            if (c) return c;
        }
        if (metro?.findByStoreName) {
            const m = metro.findByStoreName('ChannelStore');
            if (m?.getChannel) return m;
        }
        if (metro?.findByProps) {
            const m = metro.findByProps('getChannel');
            if (m?.getChannel) return m;
        }
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const metro = v?.metro;
        if (metro?.findByStoreName) {
            const m = metro.findByStoreName('ChannelStore');
            if (m?.getChannel) return m;
        }
        if (metro?.findByProps) {
            const m = metro.findByProps('getChannel');
            if (m?.getChannel) return m;
        }
    } catch {}
    return null;
}

function toastGhostPing(entry: LoggedMessage) {
    let where = 'a channel';
    try {
        const ch = getChannelStore()?.getChannel?.(entry.channelId);
        if (ch?.name) where = '#' + ch.name;
    } catch {}
    toast(
        'Ghost ping by ' + entry.authorTag + ' in ' + where + ': ' + entry.content.slice(0, 120),
        'msglogger-ghostping-' + entry.id,
    );
}

// ---- Saved images (messageLoggerEnhanced-style) ----------------------------
//
// When a logged message had image attachments, they are downloaded and stored
// under Documents/message-logger/images/ as base64 .b64 files with a JSON
// sidecar index (saved-images.json) tracking bytes and timestamps. A total
// quota (imageQuotaGB) evicts the oldest files first. Only actually-fetchable
// URLs are cached (Discord CDN links — avatars/emojis are not).

const IMG_DIR_NAME = 'message-logger/images';
const IMG_INDEX_FILE = 'message-logger/images-index.json';

interface SavedImage {
    file: string; // file name inside the images dir
    bytes: number; // decoded size, for quota accounting
    time: number; // when saved
    mime?: string; // detected from the data URL
}

interface ImageIndex {
    [messageId: string]: SavedImage[];
}

let imageIndex: ImageIndex = {};
let imageQueue: Array<{ id: string; url: string }> = [];
let imageBusy = false;
let imageIndexDirty = false;

function getFetch(): any {
    try {
        if (typeof fetch === 'function') return fetch.bind(globalThis);
    } catch {}
    return null;
}

function getBlobReader(): ((blob: any) => Promise<string>) | null {
    try {
        if (typeof FileReader === 'function') {
            return (blob: any) =>
                new Promise((resolve, reject) => {
                    try {
                        const fr = new FileReader();
                        fr.onload = () => resolve(String(fr.result));
                        fr.onerror = () => reject(fr.error);
                        fr.readAsDataURL(blob);
                    } catch (e) {
                        reject(e);
                    }
                });
        }
        if (typeof Blob === 'function' && typeof Blob.prototype.arrayBuffer === 'function') {
            return async (blob: any) => {
                const buf = await blob.arrayBuffer();
                let s = '';
                const bytes = new Uint8Array(buf);
                for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
                return 'data:application/octet-stream;base64,' + btoa(s);
            };
        }
    } catch {}
    return null;
}

// Normalized filesystem across the two native generations:
//   - Discord FileModule: writeFile(dirName, name, b64content, 'base64'),
//     DocumentsDirPath + readFile(path) for reads, no delete primitive.
//   - revenge.fs: writeFile(path, data), readFile(path), rm(path),
//     getConstants() → { data, files, cache }.
interface NormalizedFs {
    dirPath: string | null; // absolute prefix for reads/links, null if unknown
    writeImage: (name: string, dataB64: string) => Promise<void>;
    writeText: (path: string, data: string) => Promise<void>;
    readText: (path: string) => Promise<string>;
    remove: (path: string) => Promise<boolean>;
}

function getNormalizedFs(): NormalizedFs | null {
    const fm: any = getFileModule();
    let modern: any = null;
    try {
        if (typeof revenge !== 'undefined') {
            modern = (revenge as any)?.fs ?? (revenge as any)?.native?.fs ?? null;
        }
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        modern = modern || b?.fs || b?.native?.fs || null;
    } catch {}
    if (modern && typeof modern.writeFile === 'function' && typeof modern.readFile === 'function') {
        let root = '';
        try {
            if (typeof modern.getConstants === 'function') {
                const c = modern.getConstants();
                root = String(c?.files ?? c?.data ?? '');
            }
        } catch {}
        // revenge.fs paths are absolute — prefix with the files root so both
        // images and the index land in the same real directory.
        const abs = (p: string) => (root ? root + '/' + p : p);
        return {
            dirPath: root ? root + '/' + IMG_DIR_NAME : null,
            writeImage: async (name, dataB64) => {
                await modern.writeFile(abs(IMG_DIR_NAME + '/' + name), dataB64);
            },
            writeText: async (path, data) => {
                await modern.writeFile(abs(path), data);
            },
            readText: async (path) => String(await modern.readFile(abs(path))),
            remove: async (path) => {
                try {
                    if (typeof modern.rm === 'function') return !!(await modern.rm(path));
                    if (typeof modern.deleteFileSync === 'function') return !!modern.deleteFileSync(path);
                    if (typeof modern.unlink === 'function') {
                        await modern.unlink(path);
                        return true;
                    }
                } catch {}
                return false;
            },
        };
    }
    if (fm && typeof fm.writeFile === 'function') {
        let docs = '';
        try {
            docs = String(fm.getConstants?.()?.DocumentsDirPath ?? '/docs');
        } catch {}
        return {
            dirPath: docs + '/' + IMG_DIR_NAME,
            writeImage: async (name, dataB64) => {
                await fm.writeFile('documents', IMG_DIR_NAME + '/' + name, dataB64, 'base64');
            },
            writeText: async (_path, data) => {
                await fm.writeFile('documents', IMG_INDEX_FILE, data, 'utf8');
            },
            readText: async (_path) => String(await fm.readFile(docs + '/' + IMG_INDEX_FILE, 'utf8')),
            remove: async (_path) => false, // legacy FileModule has no delete primitive
        };
    }
    return null;
}

async function loadImageIndex(): Promise<void> {
    const fs = getNormalizedFs();
    if (!fs) return;
    try {
        const raw = await fs.readText(IMG_INDEX_FILE);
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') imageIndex = parsed;
    } catch {
        /* no index yet */
    }
}

async function saveImageIndex(fs: NormalizedFs): Promise<void> {
    if (!imageIndexDirty) return;
    try {
        await fs.writeText(IMG_INDEX_FILE, JSON.stringify(imageIndex));
        imageIndexDirty = false;
    } catch (e) {
        hostError('failed to write image index', e);
    }
}

function imageQuotaBytes(): number {
    return Math.max(0, cfg.imageQuotaGB) * 1024 * 1024 * 1024;
}

function totalSavedBytes(): number {
    let sum = 0;
    for (const id of Object.keys(imageIndex)) {
        for (const img of imageIndex[id] ?? []) sum += img.bytes || 0;
    }
    return sum;
}

async function evictOverQuota(fs: NormalizedFs, extraBytes: number): Promise<void> {
    let total = totalSavedBytes() + extraBytes;
    const quota = imageQuotaBytes();
    if (total <= quota) return;
    const entries: Array<{ id: string; img: SavedImage; i: number }> = [];
    for (const id of Object.keys(imageIndex)) {
        (imageIndex[id] ?? []).forEach((img, i) => entries.push({ id, img, i }));
    }
    entries.sort((a, b) => a.img.time - b.img.time);
    for (const e of entries) {
        if (total <= quota) break;
        const ok = await fs.remove((fs.dirPath ?? '') + '/' + e.img.file);
        if (ok || !fs.dirPath) {
            // Only drop index entries when the file is really gone — otherwise
            // the quota accounting would silently leak.
            imageIndex[e.id] = (imageIndex[e.id] ?? []).filter((_, i) => i !== e.i);
            if (!imageIndex[e.id]?.length) delete imageIndex[e.id];
            total -= e.img.bytes || 0;
            imageIndexDirty = true;
        } else {
            // Legacy fs cannot delete; count it against the quota forever.
            break;
        }
    }
}

function enqueueImageSave(messageId: string, url: string) {
    if (!cfg.saveImages || imageQuotaBytes() <= 0) return;
    if (!getFetch() || !getBlobReader()) return;
    imageQueue.push({ id: messageId, url });
    if (imageQueue.length > 100) imageQueue.shift();
    void pumpImageQueue();
}

async function pumpImageQueue(): Promise<void> {
    if (imageBusy) return;
    imageBusy = true;
    try {
        while (imageQueue.length > 0) {
            const job = imageQueue.shift()!;
            try {
                await saveOneImage(job.id, job.url);
            } catch (e) {
                hostError('image save failed', e);
            }
        }
    } finally {
        imageBusy = false;
    }
}

async function saveOneImage(messageId: string, url: string): Promise<void> {
    const fs = getNormalizedFs();
    if (!fs) return;
    const fetchFn = getFetch();
    const readBlob = getBlobReader();
    if (!fetchFn || !readBlob) return;
    const res = await fetchFn(url, { method: 'GET' });
    if (!res || !res.ok) return;
    const blob = await res.blob();
    const dataUrl = await readBlob(blob);
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return;
    const mime = dataUrl.slice(5, dataUrl.indexOf(';')) || 'image/png';
    const b64 = dataUrl.slice(comma + 1);
    const bytes = Math.floor((b64.length * 3) / 4);
    if (bytes > cfg.attachmentSizeLimitMB * 1024 * 1024) return; // over per-file limit (Equicord "Attachment Size Limit")
    if (bytes > imageQuotaBytes()) return; // single file bigger than the whole quota
    await evictOverQuota(fs, bytes);
    const stamp = Date.now();
    const name = messageId + '-' + stamp + '-' + (imageIndex[messageId]?.length ?? 0) + '.b64';
    await fs.writeImage(name, b64);
    imageIndex[messageId] = [
        ...(imageIndex[messageId] ?? []),
        { file: name, bytes, time: stamp, mime },
    ];
    imageIndexDirty = true;
    await saveImageIndex(fs);
    const entry = log[messageId];
    if (entry) {
        entry.savedImages = imageIndex[messageId].length;
        void persistLog();
    }
}

// Only Discord CDN attachments worth caching, filtered by the user's
// extension allowlist (Equicord "Attachment File Extensions").
function allowedExtensions(): string[] {
    return cfg.attachmentExtensions
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean);
}

// Best-effort synchronous read of a saved image file for previews. Returns
// '' when the file can't be read synchronously (the Image component then just
// renders an empty tile instead of crashing).
function readSavedImageB64(file: string): string {
    try {
        const fm: any = getFileModule();
        if (fm && typeof fm.readFileSync === 'function') {
            return String(fm.readFileSync(docRoot + '/' + IMG_DIR_NAME + '/' + file, 'base64') ?? '');
        }
    } catch {}
    return '';
}

function isCacheableImageUrl(url: string): boolean {
    if (/(^|\/)(cdn\.discordapp\.com|media\.discordapp\.net)\//.test(url) === false) return false;
    const exts = allowedExtensions();
    if (!exts.length) return false;
    return exts.some((ext) => new RegExp('\\.' + ext + '(\\?|$)', 'i').test(url));
}

function queueImagesForEntry(entry: LoggedMessage): void {
    if (!cfg.saveImages) return;
    const urls = entry.attachments.filter(isCacheableImageUrl).slice(0, 5);
    for (const url of urls) enqueueImageSave(entry.id, url);
}

// Equicord "Time Based Cleanup Minutes": drop logged messages older than the
// threshold (0 = disabled). Preserves the current channel when possible.
let cleanupTimer: any = null;
function runTimeBasedCleanup(): void {
    const mins = cfg.timeBasedCleanupMinutes;
    if (!mins) return;
    const cutoff = Date.now() - mins * 60000;
    let removed = 0;
    for (const id of Object.keys(log)) {
        if (log[id].timestamp < cutoff) {
            delete log[id];
            removed++;
        }
    }
    if (removed > 0) {
        void persistLog();
        hostLog('time-based cleanup removed ' + removed + ' old entries');
    }
}

function startCleanupInterval(): void {
    stopCleanupInterval();
    if (!cfg.timeBasedCleanupMinutes) return;
    cleanupTimer = setInterval(runTimeBasedCleanup, Math.max(5, Math.min(cfg.timeBasedCleanupMinutes, 60)) * 60000);
    if (typeof cleanupTimer?.unref === 'function') cleanupTimer.unref();
}

function stopCleanupInterval(): void {
    if (cleanupTimer) {
        try {
            clearInterval(cleanupTimer);
        } catch {}
        cleanupTimer = null;
    }
}

// ---- Flux handlers --------------------------------------------------------

function handleCreate(payload: any) {
    if (!cfg.enabled) return;
    const message = payload?.message;
    if (!message?.id) return;
    rememberForHighlight(payload);
    const snap = snapshotOf(message, currentUserId());
    if (!gateMessage(message, snap)) return;
    const self = snap.authorId && snap.authorId === currentUserId();
    if (
        (cfg.ignoreBots && snap.bot) ||
        (cfg.ignoreWebhooks && snap.webhook) ||
        (cfg.ignoreSelf && self) ||
        inList(snap.authorId, cfg.ignoredUsers)
    ) {
        rememberSkipped(snap.id);
        return;
    }
    seen.set(snap.id, snap);
    if (seen.size > cfg.maxStored * 4) {
        const first = seen.keys().next();
        if (!first.done) seen.delete(first.value);
    }
}

function handleDelete(payload: any) {
    if (!cfg.enabled || !cfg.logDeletes) return;
    const id = String(payload?.message?.id ?? payload?.id ?? '');
    const channelId = String(payload?.message?.channelId ?? payload?.channelId ?? '');
    if (!id || inList(channelId, cfg.ignoredChannels)) return;
    if (!gateMessage(payload?.message ?? { id, channelId }, { id, channelId, guildId: String(payload?.guildId ?? '') } as any)) return;
    // The rewrite interceptor calls this AND the per-event MESSAGE_DELETE
    // handler can still see the original payload on some hosts — capture only
    // the first time so ghost toasts never double-fire.
    if (log[id]?.status === 'deleted') return;
    if (takeSkipped(id)) {
        seen.delete(id);
        return;
    }
    const snap =
        seen.get(id) ??
        snapshotOf(payload?.message ?? { id, channelId }, currentUserId());
    if (snap.attachments.length === 0 && Array.isArray(payload?.message?.embeds) && payload.message.embeds.length > 0) {
        snap.attachments = payload.message.embeds
            .map((e: any) => String(e?.image?.url ?? e?.image?.proxy_url ?? e?.thumbnail?.url ?? ''))
            .filter(Boolean)
            .slice(0, 5);
    }
    if (cfg.ignoreBots && snap.bot) {
        seen.delete(id);
        return;
    }
    if (cfg.ignoreWebhooks && snap.webhook) {
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
        status: 'deleted',
        edits: log[id]?.edits ?? [],
        mentionsMe: snap.mentionsMe,
        ghostPing: ghost,
    } as LoggedMessage;
    prune(cfg.maxStored);
    void persistLog();
    queueImagesForEntry(log[id]);
    if (ghost) toastGhostPing(log[id]);
}

function handleDeleteBulk(payload: any) {
    const ids = Array.isArray(payload?.ids) ? payload.ids : [];
    for (const id of ids) {
        handleDelete({ message: { id, channelId: payload?.channelId } });
    }
}

function handleUpdate(payload: any) {
    if (!cfg.enabled || !cfg.logEdits) return;
    const message = payload?.message;
    if (!message?.id) return;
    rememberForHighlight(payload);
    const id = String(message.id);
    const prev = seen.get(id);
    const snap = snapshotOf(message, currentUserId());
    if (!gateMessage(message, snap)) return;
    if (cfg.ignoreBots && snap.bot) return;
    if (cfg.ignoreWebhooks && snap.webhook) return;
    const self = snap.authorId && snap.authorId === currentUserId();
    if (cfg.ignoreSelf && self) return;
    if (cfg.ignoreSelfEdits && self) return;
    if (inList(snap.authorId, cfg.ignoredUsers)) return;
    seen.set(id, snap);
    const prevContent = prev && typeof prev.content === 'string' ? prev.content : null;
    // Discord's MESSAGE_UPDATE often omits edited_timestamp — the content
    // change alone is a real edit. Requiring the timestamp was dropping all
    // edit history (the "only says EDITED" bug).
    const isRealEdit = prevContent !== null && prevContent !== snap.content;
    const priorHistory = prev?.editHistory ?? [];
    if (isRealEdit && prevContent !== null) priorHistory.push(prevContent);
    if (priorHistory.length) snap.editHistory = priorHistory.slice(-10);
    if (!isRealEdit && !log[id]) return;
    const existing = log[id];
    log[id] = {
        ...snap,
        status: 'edited',
        edits: [...(existing?.edits ?? []), ...(isRealEdit && prevContent !== null ? [prevContent] : [])].slice(-10),
        mentionsMe: snap.mentionsMe,
        ghostPing: existing?.ghostPing ?? false,
    } as LoggedMessage;
    prune(cfg.maxStored);
    void persistLog();
}

// ---- In-chat highlighting (Vencord-style) ---------------------------------

// Force-close survival: Discord keeps the automod-kept rows in its message
// cache across restarts, but our highlight maps start empty — so restored
// rows lose their red. Rebuild the maps from the persisted log on startup.
function restoreHighlightsFromLog() {
    // Rows that no longer exist after a restart are re-created on channel
    // open by the CHANNEL_SELECT re-injection; nothing to do here for them.
    try {
        let restored = 0;
        for (const id of Object.keys(log)) {
            const entry = log[id];
            if (!entry?.channelId) continue;
            if (entry.status === 'deleted') {
                if (!deletedMessageMap.has(id)) {
                    deletedMessageMap.set(id, { channelId: entry.channelId, timestamp: entry.timestamp ?? Date.now() });
                    restored++;
                }
            } else if (entry.status === 'edited' && !editedMessageMap.has(id)) {
                editedMessageMap.set(id, { channelId: entry.channelId, timestamp: entry.timestamp ?? Date.now() });
                restored++;
            }
        }
        if (restored > 0) hostLog('restored ' + restored + ' highlight(s) from saved log');
    } catch (e) {
        hostError('highlight restore failed', e);
    }
}

// A MESSAGE_CREATE/UPDATE we saw is the authoritative copy of the message —
// remember it so the automod rewrite can restore content for messages the
// store may already have evicted.
function rememberForHighlight(payload: any) {
    try {
        const message = payload?.message;
        if (!message?.id) return;
        const channelId = String(message.channelId ?? message.channel_id ?? '');
        const content = typeof message.content === 'string' ? message.content : '';
        const author = message.author ?? {};
        const rec = {
            channelId,
            timestamp: Date.now(),
            content,
            authorTag: author.global_name ?? author.username ?? 'Unknown',
            bot: !!author.bot,
        };
        const isEdit = deletedMessageMap.has(String(message.id));
        if (content) (isEdit ? highlightEdits : highlightCreates).set(String(message.id), rec);
        if (isEdit) deletedMessageMap.delete(String(message.id));
    } catch {}
}

function trimHighlightCache(map: Map<string, any>) {
    if (map.size <= HIGHLIGHT_MAX) return;
    const oldest = map.keys().next();
    if (!oldest.done) map.delete(oldest.value);
}

function isSelfDelete(id: string) {
    if (!manualDeletes.has(id)) return false;
    manualDeletes.delete(id);
    return true;
}

function markHighlightDeleted(id: string, channelId: string) {
    deletedMessageMap.set(id, { channelId, timestamp: Date.now() });
    trimHighlightCache(deletedMessageMap);
}

function markHighlightEdited(id: string, channelId: string) {
    if (deletedMessageMap.has(id)) return;
    editedMessageMap.set(id, { channelId, timestamp: Date.now() });
    trimHighlightCache(editedMessageMap);
}

interface AutomodRecord {
    content?: string;
    authorTag?: string;
    bot?: boolean;
}

// Memory cache of message content, used to rehydrate messages that were
// already evicted from Discord's stores when they get deleted.
const highlightCreates = new Map<string, AutomodRecord & { channelId: string; timestamp: number }>();
const highlightEdits = new Map<string, AutomodRecord & { channelId: string; timestamp: number }>();

function cachedRecordFor(id: string): AutomodRecord | undefined {
    return highlightCreates.get(id) ?? highlightEdits.get(id);
}

function buildAutomodEvent(id: string, channelId: string, record?: AutomodRecord) {
    return {
        type: 'MESSAGE_EDIT_FAILED_AUTOMOD',
        messageData: {
            type: 1,
            message: {
                channelId,
                messageId: id,
            },
        },
        errorResponseBody: {
            code: 200000,
            message: record?.content || '(deleted)',
        },
    };
}

// The rewrite engine: intercept every dispatch *before* Discord's reducers
// see it. MESSAGE_DELETE from someone else becomes MESSAGE_EDIT_FAILED_AUTOMOD,
// which makes the native chat renderer keep the row with its content (what
// Vencord's messageLogger does on desktop, and what Lucid proved works on
// React Native).
function installDeleteRewrite(dispatcher: any, addCleanup: (off: () => void) => void) {
    if (!dispatcher || typeof dispatcher.addInterceptor !== 'function') return false;
    // Bulk delete needs a real dispatch to re-emit per-id automod events;
    // adapter hosts without one fall back to pass-through (log still records).
    const dispatch = typeof dispatcher.dispatch === 'function' ? dispatcher.dispatch.bind(dispatcher) : null;
    try {
        const interceptor = (payload: any) => {
            try {
                const type = payload?.type;
                if (type === 'MESSAGE_DELETE' && cfg.logDeletes) {
                    const id = String(payload?.id ?? payload?.messageId ?? payload?.message?.id ?? '');
                    const channelId = String(payload?.channelId ?? payload?.channel_id ?? payload?.message?.channelId ?? payload?.message?.channel_id ?? '');
                    if (!id || !channelId) return;
                    if (isSelfDelete(id)) {
                        // Own deletes: vanish normally unless keepSelfDeletes
                        // is on. Even when vanishing, the delete is still
                        // logged (via the per-event handler).
                        if (!cfg.keepSelfDeletes) return undefined;
                        // keepSelfDeletes=true: fall through to keep + paint.
                    }
                    if (inList(channelId, cfg.ignoredChannels)) return;
                    const record = cachedRecordFor(id);
                    if (cfg.ignoreBots && record?.bot) return;
                    const authorId = seen.get(id)?.authorId ?? log[id]?.authorId;
                    if (cfg.ignoreSelf && authorId && authorId === currentUserId()) return;
                    if (inList(authorId, cfg.ignoredUsers)) return;
                    handleDelete(payload);
                    markHighlightDeleted(id, channelId);
                    return buildAutomodEvent(id, channelId, record);
                }
                if (type === 'MESSAGE_DELETE_BULK' && cfg.logDeletes) {
                    const ids: string[] = Array.isArray(payload?.ids) ? payload.ids.map(String) : [];
                    const channelId = String(payload?.channelId ?? payload?.channel_id ?? '');
                    if (!ids.length || !channelId) return;
                    const kept = ids.filter((id) => {
                        if (isSelfDelete(id)) return false;
                        if (inList(channelId, cfg.ignoredChannels)) return false;
                        if (cfg.ignoreBots && cachedRecordFor(id)?.bot) return false;
                        return true;
                    });
                    if (!kept.length) return;
                    for (const id of kept) {
                        markHighlightDeleted(id, channelId);
                        handleDeleteBulk({ ids: [id], channelId });
                    }
                    if (dispatch) {
                        // Block the bulk remove, then re-emit one automod event
                        // per id so the native renderer keeps every row.
                        setTimeout(() => {
                            for (const id of kept) {
                                try {
                                    dispatch(buildAutomodEvent(id, channelId, cachedRecordFor(id)));
                                } catch {}
                            }
                        }, 0);
                        return false;
                    }
                    return;
                }
                if (type === 'MESSAGE_UPDATE') {
                    const id = String(payload?.message?.id ?? '');
                    const channelId = String(payload?.message?.channelId ?? payload?.message?.channel_id ?? '');
                    if (id && channelId && cfg.logEdits && !inList(channelId, cfg.ignoredChannels)) {
                        markHighlightEdited(id, channelId);
                    }
                    return;
                }
            } catch (e) {
                hostError('rewrite interceptor failed', e);
            }
            return;
        };
        const off = dispatcher.addInterceptor(interceptor);
        addCleanup(typeof off === 'function' ? off : () => {
            try {
                const list = dispatcher._interceptors ?? dispatcher._dependencies;
                if (Array.isArray(list)) {
                    const i = list.indexOf(interceptor);
                    if (i >= 0) list.splice(i, 1);
                }
            } catch {}
        });
        return true;
    } catch (e) {
        hostError('could not install delete rewrite', e);
        return false;
    }
}

// Row painting: Discord's native chat list builds rows through
// DCDChatManager.updateRows (JSON payload) and RowManager.generate (row
// objects). Deleted rows get red text + red gutter, edited rows an amber
// gutter — matching Vencord's messageLogger styling.
function paintRow(row: any, processColor: (c: any) => any) {
    const msg = row?.message;
    if (!msg?.id) return;
    const id = String(msg.id);
    const isDel = deletedMessageMap.has(id);
    const isEd = editedMessageMap.has(id);
    if (!isDel && !isEd) return;
    if (isDel) {
        // Deleted info lives in Discord's own small ((...)) marker — never
        // appended to content, so non-string content (bot/interaction rows)
        // can't turn into '[object Object]'.
        const entry = log[id];
        const who = cfg.deletedInfo && entry?.authorTag ? ' by ' + entry.authorTag : '';
        const when = cfg.deletedInfo && entry?.timestamp ? ' at ' + new Date(entry.timestamp).toLocaleString() : '';
        msg.edited = '(deleted' + who + when + ')';
        const red = processColor('#f04747');
        msg.textColor = red;
        row.backgroundHighlight = {
            backgroundColor: processColor('#f047471f'),
            gutterColor: red,
        };
    } else {
        row.backgroundHighlight = {
            backgroundColor: processColor('#faa61a18'),
            gutterColor: processColor('#faa61a'),
        };
    }
    // Equicord "Inline Edits": previous versions shown inside the message.
    // Dedupe by content (not a painted flag) so a re-render never stacks —
    // and a NEW edit (longer history) gets painted on the next render pass.
    if (cfg.inlineEdits && typeof msg.content === 'string') {
        const history = log[id]?.edits ?? [];
        if (history.length) {
            const block = history.map((h) => '(edited) ' + String(h)).join('\n');
            if (!msg.content.includes(block)) {
                msg.content = msg.content + '\n' + block;
            }
        }
    }
}

let rowPaintersInstalled = 0;

function installRowPainters(addCleanup: (off: () => void) => void) {
    const React = getReact();
    const RN = getRN();
    const processColor = RN?.processColor ?? ((c: string) => c);
    if (!cfg.colorHighlights) {
        rowPaintersInstalled = 0;
        return;
    }
    let installed = 0;

    const patchBefore = (target: any, method: string, fn: (args: any[]) => void): boolean => {
        try {
            const original = target?.[method];
            if (typeof original !== 'function') return false;
            target[method] = function (...args: any[]) {
                    try {
                        fn(args);
                    } catch {}
                    return original.apply(this, args);
                };
            addCleanup(() => {
                try {
                    target[method] = original;
                } catch {}
            });
            return true;
        } catch {
            return false;
        }
    };

    const paintArgs = (args: any[]) => {
        const raw = args[1];
        if (!raw) return;
        const handleRow = (row: any) => {
            if (!row || row.type !== 1) return;
            paintRow(row, processColor);
        };
        if (typeof raw === 'string') {
            try {
                const rows = JSON.parse(raw);
                if (Array.isArray(rows)) {
                    let mutated = false;
                    for (const row of rows) {
                        if (row?.message?.id && (deletedMessageMap.has(String(row.message.id)) || editedMessageMap.has(String(row.message.id)))) {
                            handleRow(row);
                            mutated = true;
                        }
                    }
                    if (mutated) args[1] = JSON.stringify(rows);
                }
            } catch {}
        } else if (Array.isArray(raw)) {
            for (const row of raw) handleRow(row);
        } else if (Array.isArray(raw?.rows)) {
            for (const row of raw.rows) handleRow(row);
        }
    };

    void React;
    const chatManager = RN?.NativeModules?.DCDChatManager;
    if (chatManager && patchBefore(chatManager, 'updateRows', paintArgs)) installed++;

    // The JS-side chat manager (same method, plain object export).
    const metro = getMetro();
    const jsChat = metro?.findByProps?.('updateRows', 'getConstants') ?? metro?.findByProps?.('updateRows');
    if (jsChat && jsChat !== chatManager && patchBefore(jsChat, 'updateRows', paintArgs)) installed++;

    // RowManager.prototype.generate (after-hook): the final row object.
    let rowManager: any = null;
    try {
        rowManager = metro?.findByName?.('RowManager', false) ?? metro?.findByProps?.('RowManager')?.RowManager ?? null;
    } catch {}
    if (rowManager?.prototype?.generate) {
        try {
            const proto = rowManager.prototype;
            const original = proto.generate;
            proto.generate = function (...args: any[]) {
                const row = original.apply(this, args);
                try {
                    const target = (row && row.row) || row;
                    if (target?.message?.id) {
                        paintRow(target, processColor);
                    }
                } catch {}
                return row;
            };
            addCleanup(() => {
                try {
                    proto.generate = original;
                } catch {}
            });
            installed++;
        } catch {}
    }

    rowPaintersInstalled = installed;
    hostLog('row painters installed: ' + installed);
}

// Self-delete tracking: when *you* delete a message through Discord's own
// MessageActions, remember the id so we log it as deleted (and keep the row
// visible in chat) while letting Discord's own delete proceed normally.
function installSelfDeleteBypass(addCleanup: (off: () => void) => void) {
    try {
        const metro = getMetro();
        const actions = metro?.findByProps?.('deleteMessage', 'startEditMessage') ?? metro?.findByProps?.('deleteMessage');
        const del = actions?.deleteMessage;
        if (typeof del !== 'function') return false;
        actions.deleteMessage = function (...args: any[]) {
            try {
                const id = String(args?.[1] ?? args?.[0] ?? '');
                if (id) manualDeletes.add(id);
            } catch {}
            return del.apply(this, args);
        };
        addCleanup(() => {
            try {
                actions.deleteMessage = del;
            } catch {}
        });
        return true;
    } catch {
        return false;
    }
}

// ---- Theme helpers (log viewer readability) --------------------------------

// Discord's semantic color tokens; falls back to hardcoded palette values.
// resolveThemeMeta: discord's ThemeStore holds {theme: 'dark'|'light'}.
function resolveThemeMeta(): 'dark' | 'light' {
    try {
        const metro = getMetro();
        const themeStore =
            metro?.findByStoreName?.('ThemeStore') ??
            revenge?.discord?.flux?.Stores?.ThemeStore ??
            null;
        const theme = themeStore?.theme ?? themeStore?.getState?.()?.theme;
        if (theme === 'light') return 'light';
    } catch {}
    return 'dark';
}

function viewerColors() {
    const theme = resolveThemeMeta();
    if (theme === 'light') {
        return {
            bg: 'rgba(0,0,0,0.04)',
            card: 'rgba(0,0,0,0.05)',
            text: '#060607',
            sub: '#4e5058',
            deleted: '#d83c3e',
            deletedBg: 'rgba(216,60,62,0.10)',
            edited: '#c28516',
            editedBg: 'rgba(250,166,26,0.12)',
        };
    }
    return {
        bg: 'rgba(255,255,255,0.06)',
        card: 'rgba(255,255,255,0.08)',
        text: '#dbdee1',
        sub: '#949ba4',
        deleted: '#f23f43',
        deletedBg: 'rgba(242,63,67,0.14)',
        edited: '#faa61a',
        editedBg: 'rgba(250,166,26,0.14)',
    };
}

// ---- Settings viewer (React, no JSX) ---------------------------------------

function makeSettingsComponent() {
    const React = getReact();
    if (!React) return () => null;
    const el = React.createElement.bind(React);
    const RN = getRN() || {};
    const { View = 'view', Text = 'text', TextInput = 'input', Pressable = View, ScrollView = View, Switch = null, Image = null } = RN;

    function SwitchRow(props: any) {
        const c = viewerColors();
        const toggle = Switch
            ? el(Switch, {
                  value: !!props.value,
                  onValueChange: props.onValueChange,
                  trackColor: { false: 'rgba(128,128,128,0.35)', true: '#5865F2' },
                  thumbColor: '#ffffff',
              })
            : el(
                  Text,
                  { style: { color: c.sub }, onPress: () => props.onValueChange(!props.value) },
                  props.value ? 'On' : 'Off',
              );
        return el(
            View,
            { style: { paddingHorizontal: 16, paddingVertical: 10 } },
            el(
                View,
                { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
                el(Text, { style: { color: c.text, fontSize: 16, flex: 1, paddingRight: 12 } }, props.label),
                toggle,
            ),
            props.subLabel ? el(Text, { style: { color: c.sub, fontSize: 13, marginTop: 2 } }, props.subLabel) : null,
        );
    }

    function RowGroup(props: any) {
        const c = viewerColors();
        // Hermes: spreading a single (non-array) child throws "iterator method
        // is not callable" — normalize children to an array first.
        const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
        return el(
            View,
            { style: { marginTop: 16 } },
            el(Text, { style: { color: c.text, fontSize: 15, fontWeight: '600', paddingHorizontal: 16, marginBottom: 6 } }, props.title),
            el(
                View,
                { style: { backgroundColor: c.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 4 } },
                ...kids,
            ),
        );
    }

    const DText = (props: any) => {
        const design = getDesign();
        const T = design?.Text;
        const style = { color: viewerColors().text, ...(props?.style ?? {}) };
        return el(T || Text, { ...props, style }, ...(Array.isArray(props?.children) ? props.children : [props?.children]));
    };

    return function SettingsComponent(props: any) {
        // Classic renders this with no props; Next passes { api }. Bridge so
        // the same component works on both.
        const api: any = props?.api ?? classicSettingsApi();
        const settings = api?.jsonStorage?.use?.() ?? cfg;
        const C = viewerColors();
        const [entries, setEntries] = React.useState([]);
        const [filter, setFilter] = React.useState('all');
        const [query, setQuery] = React.useState('');
        const [refreshTick, setRefreshTick] = React.useState(0);
        const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

        React.useEffect(() => {
            settingsChangedCb = () => setRefreshTick((t: number) => t + 1);
            return () => {
                settingsChangedCb = null;
            };
        }, []);

        const reload = async () => {
            const merged: Record<string, LoggedMessage> = {};
            try {
                const raw = await getFileModule()?.readFile(logPath(), 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') Object.assign(merged, parsed);
            } catch {}
            Object.assign(merged, log);
            const list = Object.values(merged).sort((a, b) => b.timestamp - a.timestamp);
            setEntries(list.slice(0, 300));
        };

        React.useEffect(() => {
            void reload();
        }, [refreshTick]);

        const visible = entries.filter((m: LoggedMessage) => {
            if (filter === 'deleted' && m.status !== 'deleted') return false;
            if (filter === 'edited' && m.status !== 'edited') return false;
            if (filter === 'ghost' && !m.ghostPing) return false;
            const q = query.trim().toLowerCase();
            if (
                q &&
                !(
                    m.content.toLowerCase().includes(q) ||
                    m.authorTag.toLowerCase().includes(q)
                )
            )
                return false;
            return true;
        });

        const removeEntry = async (id: string) => {
            try {
                delete log[id];
                await persistLog();
                void reload();
            } catch {}
        };

        const exportLog = async () => {
            try {
                const clip = getClipboard();
                if (!clip?.setString) throw new Error('clipboard unavailable');
                clip.setString(JSON.stringify(Object.values(log), null, 2));
                toast('Log copied to clipboard', 'msglogger-export');
            } catch {
                toast('Export failed — clipboard unavailable', 'msglogger-export-fail');
            }
        };

        const clearLog = async () => {
            log = {};
            try {
                await getFileModule()?.writeFile('documents', LOG_FILE, '{}', 'utf8');
            } catch {}
            void reload();
        };

        const clearImageCache = async () => {
            try {
                const fs = getNormalizedFs();
                const base = fs?.dirPath ?? '';
                for (const id of Object.keys(imageIndex)) {
                    for (const img of imageIndex[id] ?? []) {
                        try {
                            await fs?.remove(base + '/' + img.file);
                        } catch {}
                    }
                }
                imageIndex = {};
                imageIndexDirty = true;
                if (fs) await saveImageIndex(fs);
                toast('Saved images cleared', 'msglogger-img-clear');
            } catch {
                toast('Could not clear saved images', 'msglogger-img-clear-fail');
            }
        };

        // Per-user aggregation: who deleted/edited the most.
        const byUser: Record<string, { name: string; deleted: number; edited: number; ghosts: number; total: number }> = {};
        for (const m of entries as LoggedMessage[]) {
            const key = m.authorId || m.authorTag || 'unknown';
            const u = (byUser[key] ??= { name: m.authorTag || 'Unknown', deleted: 0, edited: 0, ghosts: 0, total: 0 });
            if (m.status === 'deleted') u.deleted++;
            else if (m.status === 'edited') u.edited++;
            if (m.ghostPing) u.ghosts++;
            u.total++;
        }
        const userStats = Object.entries(byUser)
            .map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 15);
        const userEntries = selectedUser
            ? (entries as LoggedMessage[]).filter((m) => (m.authorId || m.authorTag || 'unknown') === selectedUser)
            : [];
        const selectedName = selectedUser ? (byUser[selectedUser]?.name ?? '') : '';

        const tab = (key: string, label: string) =>
            el(
                Pressable,
                {
                    key,
                    onPress: () => setFilter(key),
                    style: { paddingVertical: 8, paddingHorizontal: 10 },
                },
                el(
                    Text,
                    { style: { fontWeight: filter === key ? 'bold' : 'normal', color: filter === key ? C.text : C.sub } },
                    label,
                ),
            );

        const sw = (key: keyof Settings, label: string, subLabel?: string) =>
            el(SwitchRow, {
                key,
                label,
                subLabel,
                value: settings?.[key] !== false,
                onValueChange: (v: boolean) => api?.jsonStorage?.set?.({ [key]: v }),
            });

        return el(
            ScrollView,
            { style: { flexGrow: 1 } },
            el(
                RowGroup,
                { title: 'Status' },
                el(DText, null, 'Host: ' + (hostKind === 'next' ? 'Revenge (Next API)' : 'Classic / vendetta') + (storageKind ? ' · storage: ' + storageKind : '')),
                el(DText, null, startedAt ? 'Running since ' + new Date(startedAt).toLocaleTimeString() : 'Not started — toggle the plugin off and on'),
                el(DText, null, 'Flux handlers: ' + handlersRegistered + '/5 · row painters: ' + rowPaintersInstalled),
                lastStartError ? el(DText, null, 'Last error: ' + lastStartError) : null,
            ),
            el(
                RowGroup,
                { title: 'MessageLogger' },
                sw('enabled', 'Enabled'),
                sw('logDeletes', 'Log deleted messages'),
                sw('restoreDeletedInChat', 'Restore deleted in chat', 'Re-inject logged deleted messages when you open their channel'),
                sw('keepSelfDeletes', 'Keep my own deletes visible', 'Off: your own deleted messages vanish like normal'),
                sw('deletedInfo', 'Show deleted info', 'Red rows show "[deleted by X at …]"'),
                sw('logEdits', 'Log edited messages'),
                sw('ghostPings', 'Ghost ping toasts', 'Toast when a message mentioning you is deleted'),
                sw('colorHighlights', 'Red highlight in chat', 'Deleted messages stay visible with red text (Vencord style)'),
                sw('saveImages', 'Save deleted images', 'Downloads images from deleted messages into device storage'),
                el(DText, null, 'Attachment size limit (MB) — larger files are not saved.'),
                el(TextInput, {
                    placeholder: '100',
                    placeholderTextColor: C.sub,
                    defaultValue: String(settings?.attachmentSizeLimitMB ?? 100),
                    onChangeText: (t: string) => {
                        const n = parseFloat(t);
                        if (!isNaN(n) && n >= 1 && n <= 1024) api?.jsonStorage?.set?.({ attachmentSizeLimitMB: n });
                    },
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Attachment file extensions — comma-separated allowlist.'),
                el(TextInput, {
                    placeholder: 'png,jpg,jpeg,gif,webp',
                    placeholderTextColor: C.sub,
                    defaultValue: settings?.attachmentExtensions ?? 'png,jpg,jpeg,gif,webp',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ attachmentExtensions: t }),
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Image storage quota (GB)'),
                el(TextInput, {
                    placeholder: '2',
                    placeholderTextColor: C.sub,
                    defaultValue: String(settings?.imageQuotaGB ?? 2),
                    onChangeText: (t: string) => {
                        const n = parseFloat(t);
                        if (!isNaN(n) && n >= 0.1 && n <= 100) api?.jsonStorage?.set?.({ imageQuotaGB: n });
                    },
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Used: ' + (totalSavedBytes() / 1073741824).toFixed(2) + ' GB · ' + Object.keys(imageIndex).length + ' messages with saved images'),
                sw('ignoreBots', 'Ignore bot messages'),
                sw('ignoreWebhooks', 'Ignore webhooks'),
                sw('ignoreSelf', 'Ignore your own messages'),
                sw('ignoreSelfEdits', 'Ignore your own edits'),
                sw('inlineEdits', 'Inline edit history', 'Show previous versions inside the message (Equicord Inline Edits)'),
            ),
            el(
                RowGroup,
                { title: 'Filters' },
                el(DText, null, 'Whitelisted IDs — comma-separated user/channel IDs always logged, overriding ignores.'),
                el(TextInput, {
                    placeholder: 'e.g. 123456789012345678',
                    placeholderTextColor: C.sub,
                    defaultValue: settings?.whitelistedIds ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ whitelistedIds: t }),
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Ignored guilds — comma-separated server IDs never logged.'),
                el(TextInput, {
                    placeholder: 'Server IDs',
                    placeholderTextColor: C.sub,
                    defaultValue: settings?.ignoredGuilds ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ ignoredGuilds: t }),
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Time-based cleanup — remove entries older than this many minutes (0 = off).'),
                el(TextInput, {
                    placeholder: '0',
                    placeholderTextColor: C.sub,
                    defaultValue: String(settings?.timeBasedCleanupMinutes ?? 0),
                    onChangeText: (t: string) => {
                        const n = parseInt(t, 10);
                        if (!isNaN(n) && n >= 0) api?.jsonStorage?.set?.({ timeBasedCleanupMinutes: n });
                    },
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
            ),
            el(
                RowGroup,
                { title: 'Ignored IDs' },
                el(DText, null, 'Comma-separated channel IDs never get logged.'),
                el(TextInput, {
                    placeholder: 'Channel IDs',
                    placeholderTextColor: C.sub,
                    defaultValue: settings?.ignoredChannels ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ ignoredChannels: t }),
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                el(DText, null, 'Comma-separated user IDs never get logged.'),
                el(TextInput, {
                    placeholder: 'User IDs',
                    placeholderTextColor: C.sub,
                    defaultValue: settings?.ignoredUsers ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ ignoredUsers: t }),
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
            ),
            selectedUser
                ? el(
                      RowGroup,
                      { title: selectedName + ' — ' + userEntries.length + ' entries (tap to go back)' },
                      el(
                          Pressable,
                          { onPress: () => setSelectedUser(null), style: { padding: 10 } },
                          el(Text, { style: { color: C.sub } }, '← Back to all users'),
                      ),
                      ...userEntries.slice(0, 30).map((m: LoggedMessage) =>
                          el(
                              View,
                              { key: m.id, style: { paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.bg } },
                              el(Text, { style: { color: m.status === 'deleted' ? C.deleted : C.edited, fontWeight: 'bold', fontSize: 12 } }, (m.status === 'deleted' ? 'DELETED' : 'EDITED') + (m.ghostPing ? ' · GHOST PING' : '') + ' — ' + new Date(m.timestamp).toLocaleString()),
                              el(Text, { style: { color: C.text } }, m.content || '(no text content)'),
                              m.edits.length > 0 && el(Text, { style: { color: C.sub, fontSize: 12 } }, 'Before: ' + m.edits.join('  |  ')),
                          ),
                      ),
                  )
                : el(
                      RowGroup,
                      { title: 'Users (' + userStats.length + ')' },
                      userStats.length === 0
                          ? el(DText, null, 'No logged users yet.')
                          : userStats.map((u) =>
                                el(
                                    Pressable,
                                    {
                                        key: u.id,
                                        onPress: () => setSelectedUser(u.id),
                                        style: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.bg },
                                    },
                                    el(
                                        View,
                                        { style: { flex: 1 } },
                                        el(Text, { style: { color: C.text, fontSize: 15 } }, u.name),
                                        el(Text, { style: { color: C.sub, fontSize: 12 } }, u.deleted + ' deleted · ' + u.edited + ' edited' + (u.ghosts > 0 ? ' · ' + u.ghosts + ' ghost pings' : '')),
                                    ),
                                    el(Text, { style: { color: u.deleted > 0 ? C.deleted : C.sub, fontWeight: 'bold' } }, String(u.total)),
                                ),
                            ),
                  ),
            el(
                RowGroup,
                { title: 'Saved log (' + visible.length + ' shown)' },
                el(View, { style: { flexDirection: 'row' } }, tab('all', 'All'), tab('deleted', 'Deleted'), tab('edited', 'Edited'), tab('ghost', 'Ghost pings')),
                el(TextInput, {
                    placeholder: 'Search author or text…',
                    placeholderTextColor: C.sub,
                    value: query,
                    onChangeText: setQuery,
                    style: { padding: 8, color: C.text, backgroundColor: C.bg, borderRadius: 6 },
                }),
                visible.length === 0
                    ? el(DText, null, 'Nothing logged yet. Deleted and edited messages will appear here.')
                    : visible.slice(0, 200).map((m: LoggedMessage) => {
                          const isDel = m.ghostPing || m.status === 'deleted';
                          const statusColor = isDel ? C.deleted : C.edited;
                          return el(
                              View,
                              {
                                  key: m.id,
                                  style: {
                                      borderLeftWidth: 3,
                                      borderColor: statusColor,
                                      backgroundColor: isDel ? C.deletedBg : C.editedBg,
                                      borderRadius: 6,
                                      padding: 10,
                                      marginBottom: 8,
                                  },
                              },
                              el(
                                  Text,
                                  { style: { color: statusColor, fontWeight: 'bold', fontSize: 12, marginBottom: 2 } },
                                  '[' + (m.ghostPing ? 'GHOST PING' : m.status === 'deleted' ? 'DELETED' : 'EDITED') + '] ' + m.authorTag + ' — ' + new Date(m.timestamp).toLocaleString(),
                              ),
                              el(Text, { style: { color: C.text } }, m.content || '(no text content)'),
                              m.attachments.length > 0 && el(Text, { style: { color: C.sub, fontSize: 12 } }, m.attachments.length + ' attachment(s) saved as links'),
                              m.savedImages ? el(Text, { style: { color: C.sub, fontSize: 12 } }, m.savedImages + ' image(s) saved to device') : null,
                              ...(m.savedImages && Image
                                  ? [
                                        el(
                                            View,
                                            { key: m.id + ':imgs', style: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 } },
                                            (imageIndex[m.id] ?? []).slice(0, 4).map((img, i) =>
                                                el(Image, {
                                                    key: i,
                                                    source: { uri: 'data:' + (img.mime ?? 'image/png') + ';base64,' + readSavedImageB64(img.file) },
                                                    style: { width: 72, height: 72, borderRadius: 6, marginRight: 6, marginBottom: 6, backgroundColor: C.bg },
                                                    resizeMode: 'cover',
                                                }),
                                            ),
                                        ),
                                    ]
                                  : []),
                              m.edits.length > 0 && el(Text, { style: { color: C.sub, fontSize: 12 } }, 'Previous versions: ' + m.edits.join('  |  ')),
                              el(
                                  Pressable,
                                  { onPress: () => void removeEntry(m.id), style: { paddingVertical: 4 } },
                                  el(Text, { style: { color: C.sub, fontSize: 12 } }, 'Delete entry'),
                              ),
                          );
                      }),
            ),
            el(
                View,
                { style: { padding: 12 } },
                el(
                    Pressable,
                    { onPress: () => void exportLog(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { fontWeight: 'bold', color: C.text } }, 'Copy log JSON to clipboard'),
                ),
                el(
                    Pressable,
                    { onPress: () => void clearLog(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { fontWeight: 'bold', color: C.deleted } }, 'Clear saved log'),
                ),
                el(
                    Pressable,
                    { onPress: () => void clearImageCache(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { color: C.deleted } }, 'Clear saved images'),
                ),
                el(
                    Pressable,
                    { onPress: () => void reload(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { color: C.sub } }, 'Refresh list'),
                ),
            ),
        );
    };
}

// ---- Host-specific startup -------------------------------------------------

let settingsChangedCb: (() => void) | null = null;
function notifySettingsChanged() {
    try {
        settingsChangedCb?.();
    } catch {}
}

// Settings bridge for Classic: there is no jsonStorage API, so read/write the
// live storage proxy and notify the open settings screen.
function classicSettingsApi(): any {
    return {
        use: () => ({ ...cfg }),
        set: (update: any) => {
            try {
                if (!storageProxy || typeof storageProxy !== 'object') return;
                const data = hostData() ?? {};
                const settings = { ...coerceSettings(data.settings), ...update };
                if (storageKind === 'bunny') {
                    storageProxy.data = { ...(data as any), settings };
                } else {
                    storageProxy.settings = settings;
                }
                refreshClassicConfig();
                notifySettingsChanged();
            } catch {}
        },
    };
}

function registerFluxHandlers(flux: any, addCleanup: (off: () => void) => void) {
    const register = (event: string, handler: (payload: any) => void) => {
        try {
            const off = flux.onFluxEventDispatched(event, (payload: any) => {
                try {
                    handler(payload);
                } catch (e) {
                    hostError(event + ' handler failed', e);
                }
                return payload;
            });
            if (typeof off === 'function') addCleanup(off);
            handlersRegistered++;
            hostLog('registered ' + event);
        } catch (e) {
            hostError('could not register ' + event, e);
        }
    };

    register('MESSAGE_CREATE', handleCreate);
    register('MESSAGE_DELETE', handleDelete);
    register('MESSAGE_DELETE_BULK', handleDeleteBulk);
    register('MESSAGE_UPDATE', handleUpdate);
    register('CHANNEL_SELECT', handleChannelSelect);
}

// ---- Channel-open re-injection ---------------------------------------------
// After a restart Discord re-fetches channels from the API, so deleted rows
// are gone — the log remembers them but the chat has nothing to paint.
// Re-dispatching a MESSAGE_CREATE makes Discord's own MessageStore build the
// row again (kept visible + red via the rewrite/painter machinery).
let lastInjectedChannel = '';
let lastInjectedAt = 0;

function handleChannelSelect(payload: any) {
    if (!cfg.enabled || !cfg.restoreDeletedInChat) return;
    const channelId = String(payload?.channelId ?? '');
    if (!channelId) return;
    const now = Date.now();
    if (channelId === lastInjectedChannel && now - lastInjectedAt < 1500) return;
    lastInjectedChannel = channelId;
    lastInjectedAt = now;
    setTimeout(() => void reinjectChannel(channelId), 350);
}

async function reinjectChannel(channelId: string) {
    try {
        // Next's flux adapter exposes only addInterceptor — find a real
        // dispatch through the raw dispatcher module (metro works on every
        // host; Discord's FluxDispatcher always has dispatch + subscribe).
        let dispatch: ((ev: any) => void) | null = null;
        const raw: any = getRawFluxDispatcher();
        if (typeof raw?.dispatch === 'function') dispatch = raw.dispatch.bind(raw);
        if (!dispatch) {
            try {
                const metro = getMetro();
                const rd = metro?.findByProps?.('dispatch', 'subscribe');
                if (typeof rd?.dispatch === 'function') dispatch = rd.dispatch.bind(rd);
            } catch {}
        }
        if (!dispatch) {
            hostError('no raw dispatcher available for re-injection');
            return;
        }
        const entries = Object.values(log).filter(
            (m) => m.status === 'deleted' && m.channelId === channelId,
        ) as LoggedMessage[];
        if (!entries.length) return;
        const alreadyIn = getMessageIdsInChannel(channelId);
        let injected = 0;
        for (const entry of entries) {
            if (alreadyIn.has(entry.id)) continue;
            dispatch({
                type: 'MESSAGE_CREATE',
                message: {
                    id: entry.id,
                    channel_id: channelId,
                    content: entry.content,
                    timestamp: new Date(entry.timestamp).toISOString(),
                    author: { id: entry.authorId, username: entry.authorTag, bot: !!entry.bot },
                    attachments: (entry.attachments ?? []).map((u) => ({ url: u, proxy_url: u })),
                    mentions: [],
                    mention_everyone: false,
                    mention_roles: [],
                    pinned: false,
                    tts: false,
                    type: 0,
                },
                optimisticallyPerformed: true,
                mlReinjected: true,
            });
            markHighlightDeleted(entry.id, channelId);
            injected++;
        }
        if (injected > 0) hostLog('re-injected ' + injected + ' deleted message(s) into channel ' + channelId);
    } catch (e) {
        hostError('channel re-injection failed', e);
    }
}

// Which logged messages Discord still holds for a channel — used to skip
// rows that are already on screen (their paint is handled elsewhere).
function getMessageIdsInChannel(channelId: string): Set<string> {
    const ids = new Set<string>();
    try {
        const store = getMessageStore();
        const messages = store?.getMessages?.(channelId);
        const arr = typeof messages?.array === 'function' ? messages.array() : messages?._array ?? [];
        for (const m of arr) if (m?.id) ids.add(String(m.id));
    } catch {}
    return ids;
}

function getMessageStore(): any {
    try {
        const s: any = (typeof revenge !== 'undefined' && (revenge as any)?.discord?.flux?.Stores?.MessageStore) || null;
        if (s) return s;
    } catch {}
    try {
        const metro = getMetro();
        const s = metro?.findByStoreName?.('MessageStore') ?? metro?.findByProps?.('getMessage', 'getMessages');
        if (s) return s;
    } catch {}
    return null;
}

async function startNext({ cleanup, jsonStorage, logger }: any) {
    apiRef = { logger };
    // Set up the config cache first: flux handlers read `cfg`.
    cfgStorage = jsonStorage ?? null;
    refreshConfigFromStorage();
    if (jsonStorage) {
        try {
            await jsonStorage.get();
            refreshConfigFromStorage();
            cleanup(
                jsonStorage.subscribe(() => {
                    refreshConfigFromStorage();
                }),
            );
        } catch (e) {
            hostError('jsonStorage unavailable, using default settings', e);
        }
    }

    await loadLog();
    void loadImageIndex();
    runTimeBasedCleanup();
    startCleanupInterval();

    const flux = getFlux();
    if (!flux || typeof flux.onFluxEventDispatched !== 'function') {
        hostError('flux API unavailable — capture disabled this session');
        toast('MessageLogger: flux unavailable', 'msglogger-start-fail');
        return;
    }

    handlersRegistered = 0;
    registerFluxHandlers(flux, cleanup);
    if (!installDeleteRewrite(getRawFluxDispatcher(), cleanup)) {
        hostError('delete rewrite unavailable — deleted messages will not stay visible');
    }
    installRowPainters(cleanup);
    installSelfDeleteBypass(cleanup);

    cleanup(() => {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        void persistLog();
        seen.clear();
        handlersRegistered = 0;
        startedAt = null;
        apiRef = null;
    });

    startedAt = Date.now();
    lastStartError = null;
    hostLog('started (Revenge Next)');
    toast('MessageLogger ' + PLUGIN_VERSION + ' started', 'msglogger-started');
    alertBox('MessageLogger ' + PLUGIN_VERSION, 'Host: Revenge (Next)\nFlux handlers: ' + handlersRegistered + '/4\nRed highlights: ' + (rowPaintersInstalled + ' painter(s)') + '\nImages cached: ' + Object.keys(imageIndex).length + '\nIf you can read this, the new build is running.');
}

async function startClassic() {
    const b: any = (typeof bunny !== 'undefined' && bunny) || {};
    const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
    apiRef = { logger: b.plugin?.logger ?? v?.logger ?? null };

    // Config + log live in the host's plugin storage (auto-persisted proxy):
    // bunny.plugin.createStorage() on the bunny manager, vendetta.plugin.storage
    // when loaded through the vendetta manager.
    try {
        if (b.plugin?.createStorage) {
            const store = b.plugin.createStorage();
            const promise = store?.[Symbol.for('bunny.storage.promise')];
            if (promise && typeof promise.then === 'function') await promise.catch(() => {});
            if (store && typeof store === 'object') {
                storageProxy = store;
                storageKind = 'bunny';
                const data = store.data && typeof store.data === 'object' ? store.data : {};
                if (!data.settings) store.data = { ...data, settings: { ...DEFAULT_SETTINGS } };
                const emitter = store[Symbol.for('vendetta.storage.emitter')];
                const off = emitter?.on?.('SET', () => {
                    try {
                        refreshClassicConfig();
                    } catch {}
                });
                if (typeof off === 'function') classicDisposers.push(off);
            }
        } else if (typeof vendetta !== 'undefined' && (vendetta as any)?.plugin?.storage) {
            const store = (vendetta as any).plugin.storage;
            if (store && typeof store === 'object') {
                storageProxy = store;
                storageKind = 'vendetta';
                if (!store.settings || typeof store.settings !== 'object') {
                    store.settings = { ...DEFAULT_SETTINGS };
                }
            }
        }
    } catch (e) {
        hostError('plugin storage unavailable, using default settings', e);
    }
    refreshClassicConfig();

    await loadLog();
    void loadImageIndex();
    runTimeBasedCleanup();
    startCleanupInterval();

    const flux = getFlux();
    if (!flux || typeof flux.onFluxEventDispatched !== 'function') {
        hostError('flux API unavailable — capture disabled this session');
        toast('MessageLogger: flux unavailable', 'msglogger-start-fail');
        return;
    }

    handlersRegistered = 0;
    registerFluxHandlers(flux, (off) => classicDisposers.push(off));
    if (!installDeleteRewrite(getRawFluxDispatcher(), (off) => classicDisposers.push(off))) {
        hostError('delete rewrite unavailable — deleted messages will not stay visible');
    }
    installRowPainters((off) => classicDisposers.push(off));
    installSelfDeleteBypass((off) => classicDisposers.push(off));

    startedAt = Date.now();
    lastStartError = null;
    hostLog('started (Revenge Classic / vendetta host)');
    toast('MessageLogger ' + PLUGIN_VERSION + ' started', 'msglogger-started');
    alertBox('MessageLogger ' + PLUGIN_VERSION, 'Host: Classic / vendetta\nStorage: ' + (storageKind ?? 'none') + '\nFlux handlers: ' + handlersRegistered + '/4\nRed highlights: ' + (rowPaintersInstalled + ' painter(s)') + '\nImages cached: ' + Object.keys(imageIndex).length + '\nIf you can read this, the new build is running.');
}

// ---- Plugin definition ----------------------------------------------------

// Constructed on first render, not at eval time (keeps eval free of any
// revenge.* access — react/RN are resolved inside makeSettingsComponent).
let _SettingsComponent: any = null;
function SettingsComponent(props: any) {
    if (hostKind !== 'next') refreshClassicConfig();
    try {
        if (!_SettingsComponent) _SettingsComponent = makeSettingsComponent();
        return _SettingsComponent(props);
    } catch (e) {
        // Never render blank silently: surface the crash as text.
        try {
            const RN: any = getRN();
            const React: any = getReact();
            if (React && RN?.Text) {
                return React.createElement(RN.Text, { style: { padding: 12 } },
                    'MessageLogger settings crashed: ' + (e instanceof Error ? e.message : String(e)));
            }
        } catch {}
        return null;
    }
}

// Assigned to globalThis.plugin so Revenge Classic's loader — which evaluates
// the script then reads `plugin?.default ?? plugin` — finds the instance.
// Revenge Next instead injects a `plugin` factory and reads <result>.default;
// when that factory exists we pass the instance through it (it registers the
// options, e.g. jsonStorage, and hands the same object back).
let __instance: any = {
    jsonStorage: {
        load: true,
        default: DEFAULT_SETTINGS,
    },
    async start(api: any) {
        try {
            if (api && typeof api === 'object' && (api.cleanup || api.jsonStorage)) {
                // Revenge Next passes the API object into start().
                hostKind = 'next';
                await startNext(api);
            } else {
                // Revenge Classic calls start() with no arguments; the API
                // comes from the `bunny` global instead.
                hostKind = 'classic';
                await startClassic();
            }
        } catch (e) {
            hostError('start failed', e);
        }
    },
    stop() {
        while (classicDisposers.length) {
            try {
                classicDisposers.pop()?.();
            } catch {}
        }
        deletedMessageMap.clear();
        editedMessageMap.clear();
        highlightCreates.clear();
        highlightEdits.clear();
        manualDeletes.clear();
        imageQueue.length = 0;
        stopCleanupInterval();
        rowPaintersInstalled = 0;
        handlersRegistered = 0;
        startedAt = null;
    },
    SettingsComponent,
};

if (typeof plugin === 'function') {
    // Revenge Next: consume the injected factory (registers the options).
    __instance = plugin(__instance);
}
globalThis.plugin = __instance;

// Vendetta-manager compat: that loader reads {onLoad, onUnload, settings}
// from the evaluated result and calls onLoad() with no arguments.
__instance.onLoad = function () {
    return __instance.start?.();
};
__instance.onUnload = function () {
    return __instance.stop?.();
};
__instance.settings = __instance.SettingsComponent;

export default globalThis.plugin;
