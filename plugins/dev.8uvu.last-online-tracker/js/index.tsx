// LastOnlineTracker — Revenge port of Esharq's lastOnlineTracker idea.
//
// Discord never shows when someone went offline. This plugin watches
// PRESENCE_UPDATE events and records departures it actually WITNESSED: a
// timestamp is only written for a user we saw online for at least
// MIN_ONLINE_MS this session. That guard (Esharq v3 learned it the hard
// way) is what stops guild-sync presence replays from recording an entire
// member list as "just went offline".
//
// Hard rules honored here:
//   - ZERO `revenge.*` access at eval time.
//   - Settings UI is plain React Native components, Hermes-safe children.
//   - Toasts via ToastActionCreators.open (+ ToastAndroid fallback).
//   - Dispatcher subscriptions are removed on stop().

let PLUGIN_VERSION = '1.0.0';

// ---- Host lookups (lazy) -------------------------------------------------------

function getMetro(): any {
    try {
        if (typeof revenge !== 'undefined') return revenge?.metro ?? revenge?.internal?.metro ?? null;
    } catch {}
    try {
        if (typeof bunny !== 'undefined') return bunny?.metro ?? null;
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') return vendetta?.metro ?? null;
    } catch {}
    return null;
}

function getReact(): any {
    try {
        const m = getMetro();
        const r = m?.findByDisplayName?.('React') ?? m?.findByProps?.('createElement', 'cloneElement') ?? null;
        if (r) return r;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') return revenge?.react?.React ?? null;
    } catch {}
    return null;
}

function getRN(): any {
    try {
        const m = getMetro();
        const rn = m?.findByDisplayName?.('ReactNative') ?? m?.findByProps?.('View', 'Text', 'TextInput') ?? null;
        if (rn) return rn;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') return revenge?.react?.ReactNative ?? null;
    } catch {}
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
    return null;
}

function getUserStore(): any {
    return findStore('UserStore', ['getCurrentUser']);
}

function getDispatcher(): any | null {
    try {
        const metro = getMetro();
        const fd = metro?.findByProps?.('subscribe', 'dispatch') ?? metro?.common?.FluxDispatcher ?? null;
        if (fd?.dispatch) return fd;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') {
            const fd = revenge?.discord?.flux?.dispatcher;
            if (fd?.dispatch) return fd;
        }
    } catch {}
    return null;
}

function getStorage(): any {
    try {
        if (typeof revenge !== 'undefined') return revenge?.plugin?.jsonStorage ?? revenge?.api?.jsonStorage ?? null;
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
            const a = b.metro?.common?.toasts || b.api?.actions?.ToastActionCreators;
            if (a) return a;
        }
    } catch {}
    return null;
}

function toast(content: string) {
    const text = String(content ?? '');
    try {
        const actions: any = getActions();
        const open = actions?.ToastActionCreators?.open ?? actions?.open;
        if (typeof open === 'function') {
            open({ key: 'lot-' + Date.now(), content: text });
            return;
        }
    } catch {}
    try {
        const RN: any = getRN();
        RN?.ToastAndroid?.show?.(text, RN?.ToastAndroid?.SHORT ?? 0);
    } catch {}
}

function hostError(msg: string, e?: unknown) {
    try {
        const logger = (typeof revenge !== 'undefined' && revenge?.logger) || (typeof bunny !== 'undefined' && bunny?.plugin?.logger) || console;
        logger?.error?.('[last-online-tracker] ' + msg, e ?? '');
    } catch {}
}

// ---- Config -----------------------------------------------------------------------

let cfg = {
    persist: true,      // keep last-seen times across restarts
    notify: false,      // toast when a tracked friend goes offline
};

let jsonStorageApi: any = null;

async function loadConfig() {
    try {
        const data = (await jsonStorageApi?.get?.()) ?? {};
        if (data && typeof data === 'object') {
            if (typeof data.persist === 'boolean') cfg.persist = data.persist;
            if (typeof data.notify === 'boolean') cfg.notify = data.notify;
        }
    } catch (e) {
        hostError('loadConfig failed', e);
    }
}

async function persistConfig() {
    try {
        await jsonStorageApi?.set?.({ ...cfg, lastSeen: cfg.persist ? lastSeenRaw : {} });
    } catch (e) {
        hostError('persistConfig failed', e);
    }
}

// ---- Tracking state ------------------------------------------------------------------

// How long we must have watched somebody be online before their going
// offline counts as a real departure. Opening a guild replays presences for
// its whole member list in one burst; a genuine departure never happens
// within moments of us first seeing the person. (Guard copied concept from
// Esharq's v3 fix.)
const MIN_ONLINE_MS = 15_000;

// userId -> timestamp the user was recorded going offline.
const lastSeenRaw: Record<string, number> = {};
// userId -> when we first saw them online this session.
const seenOnlineAt = new Map<string, number>();

function statusIsOnline(status: unknown): boolean {
    // PRESENCE_UPDATE carries `status` as a string on current builds
    // ('online' | 'idle' | 'dnd' | 'offline'); older shapes nest it.
    const s = typeof status === 'string' ? status : (status as any)?.status;
    return s === 'online' || s === 'idle' || s === 'dnd';
}

export function handlePresence(payload: any): boolean {
    try {
        const userId = String(payload?.userId ?? payload?.user?.id ?? '');
        if (!userId) return false;
        const online = statusIsOnline(payload?.status);
        const now = Date.now();
        if (online) {
            if (!seenOnlineAt.has(userId)) seenOnlineAt.set(userId, now);
            return false;
        }
        // Offline/invisible departure: only record if we watched them online
        // long enough this session.
        const since = seenOnlineAt.get(userId);
        if (since == null || now - since < MIN_ONLINE_MS) return false;
        const prev = lastSeenRaw[userId] ?? 0;
        if (now - prev < MIN_ONLINE_MS) return false; // debounce flapping
        lastSeenRaw[userId] = now;
        if (cfg.notify) {
            const u = getUserStore()?.getUser?.(userId);
            toast((u?.globalName ?? u?.username ?? 'Someone') + ' went offline');
        }
        persistConfig();
        return true;
    } catch {
        return false;
    }
}

export function getLastSeen(): Record<string, number> {
    return { ...lastSeenRaw };
}

export function clearLastSeen() {
    for (const k of Object.keys(lastSeenRaw)) delete lastSeenRaw[k];
    persistConfig();
}

// ---- Dispatcher hookup -------------------------------------------------------------

let subscribed = false;
let presenceHandler: ((p: any) => void) | null = null;

function subscribePresence(): boolean {
    try {
        const fd = getDispatcher();
        if (!fd?.subscribe) return false;
        presenceHandler = (p: any) => {
            try { handlePresence(p); } catch {}
        };
        fd.subscribe('PRESENCE_UPDATE', presenceHandler);
        subscribed = true;
        return true;
    } catch (e) {
        hostError('subscribePresence failed', e);
        return false;
    }
}

function unsubscribePresence() {
    try {
        if (subscribed && presenceHandler) {
            getDispatcher()?.unsubscribe?.('PRESENCE_UPDATE', presenceHandler);
        }
    } catch {}
    subscribed = false;
    presenceHandler = null;
}

// ---- Start / stop ---------------------------------------------------------------------

let cleanupFns: (() => void)[] = [];

async function startNext(api: any) {
    jsonStorageApi = api?.jsonStorage ?? getStorage();
    await loadConfig();
    // Restore persisted last-seen times (only when persist is on; the
    // timestamps hold, the session witness maps do NOT — a restart means we
    // haven't watched anyone yet).
    try {
        const data = (await jsonStorageApi?.get?.()) ?? {};
        if (cfg.persist && data?.lastSeen && typeof data.lastSeen === 'object') {
            for (const [k, v] of Object.entries(data.lastSeen)) {
                if (typeof v === 'number' && v > 0) lastSeenRaw[k] = v;
            }
        }
    } catch (e) {
        hostError('restore lastSeen failed', e);
    }
    subscribePresence();
}

async function stopNext() {
    unsubscribePresence();
    cleanupFns.forEach((f) => {
        try { f(); } catch {}
    });
    cleanupFns = [];
    await persistConfig();
}

// ---- Settings UI -------------------------------------------------------------------------

function relTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
    return Math.floor(diff / 86_400_000) + 'd ago';
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
        ? { bg: '#111214', card: '#1a1b1e', text: '#ffffff', sub: '#9ba0a8', input: '#232428', chip: '#2b2d31', blurple: '#5865F2', danger: '#f04747', ok: '#23a55a' }
        : { bg: '#f2f3f5', card: '#ffffff', text: '#060607', sub: '#5c5e66', input: '#ebedef', chip: '#e3e5e8', blurple: '#5865F2', danger: '#d83c3e', ok: '#248046' };

    function Card(props: any) {
        const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
        return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
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
        return el(Pressable, { onPress: props.onPress, style: [{ backgroundColor: props.danger ? C.danger : C.blurple, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 2 }, props.style] },
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

    return function LastOnlineSettings(props: any) {
        if (jsonStorageApi == null && props?.api?.jsonStorage) {
            jsonStorageApi = props.api.jsonStorage;
        }
        const [, force] = React.useState(0);
        const [q, setQ] = React.useState('');

        const entries = Object.entries(getLastSeen())
            .map(([id, ts]) => {
                const u = getUserStore()?.getUser?.(id);
                return { id, ts, name: String(u?.globalName ?? u?.global_name ?? u?.username ?? 'ID ' + id) };
            })
            .filter((e) => !q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase()))
            .sort((a, b) => b.ts - a.ts);

        const kids: any[] = [
            el(View, { key: 'head', style: { paddingHorizontal: 14, paddingTop: 8 } },
                el(Text, { style: { color: C.text, fontSize: 16, fontWeight: '800' } }, 'LastOnlineTracker'),
                el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, 'Records when people go offline — departures you actually saw. Discord never shows this.'),
                el(Text, { style: { color: C.sub, fontSize: 11, marginTop: 4 } }, 'A timestamp is only written after watching someone online for 15s+, so opening a server can\'t fake an exodus.')),
        ];

        kids.push(el(View, { key: 'search', style: { paddingHorizontal: 14, marginTop: 8 } },
            el(Label, null, 'Search recorded people'),
            el(Input, { placeholder: 'name…', value: q, onChangeText: (t: string) => setQ(t) })));

        kids.push(el(Card, { key: 'list' },
            entries.length === 0
                ? el(Text, { style: { color: C.sub, fontSize: 13, paddingHorizontal: 14, paddingVertical: 10 } }, 'Nobody recorded yet — it fills as you watch friends go offline.')
                : entries.slice(0, 80).map((e) =>
                    el(View, { key: e.id, style: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.input, flexDirection: 'row', justifyContent: 'space-between' } },
                        el(Text, { style: { color: C.text, fontSize: 14, flex: 1 } }, e.name),
                        el(Text, { style: { color: C.sub, fontSize: 13 } }, 'offline ' + relTime(e.ts))))));

        kids.push(el(Card, { key: 'opts' },
            el(SwitchRow, { label: 'Keep last-seen times across restarts', value: cfg.persist, onValueChange: (v: boolean) => { cfg.persist = v; persistConfig(); force((n: number) => n + 1); } }),
            el(SwitchRow, { label: 'Toast when someone goes offline', value: cfg.notify, onValueChange: (v: boolean) => { cfg.notify = v; persistConfig(); force((n: number) => n + 1); } })));

        kids.push(el(View, { key: 'clear', style: { paddingHorizontal: 12, marginTop: 8 } },
            el(Btn, {
                label: 'Clear all recorded times', danger: true,
                onPress: () => { clearLastSeen(); force((n: number) => n + 1); toast('Last-seen times cleared'); },
            })));

        return el(ScrollView, { style: { flex: 1, backgroundColor: C.bg } }, ...kids);
    };
}

let __builtSettings: any = null;

let __instance: any = {
    start: startNext,
    stop: stopNext,
    settingsComponentLazy: function (props: any) {
        try {
            if (!__builtSettings) __builtSettings = buildSettingsComponent();
            if (__builtSettings) return __builtSettings(props);
        } catch (e) {
            hostError('settings build failed', e);
        }
        const React = getReact();
        const RN = getRN();
        const el = React?.createElement;
        if (el && RN) return el(RN.View ?? 'view', null, el(RN.Text ?? 'text', null, 'LastOnlineTracker: UI unavailable on this host'));
        return null;
    },
};

__instance.__engine = {
    handlePresence,
    getLastSeen,
    clearLastSeen,
    getConfig: () => ({ ...cfg }),
    setConfig: (patch: any) => {
        if (patch && typeof patch === 'object') Object.assign(cfg, patch);
    },
    MIN_ONLINE_MS,
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
__instance.settings = __instance.settingsComponentLazy;

export default __instance;
