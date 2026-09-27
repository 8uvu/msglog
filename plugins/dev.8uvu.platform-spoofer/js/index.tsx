// PlatformSpoofer — Revenge port of Equicord's platformSpoofer.
//
// Discord renders platform icons (desktop / web / mobile / console / VR) next
// to your name based on the `browser` string in the gateway IDENTIFY
// properties. Equicord patches the identify payload on desktop; we do the
// same thing without eval-time host access: every lookup happens inside
// start(), the originals are restored on stop(), and if no gateway surface
// exists we degrade to a toast instead of crashing.
//
// Hard rules honored here (learned from MessageLogger/FakeDM):
//   - ZERO `revenge.*` access at eval time (the client kills the toggle).
//   - No CSS injection — settings UI is plain React Native components.
//   - Toasts go through ToastActionCreators.open, never revenge.ui.showToast.
//   - Hermes: children passed to createElement are always arrays/normalized.

let PLUGIN_VERSION = '1.0.0';

// ---- Host lookups (lazy, call inside start/UI render only) --------------------

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

function hostError(msg: string, e?: unknown) {
    try {
        const logger = (typeof revenge !== 'undefined' && revenge?.logger) || (typeof bunny !== 'undefined' && bunny?.plugin?.logger) || console;
        logger?.error?.('[platform-spoofer] ' + msg, e ?? '');
    } catch {}
}

// ---- Toast -------------------------------------------------------------------

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
            open({ key: 'spoofer-' + Date.now(), content: text });
            return;
        }
    } catch {}
    try {
        const RN: any = getRN();
        RN?.ToastAndroid?.show?.(text, RN?.ToastAndroid?.SHORT ?? 0);
    } catch {}
    hostError('no toast channel available');
}

// ---- Platform table ------------------------------------------------------------

// Same mapping Equicord uses: the `browser` value decides the icon Discord
// renders for you everywhere (chat, member list, profiles).
export interface PlatformDef {
    key: string;
    label: string;
    browser: string;
}

export const PLATFORMS: PlatformDef[] = [
    { key: 'desktop', label: 'Desktop', browser: 'Discord Client' },
    { key: 'web', label: 'Web', browser: 'Discord Web' },
    { key: 'android', label: 'Android', browser: 'Discord Android' },
    { key: 'ios', label: 'iOS', browser: 'Discord iOS' },
    { key: 'xbox', label: 'Xbox', browser: 'Discord Embedded' },
    { key: 'playstation', label: 'PlayStation', browser: 'Discord Embedded' },
    { key: 'vr', label: 'VR', browser: 'Discord VR' },
];

export function platformProps(key: string): { browser: string } | null {
    const p = PLATFORMS.find((x) => x.key === key);
    return p ? { browser: p.browser } : null;
}

// ---- Settings ------------------------------------------------------------------

let cfg = {
    enabled: false,
    platform: 'desktop',
};

let jsonStorageApi: any = null;

async function loadConfig() {
    try {
        const s = getStorage();
        const data = (await s?.get?.()) ?? {};
        if (data && typeof data === 'object') {
            if (typeof data.enabled === 'boolean') cfg.enabled = data.enabled;
            if (typeof data.platform === 'string' && platformProps(data.platform)) cfg.platform = data.platform;
        }
    } catch (e) {
        hostError('loadConfig failed', e);
    }
}

async function persistConfig() {
    try {
        const s = getStorage();
        await s?.set?.({ ...cfg });
    } catch (e) {
        hostError('persistConfig failed', e);
    }
}

function refreshConfigFromStorage() {
    try {
        const s = getStorage();
        const data = s?.use?.() ?? null;
        if (data && typeof data === 'object') {
            if (typeof data.enabled === 'boolean') cfg.enabled = data.enabled;
            if (typeof data.platform === 'string' && platformProps(data.platform)) cfg.platform = data.platform;
        }
    } catch {}
}

// ---- Spoof engine ----------------------------------------------------------------

// The gateway socket module exposes the identify properties. Known shapes:
//   - Discord's encoding/_doIdentify surface with `getEncodedPayload` or the
//     websocket connection options object.
//   - On RN builds the connection manager builds identify props through a
//     module exporting `getConnectionURL`/`identify` or similar.
// We probe in order and WRAP (never replace) what we find so unloading
// restores the exact original behavior.

interface Patch {
    restore: () => void;
    describe: string;
}

let activePatch: Patch | null = null;

// Merge the spoofed browser into an identify-properties object.
export function mergeIdentifyProps(original: any): any {
    if (!cfg.enabled) return original;
    const props = platformProps(cfg.platform);
    if (!props) return original;
    if (original && typeof original === 'object') {
        return { ...original, ...props };
    }
    return { ...props, os: cfg.platform };
}

function patchTarget(target: any, method: string, describe: string): Patch | null {
    try {
        const original = target?.[method];
        if (typeof original !== 'function') return null;
        const owner = target;
        let patched = original;
        // Spread so chained wrappers stay consistent.
        const wrapped = function (this: any, ...args: any[]) {
            try {
                if (cfg.enabled && args.length >= 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
                    args[0] = mergeIdentifyProps(args[0]);
                }
            } catch {}
            return original.apply(this, args);
        };
        try {
            // Preserve any attached statics (some builds memoize on the fn).
            for (const k of Object.keys(original)) {
                try { (wrapped as any)[k] = (original as any)[k]; } catch {}
            }
        } catch {}
        owner[method] = wrapped;
        patched = wrapped;
        void patched;
        return {
            describe,
            restore: () => {
                try {
                    if (owner[method] === wrapped) owner[method] = original;
                } catch {}
            },
        };
    } catch {
        return null;
    }
}

// Find candidate identify surfaces. Each candidate is {target, method, describe}.
function findIdentifySurfaces(): { target: any; method: string; describe: string }[] {
    const out: { target: any; method: string; describe: string }[] = [];
    const metro = getMetro();

    // 1) Gateway socket: `_doIdentify` lives on the socket class prototype in
    //    current builds; Equicord's find string targets the same area.
    try {
        const socket = metro?.findByProps?.('_doIdentify') ?? metro?.findByProps?.('identify', 'getGatewayIntents');
        if (socket) {
            for (const m of Object.keys(socket)) {
                if (m === '_doIdentify' || m === 'identify') {
                    out.push({ target: socket, method: m, describe: 'gateway.' + m });
                }
            }
        }
    } catch {}

    // 2) ConnectionConfig / websocket options builders.
    try {
        const conn = metro?.findByProps?.('getConnectionURL') ?? metro?.findByProps?.('connect', 'identify');
        if (conn && typeof conn.connect === 'function') {
            out.push({ target: conn, method: 'connect', describe: 'gateway.connect' });
        }
    } catch {}

    // 3) Anything exposing `properties` construction for identify (RN era).
    try {
        const propsMod = metro?.findByProps?.('getProperties', 'browser') ?? metro?.findByProps?.('getProperties', 'os');
        if (propsMod && typeof propsMod.getProperties === 'function') {
            out.push({ target: propsMod, method: 'getProperties', describe: 'gateway.getProperties' });
        }
    } catch {}

    return out;
}

function installPatch(): boolean {
    if (activePatch) return true;
    const surfaces = findIdentifySurfaces();
    // getProperties builds the props object → patch its RESULT; the others
    // receive the props object as an argument → patch the ARG.
    for (const s of surfaces) {
        const p = s.method === 'getProperties'
            ? patchResultTarget(s.target, s.method)
            : patchTarget(s.target, s.method, s.describe);
        if (p) {
            activePatch = p;
            return true;
        }
    }
    return false;
}

function uninstallPatch() {
    try {
        activePatch?.restore();
    } catch (e) {
        hostError('patch restore failed', e);
    }
    activePatch = null;
}

// For getProperties-style surfaces the wrapper must replace the RESULT, not
// the argument. patchTarget handles arg-shape; this handles result-shape.
function patchResultTarget(target: any, method: string): Patch | null {
    try {
        const original = target?.[method];
        if (typeof original !== 'function') return null;
        const owner = target;
        const wrapped = function (this: any, ...args: any[]) {
            const result = original.apply(this, args);
            try {
                if (cfg.enabled && result && typeof result === 'object' && !Array.isArray(result)) {
                    const props = platformProps(cfg.platform);
                    if (props) return { ...result, ...props };
                }
            } catch {}
            return result;
        };
        owner[method] = wrapped;
        return {
            describe: method,
            restore: () => {
                try {
                    if (owner[method] === wrapped) owner[method] = original;
                } catch {}
            },
        };
    } catch {
        return null;
    }
}

// ---- Start / stop ------------------------------------------------------------------

let cleanupFns: (() => void)[] = [];

async function startNext(api: any) {
    jsonStorageApi = api?.jsonStorage ?? getStorage();
    await loadConfig();
    if (cfg.enabled) {
        const ok = installPatch();
        if (!ok) hostError('no gateway identify surface found; spoofer inactive');
    }
}

async function stopNext() {
    uninstallPatch();
    cleanupFns.forEach((f) => {
        try { f(); } catch {}
    });
    cleanupFns = [];
}

// ---- Settings UI ---------------------------------------------------------------------

function buildSettingsComponent() {
    const React = getReact();
    const RN = getRN();
    if (!React || !RN) return null;
    const el = React.createElement;
    const { View = 'view', Text = 'text', Pressable = View, ScrollView = View, Switch = null } = RN;

    const isDark = (() => {
        try {
            const m = getMetro();
            const tm = m?.findByStoreName?.('ThemeManager') ?? m?.findByProps?.('theme', 'setTheme');
            const t = tm?.theme ?? tm?.resolvedTheme ?? tm?.currentTheme;
            if (t) return String(t).toLowerCase().includes('dark');
        } catch {}
        return true;
    })();
    const C = isDark
        ? { bg: '#111214', card: '#1a1b1e', text: '#ffffff', sub: '#9ba0a8', input: '#232428', chip: '#2b2d31', blurple: '#5865F2', danger: '#f04747', warn: '#faa61a', ok: '#23a55a' }
        : { bg: '#f2f3f5', card: '#ffffff', text: '#060607', sub: '#5c5e66', input: '#ebedef', chip: '#e3e5e8', blurple: '#5865F2', danger: '#d83c3e', warn: '#c28516', ok: '#248046' };

    function Card(props: any) {
        const kids = Array.isArray(props.children) ? props.children : props.children == null ? [] : [props.children];
        return el(View, { style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, paddingVertical: 6, marginTop: 8 } }, ...kids);
    }
    function Label(props: any) {
        return el(Text, { style: { color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 6 } }, props.children);
    }

    return function PlatformSpooferSettings(props: any) {
        if (jsonStorageApi == null && props?.api?.jsonStorage) {
            jsonStorageApi = props.api.jsonStorage;
        }
        refreshConfigFromStorage();
        const [tick, setTick] = React.useState(0);
        const kids: any[] = [];

        kids.push(el(View, { key: 'head', style: { paddingHorizontal: 14, paddingTop: 8 } },
            el(Text, { style: { color: C.text, fontSize: 16, fontWeight: '800' } }, 'PlatformSpoofer'),
            el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 2 } }, 'Spoof what device you\'re on — Discord draws the platform icon next to your name.')));

        // Ban-risk warning (Equicord shows the same).
        kids.push(el(View, { key: 'warn', style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.warn } },
            el(Text, { style: { color: C.warn, fontSize: 12, fontWeight: '700' } }, '⚠ No ban-safety guarantee'),
            el(Text, { style: { color: C.sub, fontSize: 12, marginTop: 4 } }, 'Spoofing your platform may violate Discord\'s Terms of Service. Use at your own risk.')));

        kids.push(el(View, { key: 'toggle', style: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 8 } },
            el(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
                el(Text, { style: { color: C.text, fontSize: 15, flex: 1, paddingRight: 12 } }, 'Enable spoofing'),
                Switch
                    ? el(Switch, { value: cfg.enabled, onValueChange: (v: boolean) => { cfg.enabled = v; persistConfig(); setTick((n: number) => n + 1); toast(v ? 'Spoofer on — restart Discord to apply' : 'Spoofer off'); } })
                    : el(Text, { style: { color: C.sub }, onPress: () => { cfg.enabled = !cfg.enabled; persistConfig(); setTick((n: number) => n + 1); } }, cfg.enabled ? 'On' : 'Off')),
            el(Text, { style: { color: C.sub, fontSize: 11, marginTop: 4 } }, cfg.enabled ? 'Active' : 'Disabled — nothing is patched while off')));

        kids.push(el(View, { key: 'chips', style: { marginTop: 10 } },
            el(Label, null, 'Platform'),
            (() => {
                const rows: any[] = PLATFORMS.map((p) =>
                    el(Pressable, {
                        key: p.key,
                        onPress: () => { cfg.platform = p.key; persistConfig(); setTick((n: number) => n + 1); },
                        style: { backgroundColor: cfg.platform === p.key ? C.blurple : C.chip, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
                    }, el(Text, { style: { color: cfg.platform === p.key ? '#ffffff' : C.text, fontSize: 13, fontWeight: '700' } }, p.label)));
                return el(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { paddingHorizontal: 12 } }, ...rows);
            })()));

        kids.push(el(View, { key: 'apply', style: { paddingHorizontal: 14, marginTop: 10 } },
            el(Text, { style: { color: C.sub, fontSize: 12 } }, 'Takes effect on the next gateway connect: force-close Discord and reopen after changing.'),
            (() => {
                const p = platformProps(cfg.platform);
                return el(Text, { style: { color: C.ok, fontSize: 12, marginTop: 4 } }, 'Sends browser: "' + (p ? p.browser : '—') + '"');
            })()));

        void tick;
        return el(View, { style: { flex: 1, backgroundColor: C.bg, paddingBottom: 30 } }, ...kids);
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
        if (el && RN) return el(RN.View ?? 'view', null, el(RN.Text ?? 'text', null, 'PlatformSpoofer: UI unavailable on this host'));
        return null;
    },
};

// Engine handle: verifier drives the real code paths through this.
__instance.__engine = {
    platformProps,
    mergeIdentifyProps,
    installPatch,
    uninstallPatch,
    getConfig: () => ({ ...cfg }),
    setConfig: (patch: any) => {
        if (patch && typeof patch === 'object') Object.assign(cfg, patch);
    },
    findIdentifySurfaces,
    PLATFORMS,
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
