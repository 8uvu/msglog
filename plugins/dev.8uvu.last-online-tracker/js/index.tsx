// LastOnlineTracker — Revenge port of Esharq's lastOnlineTracker idea.
//
// Discord never shows when someone went offline. This plugin watches
// presence events and records departures it actually WITNESSED: a
// timestamp is only written for a user we saw online for at least
// MIN_ONLINE_MS this session. That guard (Esharq v3 learned it the hard
// way) is what stops guild-sync presence replays from recording an entire
// member list as "just went offline".
//
// Hard rules honored here:
//   - ZERO `revenge.*` access at eval time.
//   - Settings UI is plain React Native components that always render.
//   - Toasts via ToastActionCreators.open (+ ToastAndroid fallback).
//   - Dispatcher subscriptions are removed on stop().

const PLUGIN_VERSION = '1.5.0';

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

function getReact(api?: any): any {
    try {
        const react = api?.unscoped?.react?.React ?? api?.react?.React;
        if (react?.createElement && react?.useState) return react;
    } catch {}
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

function getRN(api?: any): any {
    try {
        const rn = api?.unscoped?.react?.ReactNative ?? api?.react?.ReactNative;
        if (rn?.View && rn?.Text) return rn;
    } catch {}
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

function findStore(name: string, props: string[], api?: any): any {
    try {
        const s = api?.unscoped?.discord?.flux?.Stores ?? api?.discord?.flux?.Stores;
        if (s?.[name]) return s[name];
    } catch {}
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

function getUserStore(api?: any): any {
    return findStore('UserStore', ['getCurrentUser'], api);
}

function getFlux(api?: any): any | null {
    try {
        const flux = api?.unscoped?.discord?.flux ?? api?.discord?.flux;
        if (typeof flux?.onFluxEventDispatched === 'function') return flux;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') {
            const flux = revenge?.discord?.flux;
            if (flux) return flux;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const flux = bunny?.api?.flux;
            if (flux?.intercept) {
                return {
                    onFluxEventDispatched: (event: string, listener: (payload: any) => any) =>
                        flux.intercept((payload: any) => payload?.type === event ? listener(payload) : undefined),
                };
            }
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            const fd = v?.metro?.common?.FluxDispatcher ?? v?.common?.FluxDispatcher;
            if (fd?.addInterceptor) {
                return {
                    onFluxEventDispatched: (event: string, listener: (payload: any) => any) =>
                        fd.addInterceptor((payload: any) => payload?.type === event ? listener(payload) : undefined),
                };
            }
        }
    } catch {}
    return null;
}

function getDispatcher(): any | null {
    try {
        const metro = getMetro();
        const fd = metro?.findByProps?.('subscribe', 'dispatch') ?? metro?.common?.FluxDispatcher ?? null;
        if (fd?.subscribe) return fd;
    } catch {}
    try {
        const flux = getFlux();
        const fd = flux?.dispatcher;
        if (fd?.subscribe) return fd;
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
// Set while the settings page is mounted so it re-renders on new departures.
let settingsChangedCb: (() => void) | null = null;

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
    settingsChangedCb?.();
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

function presenceStatus(payload: any): string | null {
    const value = payload?.status ?? payload?.presence?.status ?? payload?.user?.status;
    const raw = typeof value === 'string' ? value : value?.status;
    if (typeof raw !== 'string') return null;
    const status = raw.toLowerCase();
    return ['online', 'idle', 'dnd', 'offline', 'invisible'].includes(status) ? status : null;
}

function statusIsOnline(status: string): boolean {
    return status === 'online' || status === 'idle' || status === 'dnd';
}

let presenceEventsSeen = 0;
let departuresRecorded = 0;
let lastPresenceEventAt = 0;

export function handlePresence(payload: any): boolean {
    try {
        const userId = String(payload?.userId ?? payload?.user_id ?? payload?.user?.id ?? payload?.presence?.user?.id ?? payload?.presence?.userId ?? '');
        const status = presenceStatus(payload);
        if (!userId || !status) return false;
        const now = Date.now();
        presenceEventsSeen++;
        lastPresenceEventAt = now;
        if (statusIsOnline(status)) {
            if (!seenOnlineAt.has(userId)) seenOnlineAt.set(userId, now);
            return false;
        }
        // Offline/invisible departure: only record if we watched them online
        // long enough this session. Clear the witness on every offline edge so
        // a later reconnect starts a fresh observation window.
        const since = seenOnlineAt.get(userId);
        seenOnlineAt.delete(userId);
        if (since == null || now - since < MIN_ONLINE_MS) return false;
        const prev = lastSeenRaw[userId] ?? 0;
        if (now - prev < MIN_ONLINE_MS) return false; // debounce flapping
        lastSeenRaw[userId] = now;
        departuresRecorded++;
        if (cfg.notify) {
            const u = getUserStore()?.getUser?.(userId);
            toast((u?.globalName ?? u?.username ?? 'Someone') + ' went offline');
        }
        void persistConfig();
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
    void persistConfig();
}

// Users the presence store already reports online when we start count as
// witnessed-online from now on, so their next departure is recorded.
function seedOnlineFromStore(api?: any): number {
    try {
        const store: any = findStore('PresenceStore', ['getStatus'], api);
        const getter = typeof store?.getOnlineUserIds === 'function' ? store.getOnlineUserIds
            : typeof store?.getOnlineFriendIds === 'function' ? store.getOnlineFriendIds
            : null;
        const ids = getter ? getter.call(store) : null;
        if (!Array.isArray(ids)) return 0;
        const now = Date.now();
        let seeded = 0;
        for (const id of ids) {
            const key = String(id);
            if (!seenOnlineAt.has(key)) {
                seenOnlineAt.set(key, now);
                seeded++;
            }
        }
        return seeded;
    } catch {
        return 0;
    }
}

// ---- Presence action census ----------------------------------------------------------
//
// Subscribing to two guessed action names assumes this client dispatches those
// names as flux actions. Public sources do not confirm that for the React
// Native build (or that it dispatches presence at all), and a wrong guess fails
// silently — which is exactly how "the tracker does nothing" happens. So watch
// *every* dispatch for anything presence-shaped: either the events arrive under
// a name nobody guessed, or the plugin can say for certain that this build never
// dispatches presence, instead of staying quiet about it.

const presenceActionTypes = new Set<string>();
let presenceCensusInstalled = false;
// The same payload can reach us twice (named listener + census); ingest once.
const ingestedPayloads = new WeakSet<object>();

function looksLikePresence(type: string): boolean {
    return typeof type === 'string' && /presence/i.test(type);
}

function censusDispatch(payload: any) {
    if (!looksLikePresence(String(payload?.type ?? ''))) return;
    if (presenceActionTypes.size < 12) presenceActionTypes.add(String(payload.type));
    receivePresence(payload);
}

function installFluxCensus(api?: any): boolean {
    if (presenceCensusInstalled) return true;
    const flux: any = getFlux(api);
    try {
        if (typeof flux?.onAnyFluxEventDispatched === 'function') {
            const off = flux.onAnyFluxEventDispatched(censusDispatch);
            registerPresenceCleanup(typeof off === 'function' ? off : undefined);
            presenceCensusInstalled = true;
            return true;
        }
    } catch (e) {
        hostError('flux census failed', e);
    }
    try {
        const raw: any = getDispatcher() ?? flux?.dispatcher ?? flux;
        if (typeof raw?.addInterceptor === 'function') {
            const off = raw.addInterceptor((payload: any) => {
                censusDispatch(payload);
            });
            registerPresenceCleanup(off);
            presenceCensusInstalled = true;
            return true;
        }
    } catch (e) {
        hostError('dispatcher census failed', e);
    }
    return false;
}

// ---- Gateway frame sniffing -----------------------------------------------------------
//
// The path that does not depend on the client turning anything into a flux
// action: read presence frames off the socket as they arrive. Method names
// differ between builds and no public source pins them down, so candidates are
// probed at runtime — and every patch only OBSERVES. The original is always
// called with its own `this` and arguments, and its result is returned
// untouched, so a wrong guess cannot break the gateway.

const GATEWAY_INBOUND_METHODS = [
    '_handleMessage', '_handleMessageInternal', '_handleSocketMessage', '_handleIncomingMessage',
    'handleMessage', 'handleSocketMessage', 'onMessage', 'onSocketMessage',
    '_handleDispatch', 'handleDispatch', '_handlePayload', 'handlePayload',
    '_handleEvent', 'handleEvent', 'processMessage', '_processMessage',
];

let gatewayPatches: { owner: any; method: string; wrapped: any; original: any; describe: string }[] = [];
let gatewayHandlerCalls = 0;
let gatewayPresenceFrames = 0;
let gatewayAttempts = 0;

function gatewayCandidates(): { owner: any; method: string; describe: string }[] {
    const out: { owner: any; method: string; describe: string }[] = [];
    const owners = new Set<any>();
    const metro = getMetro();
    const push = (owner: any, describe: string) => {
        if (!owner || owners.has(owner)) return;
        owners.add(owner);
        for (const method of GATEWAY_INBOUND_METHODS) {
            try {
                if (typeof owner[method] === 'function') out.push({ owner, method, describe: describe + '.' + method });
            } catch {}
        }
    };
    try {
        // The socket class: the same area the spoofer patches for identify.
        push(metro?.findByProps?.('_doIdentify'), 'socket');
        push(metro?.findByProps?.('connect', 'getGatewayIntents'), 'socket');
    } catch {}
    for (const method of GATEWAY_INBOUND_METHODS) {
        try {
            push(metro?.findByProps?.(method), 'gateway');
        } catch {}
    }
    return out;
}

function ingestGatewayFrame(frame: any) {
    let data: any = frame;
    if (typeof frame === 'string') {
        // Cheap filter first: only parse what can possibly be a presence frame.
        if (!frame.includes('PRESENCE')) return;
        try {
            data = JSON.parse(frame);
        } catch {
            return;
        }
    } else if (frame && typeof frame.data === 'string') {
        if (!frame.data.includes('PRESENCE')) return;
        try {
            data = JSON.parse(frame.data);
        } catch {
            return;
        }
    }
    const type = String(data?.t ?? data?.type ?? '');
    if (!looksLikePresence(type)) return;
    gatewayPresenceFrames++;
    receivePresence(data?.d ?? data?.payload ?? data);
}

function installGatewaySniff(): number {
    if (gatewayPatches.length) return gatewayPatches.length;
    gatewayAttempts++;
    for (const candidate of gatewayCandidates()) {
        try {
            const original = candidate.owner[candidate.method];
            const wrapped = function (this: any, ...args: any[]) {
                try {
                    gatewayHandlerCalls++;
                    for (const arg of args) ingestGatewayFrame(arg);
                } catch {}
                return original.apply(this, args);
            };
            candidate.owner[candidate.method] = wrapped;
            gatewayPatches.push({ ...candidate, wrapped, original });
        } catch {}
    }
    return gatewayPatches.length;
}

function restoreGatewaySniff() {
    while (gatewayPatches.length) {
        const patch = gatewayPatches.pop();
        try {
            if (patch && patch.owner[patch.method] === patch.wrapped) patch.owner[patch.method] = patch.original;
        } catch {}
    }
}

// ---- Presence store polling ------------------------------------------------------------
//
// With no events and no socket surface left, a store the UI itself reads can
// still answer "who is online". Polling only ever CONFIRMS departures: an
// 'unknown' status, or a user missing from a set we never saw them in, counts as
// no information — inventing a departure is much worse than missing one.

const POLL_MS = 20_000;
const GATEWAY_RETRY_LIMIT = 12; // modules can load after the plugin does
let pollTimer: any = null;
let storePolls = 0;
let storeSeenOnline: Set<string> | null = null;
let presenceStoreLabel: string | null = null;
let lastProbeReport = '';

function presenceStore(api?: any): any {
    const found =
        findStore('PresenceStore', ['getStatus', 'getUserIds'], api) ??
        findStore('PresenceStore', ['getStatus', 'getActivities'], api) ??
        findStore('PresenceStore', ['getUserIds'], api) ??
        findStore('PresenceStore', ['getStatus'], api);
    if (found && !presenceStoreLabel) {
        const methods = ['getStatus', 'getUserIds', 'getOnlineUserIds', 'getOnlineFriendIds', 'getActivities'].filter(
            (m) => typeof found[m] === 'function',
        );
        presenceStoreLabel = 'PresenceStore' + (methods.length ? ' (' + methods.join(', ') + ')' : ' (no known methods)');
    }
    return found;
}

function readOnlineSet(store: any): Set<string> | null {
    for (const method of ['getOnlineUserIds', 'getOnlineFriendIds', 'getUserIds']) {
        try {
            const value = store?.[method]?.();
            if (Array.isArray(value)) return new Set(value.map(String));
            if (value && typeof (value as any).size === 'number') return new Set(Array.from(value as any).map(String));
        } catch {}
    }
    try {
        const map = (store?.getState?.() as any)?.clientStatuses;
        if (map && typeof map === 'object') {
            const ids = new Set<string>();
            for (const [id, status] of Object.entries(map)) {
                if (status && Object.keys(status as any).length > 0) ids.add(String(id));
            }
            if (ids.size) return ids;
        }
    } catch {}
    return null;
}

function readStatusFor(store: any, userId: string): string | null {
    try {
        const raw = store?.getStatus?.(userId);
        const status = typeof raw === 'string' ? raw.toLowerCase() : null;
        if (!status || status === 'unknown') return null;
        return status;
    } catch {}
    return null;
}

function pollPresenceStore(api?: any): number {
    storePolls++;
    const store = presenceStore(api);
    if (!store) return 0;
    let departures = 0;
    const online = readOnlineSet(store);
    if (online) {
        for (const id of online) handlePresence({ userId: id, status: 'online' });
        if (storeSeenOnline) {
            for (const id of storeSeenOnline) {
                // Seen in the set before, absent now: a witnessed departure.
                if (!online.has(id) && handlePresence({ userId: id, status: 'offline' })) departures++;
            }
        }
        storeSeenOnline = online;
        return departures;
    }
    for (const id of Array.from(seenOnlineAt.keys())) {
        const status = readStatusFor(store, id);
        if (status && handlePresence({ userId: id, status })) departures++;
    }
    return departures;
}

function startPresencePoll(api?: any) {
    stopPresencePoll();
    try {
        pollPresenceStore(api);
    } catch {}
    pollTimer = setInterval(() => {
        try {
            // Late-loading modules: keep trying for a while after startup.
            if (!gatewayPatches.length && gatewayAttempts < GATEWAY_RETRY_LIMIT) installGatewaySniff();
            pollPresenceStore(api);
        } catch {}
    }, POLL_MS);
    if (typeof pollTimer?.unref === 'function') pollTimer.unref();
}

function stopPresencePoll() {
    if (pollTimer) {
        try {
            clearInterval(pollTimer);
        } catch {}
        pollTimer = null;
    }
}

// One line a user can paste back, describing which surface (if any) works.
function probeReport(): string {
    const store = presenceStore();
    const methods = store
        ? ['getStatus', 'getUserIds', 'getOnlineUserIds', 'getOnlineFriendIds', 'getActivities'].filter((m) => typeof store?.[m] === 'function')
        : [];
    return (
        'LastOnlineTracker ' + PLUGIN_VERSION + ' probe — flux: ' + (presenceCensusInstalled ? 'census on' : 'no census') +
        ' · presence actions seen: ' + (presenceActionTypes.size ? Array.from(presenceActionTypes).join(',') : 'none') +
        ' · gateway: ' + gatewayPatches.length + ' handler(s), ' + gatewayHandlerCalls + ' call(s), ' + gatewayPresenceFrames + ' presence frame(s)' +
        ' · store: ' + (store ? methods.join(',') || 'found, no known methods' : 'not found') +
        ' · polls: ' + storePolls +
        ' · events: ' + presenceEventsSeen + ' · departures: ' + departuresRecorded
    );
}

// ---- Dispatcher hookup -------------------------------------------------------------

// Discord emits single-user PRESENCE_UPDATE and batched PRESENCE_UPDATES; we
// listen to both and accept either payload shape.
const PRESENCE_EVENTS = ['PRESENCE_UPDATE', 'PRESENCE_UPDATES'];

let presenceCleanups: (() => void)[] = [];
let cleanupApi: ((off: (() => void) | undefined) => void) | null = null;

function registerPresenceCleanup(off: (() => void) | undefined) {
    if (typeof off === 'function') {
        presenceCleanups.push(off);
        try { cleanupApi?.(off); } catch {}
    }
}

function receivePresence(payload: any) {
    if (payload && typeof payload === 'object') {
        if (ingestedPayloads.has(payload)) return;
        ingestedPayloads.add(payload);
    }
    const updates = Array.isArray(payload?.updates) ? payload.updates
        : Array.isArray(payload?.presences) ? payload.presences
        : Array.isArray(payload?.users) ? payload.users
        : Array.isArray(payload) ? payload
        : [payload];
    for (const item of updates) {
        const id = item?.user?.id ?? item?.userId ?? item?.user_id;
        const clientStatus = item?.clientStatus ?? item?.client_status ?? null;
        // Prefer the explicit status; fall back to an active client as "online".
        const status = typeof item?.status === 'string' ? item.status
            : clientStatus && Object.keys(clientStatus).length ? 'online'
            : null;
        if (id && status) handlePresence({ userId: String(id), status });
    }
    settingsChangedCb?.();
}

function subscribePresence(api?: any): boolean {
    if (presenceCleanups.length) return true;
    const flux = getFlux(api);
    const fd = getDispatcher();
    let installed = 0;
    for (const event of PRESENCE_EVENTS) {
        const listener = (payload: any) => {
            receivePresence(payload);
            return payload;
        };
        try {
            if (typeof flux?.onFluxEventDispatched === 'function') {
                const off = flux.onFluxEventDispatched(event, listener);
                if (typeof off === 'function') {
                    registerPresenceCleanup(off);
                    installed++;
                    continue;
                }
                if (typeof flux.removeFluxEventListener === 'function') {
                    registerPresenceCleanup(() => flux.removeFluxEventListener(event, listener));
                    installed++;
                    continue;
                }
            }
        } catch (e) {
            hostError('Revenge flux ' + event + ' hook failed', e);
        }
        try {
            if (typeof flux?.intercept === 'function') {
                const off = flux.intercept((payload: any) => {
                    if (payload?.type === event) return listener(payload);
                    return undefined;
                });
                if (typeof off === 'function') {
                    registerPresenceCleanup(off);
                    installed++;
                    continue;
                }
            }
        } catch (e) {
            hostError('flux interceptor ' + event + ' hook failed', e);
        }
        try {
            if (fd?.subscribe) {
                fd.subscribe(event, listener);
                registerPresenceCleanup(() => fd.unsubscribe?.(event, listener));
                installed++;
            }
        } catch (e) {
            hostError('subscribe ' + event + ' failed', e);
        }
    }
    return installed > 0;
}

function unsubscribePresence() {
    while (presenceCleanups.length) {
        try { presenceCleanups.pop()?.(); } catch {}
    }
}

// ---- Start / stop ---------------------------------------------------------------------

let cleanupFns: (() => void)[] = [];

async function startNext(api: any) {
    // Revenge stops AND DISABLES a plugin whose lifecycle throws, which would
    // hide its settings page entirely. Every startup failure stays contained.
    try {
        await startPlugin(api);
    } catch (e) {
        hostError('start failed', e);
    }
}

async function startPlugin(api: any) {
    jsonStorageApi = api?.jsonStorage ?? getStorage();
    cleanupApi = typeof api?.cleanup === 'function' ? api.cleanup : null;
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
    // Three independent ways to see presence, because a single guessed API can
    // simply not exist on a given build and fail silently.
    const named = subscribePresence(api);
    const census = installFluxCensus(api);
    const gateway = installGatewaySniff();
    seedOnlineFromStore(api);
    startPresencePoll(api);
    if (!named && !census && !gateway) hostError('no presence surface found; tracking is inactive');
}

async function stopNext() {
    unsubscribePresence();
    stopPresencePoll();
    restoreGatewaySniff();
    cleanupFns.forEach((f) => {
        try { f(); } catch {}
    });
    cleanupFns = [];
    await persistConfig();
    cleanupApi = null;
    settingsChangedCb = null;
}

// ---- Settings UI -------------------------------------------------------------------------

function relTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
    return Math.floor(diff / 86_400_000) + 'd ago';
}

// Discord's theme store decides light vs dark colors; default dark.
function isDarkTheme(): boolean {
    try {
        const tm = getMetro()?.findByProps?.('theme', 'setTheme');
        const t = tm?.theme ?? tm?.resolvedTheme ?? tm?.currentTheme;
        if (t) return String(t).toLowerCase().includes('dark');
    } catch {}
    return true;
}

// Discord's own design components give the settings page Discord's native look.
// They are resolved lazily (never at eval time) so the host cannot kill us.
function resolveDesign(api?: any): any {
    const candidates: any[] = [api?.design, api?.discord?.design, api?.unscoped?.discord?.design, api?.unscoped?.design];
    for (const candidate of candidates) {
        try {
            const d = candidate?.Design ?? candidate;
            if (d && (d.TableRowGroup || d.TableSwitchRow || d.TableRow)) return d;
        } catch {}
    }
    try {
        const g: any = (globalThis as any).revenge?.discord?.design;
        const d = g?.Design ?? g;
        if (d && (d.TableRowGroup || d.TableSwitchRow || d.TableRow)) return d;
    } catch {}
    try {
        const b: any = (globalThis as any).bunny?.ui;
        if (b?.FormTableRowGroup) return b;
    } catch {}
    return null;
}

function buildSettingsComponent(api: any) {
    const React = getReact(api);
    if (!React?.createElement || typeof React.useState !== 'function') return null;
    const el = React.createElement;
    const RN: any = getRN(api) ?? {};
    const View = RN.View ?? 'view';
    const Text = RN.Text ?? 'text';
    const Pressable = RN.Pressable ?? View;
    const ScrollView = RN.ScrollView ?? View;
    const Switch = RN.Switch ?? null;
    const C = isDarkTheme()
        ? { text: '#ffffff', sub: '#9ba0a8', card: '#1a1b1e', accent: '#5865F2', danger: '#f04747' }
        : { text: '#060607', sub: '#5c5e66', card: '#ffffff', accent: '#5865F2', danger: '#d83c3e' };
    const kids = (c: any) => (Array.isArray(c) ? c : c == null ? [] : [c]);
    const D = resolveDesign(api);

    function Group(props: any) {
        if (D?.TableRowGroup) {
            return el(D.TableRowGroup, { title: props.title, description: props.description }, ...kids(props.children));
        }
        return el(View, { style: { marginTop: 16 } },
            el(Text, { style: { color: C.text, fontSize: 15, fontWeight: '600', paddingHorizontal: 16, marginBottom: 4 } }, props.title),
            props.description ? el(Text, { style: { color: C.sub, fontSize: 13, paddingHorizontal: 16, marginBottom: 6 } }, props.description) : null,
            el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 4 } }, ...kids(props.children)));
    }

    function ToggleRow(props: any) {
        if (D?.TableSwitchRow) {
            return el(D.TableSwitchRow, {
                label: props.label,
                subLabel: props.subLabel,
                value: !!props.value,
                onValueChange: props.onValueChange,
            });
        }
        const control = Switch
            ? el(Switch, {
                value: !!props.value,
                onValueChange: props.onValueChange,
                accessibilityLabel: props.label,
                trackColor: { false: 'rgba(128,128,128,0.35)', true: C.accent },
                thumbColor: '#ffffff',
            })
            : el(Text, {
                accessibilityLabel: props.label,
                style: { color: C.accent, fontWeight: '700' },
                onPress: () => props.onValueChange(!props.value),
            }, props.value ? 'On' : 'Off');
        return el(View, { style: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 } },
            el(View, { style: { flex: 1, paddingRight: 12 } },
                el(Text, { style: { color: C.text, fontSize: 16 } }, props.label),
                props.subLabel ? el(Text, { style: { color: C.sub, fontSize: 13, marginTop: 2 } }, props.subLabel) : null),
            control);
    }

    function InfoRow(props: any) {
        if (D?.TableRow) {
            return el(D.TableRow, {
                label: props.label,
                subLabel: props.subLabel,
                variant: props.danger ? 'danger' : undefined,
                onPress: props.onPress,
            });
        }
        return el(Pressable, {
            onPress: props.onPress,
            accessibilityLabel: props.label,
            style: { paddingVertical: 10, paddingHorizontal: 16 },
        },
            el(Text, { style: { color: props.danger ? C.danger : C.text, fontSize: 16 } }, props.label),
            props.subLabel ? el(Text, { style: { color: C.sub, fontSize: 13, marginTop: 2 } }, props.subLabel) : null);
    }

    return function LastOnlineSettings(props: any) {
        const settingsApi = props?.api ?? api;
        const storage = settingsApi?.jsonStorage ?? jsonStorageApi;
        jsonStorageApi = storage;
        const [, force] = React.useState(0);
        React.useEffect(() => {
            settingsChangedCb = () => force((n: number) => n + 1);
            return () => {
                settingsChangedCb = null;
            };
        }, []);
        let stored: any = {};
        try {
            stored = storage?.use?.() ?? storage?.cache ?? {};
        } catch {
            stored = storage?.cache ?? {};
        }
        // The in-memory history is authoritative; storage only drives the toggles.
        const persist = typeof stored?.persist === 'boolean' ? stored.persist : cfg.persist;
        const notify = typeof stored?.notify === 'boolean' ? stored.notify : cfg.notify;
        const entries = Object.entries(getLastSeen())
            .filter(([, ts]) => typeof ts === 'number' && ts > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 80)
            .map(([id, ts]) => {
                const user = getUserStore(settingsApi)?.getUser?.(id);
                return { id, ts, name: String(user?.globalName ?? user?.global_name ?? user?.username ?? 'User ' + id) };
            });
        const tracking = presenceCleanups.length > 0;

        return el(ScrollView, { contentContainerStyle: { paddingBottom: 24 } },
            el(Group, { title: 'LastOnlineTracker', description: 'Records when friends go offline, from presence changes this plugin witnessed.' },
                el(ToggleRow, {
                    label: 'Keep last-seen times across restarts',
                    subLabel: 'Save recorded departures on this device.',
                    value: persist,
                    onValueChange: (value: boolean) => {
                        cfg.persist = value;
                        void storage?.set?.({ persist: value, lastSeen: value ? getLastSeen() : {} });
                        settingsChangedCb?.();
                    },
                }),
                el(ToggleRow, {
                    label: 'Offline notifications',
                    subLabel: 'Show a notification when someone goes offline.',
                    value: notify,
                    onValueChange: (value: boolean) => {
                        cfg.notify = value;
                        void storage?.set?.({ notify: value });
                        settingsChangedCb?.();
                    },
                })),
            el(Group, { title: 'Last online', description: 'Only departures observed after at least 15 seconds online are recorded.' },
                ...(entries.length
                    ? entries.map((entry) => el(InfoRow, {
                        key: entry.id,
                        label: entry.name,
                        subLabel: 'Offline ' + relTime(entry.ts),
                    }))
                    : [el(InfoRow, {
                        key: 'empty',
                        label: 'No departures recorded yet',
                        subLabel: tracking
                            ? 'Tracking is active; this list fills as friends go offline.'
                            : 'Tracking is inactive — open Detection below to see which presence source this build exposes.',
                    })])),
            el(Group, { title: 'Detection', description: 'Which presence sources this build actually exposes. Nothing here means the list cannot fill.' },
                el(InfoRow, {
                    label: 'Version ' + PLUGIN_VERSION,
                    subLabel: 'If this is not the version you installed, the new build did not load.',
                }),
                el(InfoRow, {
                    label: 'Flux presence listeners',
                    subLabel: presenceCleanups.length
                        ? 'installed (' + (presenceCensusInstalled ? 'watching every dispatch' : 'named events only') + ')'
                        : 'not installed — this host exposes no flux hook',
                }),
                el(InfoRow, {
                    label: 'Presence actions seen',
                    subLabel: presenceActionTypes.size
                        ? Array.from(presenceActionTypes).join(', ')
                        : 'none yet — presence may not be dispatched to plugins on this build',
                }),
                el(InfoRow, {
                    label: 'Gateway socket',
                    subLabel: gatewayPatches.length
                        ? gatewayPatches.length + ' handler(s) watched · ' + gatewayHandlerCalls + ' call(s) · ' + gatewayPresenceFrames + ' presence frame(s)'
                        : 'no inbound handler found' + (gatewayAttempts >= GATEWAY_RETRY_LIMIT ? ' (gave up)' : ' (still retrying)'),
                }),
                el(InfoRow, {
                    label: 'Presence store',
                    subLabel: presenceStoreLabel ?? 'not found' + (pollTimer ? ' · polling every ' + Math.round(POLL_MS / 1000) + 's' : ' · polling off'),
                }),
                el(InfoRow, {
                    label: 'Run presence probe',
                    subLabel: 'Re-check every source above now',
                    onPress: () => {
                        presenceStoreLabel = null;
                        installFluxCensus(settingsApi);
                        if (!gatewayPatches.length) installGatewaySniff();
                        pollPresenceStore(settingsApi);
                        lastProbeReport = probeReport();
                        toast(lastProbeReport);
                        settingsChangedCb?.();
                    },
                }),
                lastProbeReport ? el(InfoRow, { label: 'Last probe', subLabel: lastProbeReport }) : null),
            el(Group, { title: 'History controls' },
                el(InfoRow, {
                    label: 'Clear last-online history',
                    subLabel: 'Remove every saved departure from this device.',
                    danger: true,
                    onPress: () => { clearLastSeen(); },
                }),
                el(InfoRow, {
                    label: tracking ? 'Tracking active' : 'Tracking inactive',
                    subLabel: `${presenceEventsSeen} presence updates · ${departuresRecorded} departures recorded`,
                })));
    };
}

let __builtSettings: any = null;

let __instance: any = {
    jsonStorage: { load: true, default: { persist: true, notify: false, lastSeen: {} } },
    start: startNext,
    stop: stopNext,
    SettingsComponent: function (props: any) {
        const api = props?.api ?? jsonStorageApi ?? null;
        const React = getReact(api);
        if (!React?.createElement) return null;
        try {
            if (!__builtSettings) __builtSettings = buildSettingsComponent(api);
            if (__builtSettings) return React.createElement(__builtSettings, { api });
        } catch (e) {
            hostError('settings build failed', e);
        }
        const RN: any = getRN(api) ?? {};
        return React.createElement(RN.Text ?? 'text', null, 'LastOnlineTracker settings could not load on this build.');
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
    getDiagnostics: () => ({
        subscribed: presenceCleanups.length > 0,
        eventsSeen: presenceEventsSeen,
        departuresRecorded,
        lastEventAt: lastPresenceEventAt,
        censusInstalled: presenceCensusInstalled,
        presenceActionTypes: Array.from(presenceActionTypes),
        gatewayHandlers: gatewayPatches.length,
        gatewayHandlerCalls,
        gatewayPresenceFrames,
        storeLabel: presenceStoreLabel,
        storePolls,
        polling: !!pollTimer,
    }),
    probeReport,
    pollPresenceStore,
    installGatewaySniff,
    ingestGatewayFrame,
    censusDispatch,
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
__instance.settingsComponentLazy = __instance.SettingsComponent;

export default __instance;
