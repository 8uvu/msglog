// MessageLogger for Revenge, by 8uvu.
// Saves deleted + edited messages to a persistent on-device file,
// flags ghost pings, and ships a searchable log viewer with export.
//
// NOTE (honest limit, same as desktop loggers): only messages that arrive
// while the app is running can be cached. Anything sent, edited or deleted
// while Discord was fully closed was never seen and cannot be recovered.
//
// HOST-COMPAT RULES (learned the hard way):
// - The client evaluates this bundle as `return <bundle>` and a throw during
//   evaluation marks the plugin "failed" and disables it (toggle bounces off).
//   Therefore: ZERO `revenge.*` property access at eval time. Every API is
//   resolved lazily inside functions, with try/catch fallbacks.
// - Do not use JSX: the jsx-runtime lives at different paths on different
//   Revenge versions (Classic: revenge.react.ReactJSXRuntime, Next:
//   revenge.react.jsxRuntime). React.createElement works everywhere.

// Ambient globals provided by the Revenge host at eval time.
declare const revenge: any;
declare const plugin: any;

interface Settings {
    enabled: boolean;
    logDeletes: boolean;
    logEdits: boolean;
    ghostPings: boolean;
    ignoreBots: boolean;
    ignoreSelf: boolean;
    maxStored: number;
    ignoredChannels: string;
    ignoredUsers: string;
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
    bot?: boolean;
}

const LOG_FILE = 'message-logger.json';

const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    logDeletes: true,
    logEdits: true,
    ghostPings: true,
    ignoreBots: true,
    ignoreSelf: false,
    maxStored: 300,
    ignoredChannels: '',
    ignoredUsers: '',
};

// ---- Lazy host accessors (never call these at eval/module time) ----------

function getReact(): any {
    try {
        const r: any = (revenge as any).react;
        return r.React || r;
    } catch {
        return null;
    }
}

function getRN(): any {
    try {
        return (revenge as any).react.ReactNative || null;
    } catch {
        return null;
    }
}

function getFlux(): any {
    try {
        return (revenge as any).discord.flux || null;
    } catch {
        return null;
    }
}

function getActions(): any {
    try {
        return (revenge as any).discord.actions || null;
    } catch {
        return null;
    }
}

function getFileModule(): any {
    try {
        return (revenge as any).discord.native.FileModule || null;
    } catch {
        return null;
    }
}

function getDesign(): any {
    try {
        const d: any = (revenge as any).discord.design;
        return (d && (d.Design || d)) || null;
    } catch {
        return null;
    }
}

function getClipboard(): any {
    try {
        return (revenge as any).externals.ReactNativeClipboard.Clipboard || null;
    } catch {
        return null;
    }
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
        ghostPings: c.ghostPings !== false,
        ignoreBots: c.ignoreBots !== false,
        ignoreSelf: !!c.ignoreSelf,
        maxStored:
            typeof c.maxStored === 'number' && c.maxStored >= 10 && c.maxStored <= 10000
                ? Math.floor(c.maxStored)
                : DEFAULT_SETTINGS.maxStored,
        ignoredChannels: typeof c.ignoredChannels === 'string' ? c.ignoredChannels : '',
        ignoredUsers: typeof c.ignoredUsers === 'string' ? c.ignoredUsers : '',
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
    try {
        apiRef?.logger?.error?.(
            '[MessageLogger] ' + msg,
            e instanceof Error ? e.message : e,
        );
    } catch {}
}

// ---- Persistence ----------------------------------------------------------

async function loadLog() {
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
    } catch {
        log = {};
        hostLog('starting with an empty log');
    }
}

async function persistLog() {
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

function currentUserId(): string {
    try {
        return String(getFlux()?.Stores?.UserStore?.getCurrentUser?.().id ?? '');
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
        authorId: String(author.id ?? ''),
        authorTag: author.globalName || author.username || 'Unknown',
        bot: !!author.bot,
        content: String(message?.content ?? ''),
        attachments: Array.isArray(message?.attachments)
            ? message.attachments
                  .map((a: any) => String(a?.url ?? a?.proxy_url ?? ''))
                  .filter(Boolean)
                  .slice(0, 3)
            : [],
        timestamp: Date.parse(message?.timestamp) || Date.now(),
        mentionsMe: me !== '' && mentionsOf(message).includes(me),
    };
}

const seen = new Map<string, ReturnType<typeof snapshotOf>>();

function toast(content: string, key: string) {
    try {
        getActions()?.ToastActionCreators?.open?.({ key, content });
    } catch {}
}

function toastGhostPing(entry: LoggedMessage) {
    let where = 'a channel';
    try {
        const ch = getFlux()?.Stores?.ChannelStore?.getChannel?.(entry.channelId);
        if (ch?.name) where = '#' + ch.name;
    } catch {}
    toast(
        'Ghost ping by ' + entry.authorTag + ' in ' + where + ': ' + entry.content.slice(0, 120),
        'msglogger-ghostping-' + entry.id,
    );
}

// ---- Flux handlers --------------------------------------------------------

function handleCreate(payload: any) {
    if (!cfg.enabled) return;
    const message = payload?.message;
    if (!message?.id) return;
    const channelId = String(message.channelId ?? message.channel_id ?? '');
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

function handleDelete(payload: any) {
    if (!cfg.enabled || !cfg.logDeletes) return;
    const id = String(payload?.message?.id ?? payload?.id ?? '');
    const channelId = String(payload?.message?.channelId ?? payload?.channelId ?? '');
    if (!id || inList(channelId, cfg.ignoredChannels)) return;
    const snap =
        seen.get(id) ??
        snapshotOf(payload?.message ?? { id, channelId }, currentUserId());
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
        status: 'deleted',
        edits: log[id]?.edits ?? [],
        mentionsMe: snap.mentionsMe,
        ghostPing: ghost,
    } as LoggedMessage;
    prune(cfg.maxStored);
    void persistLog();
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
    const id = String(message.id);
    const channelId = String(message.channelId ?? message.channel_id ?? '');
    if (inList(channelId, cfg.ignoredChannels)) return;
    const prev = seen.get(id);
    const snap = snapshotOf(message, currentUserId());
    if (cfg.ignoreBots && snap.bot) return;
    if (cfg.ignoreSelf && snap.authorId && snap.authorId === currentUserId()) return;
    if (inList(snap.authorId, cfg.ignoredUsers)) return;
    seen.set(id, snap);
    const prevContent = prev && typeof prev.content === 'string' ? prev.content : null;
    const isRealEdit = prevContent !== null && !!message.edited_timestamp && prevContent !== snap.content;
    if (!isRealEdit && !log[id]) return;
    const existing = log[id];
    log[id] = {
        ...snap,
        status: 'edited',
        edits: [
            ...(existing?.edits ?? []),
            ...(isRealEdit && prevContent !== null ? [prevContent] : []),
        ].slice(-10),
        mentionsMe: snap.mentionsMe,
        ghostPing: existing?.ghostPing ?? false,
    } as LoggedMessage;
    prune(cfg.maxStored);
    void persistLog();
}

// ---- Settings viewer (React, no JSX) ---------------------------------------

function makeSettingsComponent() {
    const React = getReact();
    if (!React) return () => null;
    const el = React.createElement.bind(React);
    const RN = getRN() || {};
    const { View = 'view', Text = 'text', TextInput = 'input', Pressable = View } = RN;

    const SwitchRowFallback = (props: any) =>
        el(
            Pressable,
            {
                onPress: () => props.onValueChange(!props.value),
                style: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                },
            },
            el(Text, { style: { flex: 1 } }, props.label),
            el(Text, { style: { opacity: 0.7, marginLeft: 8 } }, props.value ? 'On' : 'Off'),
        );

    function SwitchRow(props: any) {
        const design = getDesign();
        const Row = design?.TableSwitchRow;
        if (Row) return el(Row, props, null);
        return el(SwitchRowFallback, props, null);
    }

    function RowGroup(props: any) {
        const design = getDesign();
        const Group = design?.TableRowGroup;
        if (Group) return el(Group, { title: props.title }, ...props.children);
        return el(
            View,
            { style: { marginVertical: 8 } },
            el(Text, { style: { fontWeight: 'bold', padding: 12 } }, props.title),
            ...props.children,
        );
    }

    const DText = (props: any) => {
        const design = getDesign();
        const T = design?.Text;
        return el(T || Text, props, ...(Array.isArray(props?.children) ? props.children : [props?.children]));
    };

    return function SettingsComponent({ api }: any) {
        const settings = api?.jsonStorage?.use?.() ?? cfg;
        const [entries, setEntries] = React.useState([]);
        const [filter, setFilter] = React.useState('all');
        const [query, setQuery] = React.useState('');
        const [refreshTick, setRefreshTick] = React.useState(0);

        const reload = async () => {
            const merged: Record<string, LoggedMessage> = {};
            try {
                const raw = await getFileModule()?.readFile(logPath(), 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') Object.assign(merged, parsed);
            } catch {}
            Object.assign(merged, log);
            const list = Object.values(merged).sort((a, b) => b.timestamp - a.timestamp);
            setEntries(list.slice(0, 100));
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
                    { style: { fontWeight: filter === key ? 'bold' : 'normal' } },
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
            View,
            null,
            el(
                RowGroup,
                { title: 'MessageLogger' },
                sw('enabled', 'Enabled'),
                sw('logDeletes', 'Log deleted messages'),
                sw('logEdits', 'Log edited messages'),
                sw('ghostPings', 'Ghost ping toasts', 'Toast when a message mentioning you is deleted'),
                sw('ignoreBots', 'Ignore bot messages'),
                sw('ignoreSelf', 'Ignore your own messages'),
            ),
            el(
                RowGroup,
                { title: 'Ignored IDs' },
                el(DText, null, 'Comma-separated channel IDs never get logged.'),
                el(TextInput, {
                    placeholder: 'Channel IDs',
                    defaultValue: settings?.ignoredChannels ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ ignoredChannels: t }),
                    style: { padding: 8 },
                }),
                el(DText, null, 'Comma-separated user IDs never get logged.'),
                el(TextInput, {
                    placeholder: 'User IDs',
                    defaultValue: settings?.ignoredUsers ?? '',
                    onChangeText: (t: string) => api?.jsonStorage?.set?.({ ignoredUsers: t }),
                    style: { padding: 8 },
                }),
            ),
            el(
                RowGroup,
                { title: 'Saved log (' + visible.length + ' shown)' },
                el(View, { style: { flexDirection: 'row' } }, tab('all', 'All'), tab('deleted', 'Deleted'), tab('edited', 'Edited'), tab('ghost', 'Ghost pings')),
                el(TextInput, {
                    placeholder: 'Search author or text…',
                    value: query,
                    onChangeText: setQuery,
                    style: { padding: 8 },
                }),
                visible.length === 0
                    ? el(DText, null, 'Nothing logged yet. Deleted and edited messages will appear here.')
                    : visible.slice(0, 50).map((m: LoggedMessage) =>
                          el(
                              View,
                              { key: m.id, style: { paddingVertical: 6 } },
                              el(
                                  DText,
                                  null,
                                  '[' + (m.ghostPing ? 'GHOST PING' : m.status === 'deleted' ? 'DELETED' : 'EDITED') + '] ' + m.authorTag + ' — ' + new Date(m.timestamp).toLocaleString(),
                              ),
                              el(DText, null, m.content || '(no text content)'),
                              m.attachments.length > 0 && el(DText, null, m.attachments.length + ' attachment(s) saved as links'),
                              m.edits.length > 0 && el(DText, null, 'Previous versions: ' + m.edits.join('  |  ')),
                              el(
                                  Pressable,
                                  { onPress: () => void removeEntry(m.id), style: { paddingVertical: 4 } },
                                  el(Text, null, 'Delete entry'),
                              ),
                          ),
                      ),
            ),
            el(
                View,
                { style: { padding: 12 } },
                el(
                    Pressable,
                    { onPress: () => void exportLog(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { fontWeight: 'bold' } }, 'Copy log JSON to clipboard'),
                ),
                el(
                    Pressable,
                    { onPress: () => void clearLog(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, { style: { fontWeight: 'bold' } }, 'Clear saved log'),
                ),
                el(
                    Pressable,
                    { onPress: () => void reload(), style: { padding: 12, alignItems: 'center' } },
                    el(Text, null, 'Refresh list'),
                ),
            ),
        );
    };
}

// ---- Plugin definition ----------------------------------------------------

// Constructed on first render, not at eval time (keeps eval free of any
// revenge.* access — react/RN are resolved inside makeSettingsComponent).
let _SettingsComponent: any = null;
function SettingsComponent(props: any) {
    if (!_SettingsComponent) _SettingsComponent = makeSettingsComponent();
    return _SettingsComponent(props);
}

const index_default = plugin({
    jsonStorage: {
        load: true,
        default: DEFAULT_SETTINGS,
    },
    async start({ cleanup, jsonStorage, logger }: any) {
        apiRef = { logger };
        try {
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

            const flux = getFlux();
            if (!flux || typeof flux.onFluxEventDispatched !== 'function') {
                hostError('flux API unavailable — capture disabled this session');
                toast('MessageLogger: flux unavailable', 'msglogger-start-fail');
                return;
            }

            const register = (event: string, handler: (payload: any) => void) => {
                try {
                    cleanup(
                        flux.onFluxEventDispatched(event, (payload: any) => {
                            try {
                                handler(payload);
                            } catch (e) {
                                hostError(event + ' handler failed', e);
                            }
                            return payload;
                        }),
                    );
                    hostLog('registered ' + event);
                } catch (e) {
                    hostError('could not register ' + event, e);
                }
            };

            register('MESSAGE_CREATE', handleCreate);
            register('MESSAGE_DELETE', handleDelete);
            register('MESSAGE_DELETE_BULK', handleDeleteBulk);
            register('MESSAGE_UPDATE', handleUpdate);

            cleanup(() => {
                if (flushTimer) {
                    clearTimeout(flushTimer);
                    flushTimer = null;
                }
                void persistLog();
                seen.clear();
                apiRef = null;
            });

            hostLog('started');
        } catch (e) {
            hostError('start failed', e);
        }
    },
    SettingsComponent,
});

export default index_default;
