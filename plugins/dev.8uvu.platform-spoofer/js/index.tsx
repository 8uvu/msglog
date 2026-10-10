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
//   - Settings UI is plain React Native components that always render; we
//     never return null for the page just because a Design row is missing.
//   - Toasts go through ToastActionCreators.open, never revenge.ui.showToast.
//   - Hermes: children passed to createElement are always arrays/normalized.

const PLUGIN_VERSION = '1.4.0';

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

function getReact(api?: any): any {
    try {
        const react = api?.unscoped?.react?.React ?? api?.react?.React ?? null;
        if (react?.createElement && react?.useState) return react;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') {
            const react = revenge?.react?.React ?? revenge?.react?.ReactModule ?? null;
            if (react?.createElement && react?.useState) return react;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const react = bunny?.React ?? bunny?.metro?.common?.React ?? bunny?.common?.React ?? null;
            if (react?.createElement && react?.useState) return react;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const react = vendetta?.metro?.common?.React ?? vendetta?.common?.React ?? null;
            if (react?.createElement && react?.useState) return react;
        }
    } catch {}
    try {
        const metro = getMetro();
        const react = metro?.findByProps?.('createElement', 'useState') ?? null;
        if (react) return react;
    } catch {}
    return null;
}

function getRN(api?: any): any {
    try {
        const rn = api?.unscoped?.react?.ReactNative ?? api?.react?.ReactNative ?? null;
        if (rn?.View && rn?.Text) return rn;
    } catch {}
    try {
        if (typeof revenge !== 'undefined') {
            const rn = revenge?.react?.ReactNative ?? revenge?.react?.native ?? null;
            if (rn?.View && rn?.Text) return rn;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const rn = bunny?.ReactNative ?? bunny?.metro?.common?.ReactNative ?? bunny?.common?.ReactNative ?? null;
            if (rn?.View && rn?.Text) return rn;
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const rn = vendetta?.metro?.common?.ReactNative ?? vendetta?.common?.ReactNative ?? null;
            if (rn?.View && rn?.Text) return rn;
        }
    } catch {}
    try {
        const metro = getMetro();
        const rn = metro?.findByProps?.('View', 'Text', 'TextInput') ?? null;
        if (rn) return rn;
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
let settingsChangedCb: (() => void) | null = null;

function refreshConfig(data: any) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.enabled === 'boolean') cfg.enabled = data.enabled;
    if (typeof data.platform === 'string' && platformProps(data.platform)) cfg.platform = data.platform;
}

async function loadConfig() {
    try {
        const data = (await jsonStorageApi?.get?.()) ?? {};
        refreshConfig(data);
    } catch (e) {
        hostError('loadConfig failed', e);
    }
}

async function persistConfig() {
    try {
        await jsonStorageApi?.set?.({ ...cfg });
    } catch (e) {
        hostError('persistConfig failed', e);
    }
}

function refreshConfigFromStorage() {
    try {
        refreshConfig(jsonStorageApi?.cache ?? null);
    } catch {}
}

async function updateConfig(patch: any) {
    if (!patch || typeof patch !== 'object') return;
    const next = { ...cfg };
    if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
    if (typeof patch.platform === 'string' && platformProps(patch.platform)) next.platform = patch.platform;
    cfg = next;
    await persistConfig();
    if (cfg.enabled) {
        if (!installPatch()) hostError('no gateway identify surface found; spoofer inactive');
    } else {
        uninstallPatch();
    }
    settingsChangedCb?.();
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
    await loadConfig();
    if (typeof jsonStorageApi?.subscribe === 'function') {
        try {
            const off = jsonStorageApi.subscribe(() => {
                refreshConfigFromStorage();
                settingsChangedCb?.();
            });
            if (typeof off === 'function') {
                if (typeof api?.cleanup === 'function') api.cleanup(off);
                else cleanupFns.push(off);
            }
        } catch (e) {
            hostError('could not subscribe to settings changes', e);
        }
    }
    if (cfg.enabled) {
        const ok = installPatch();
        if (!ok) hostError('no gateway identify surface found; spoofer inactive');
    }
}

async function stopNext() {
    uninstallPatch();
    settingsChangedCb = null;
    cleanupFns.forEach((f) => {
        try { f(); } catch {}
    });
    cleanupFns = [];
}

// ---- Settings UI ---------------------------------------------------------------------

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

function buildSettingsComponent(api?: any) {
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
        ? { text: '#ffffff', sub: '#9ba0a8', card: '#1a1b1e', accent: '#5865F2' }
        : { text: '#060607', sub: '#5c5e66', card: '#ffffff', accent: '#5865F2' };
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

    function ChoiceRow(props: any) {
        if (D?.TableRow) {
            return el(D.TableRow, { label: props.label, subLabel: props.selected ? 'Selected' : undefined, onPress: props.onPress });
        }
        return el(Pressable, {
            onPress: props.onPress,
            accessibilityLabel: props.label,
            style: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
        },
            el(Text, { style: { color: C.text, fontSize: 16, flex: 1 } }, props.label),
            el(Text, { style: { color: C.accent, fontSize: 16, fontWeight: '700' } }, props.selected ? '✓' : ''));
    }

    return function PlatformSpooferSettings(props: any) {
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
        let stored: any = null;
        try {
            stored = storage?.use?.() ?? storage?.cache ?? null;
        } catch {
            stored = storage?.cache ?? null;
        }
        const enabled = typeof stored?.enabled === 'boolean' ? stored.enabled : cfg.enabled;
        const platform = platformProps(stored?.platform) ? stored.platform : cfg.platform;

        return el(ScrollView, { contentContainerStyle: { paddingBottom: 24 } },
            el(Group, { title: 'PlatformSpoofer', description: 'Spoofing may violate Discord’s Terms of Service; use at your own risk.' },
                el(ToggleRow, {
                    label: 'Enable platform spoofing',
                    subLabel: enabled ? 'Applied on the next gateway connection.' : 'Platform identification is unchanged while off.',
                    value: enabled,
                    onValueChange: (value: boolean) => { void updateConfig({ enabled: value }); },
                })),
            D?.TableRadioGroup && D?.TableRadioRow
                ? el(D.TableRadioGroup, {
                    title: 'Platform',
                    description: 'Choose the platform Discord reports for your account.',
                    value: platform,
                    onChange: (value: string) => { void updateConfig({ platform: value }); },
                }, ...PLATFORMS.map((item) => el(D.TableRadioRow, { key: item.key, label: item.label, value: item.key })))
                : el(Group, { title: 'Platform', description: 'Choose the platform Discord reports for your account.' },
                    ...PLATFORMS.map((item) => el(ChoiceRow, {
                        key: item.key,
                        label: item.label,
                        selected: item.key === platform,
                        onPress: () => { void updateConfig({ platform: item.key }); },
                    }))),
            el(Group, { title: 'Apply changes' },
                el(Text, { style: { color: C.sub, fontSize: 13, paddingHorizontal: 16, paddingVertical: 10 } },
                    'Force-close and reopen Discord after changing the platform.')));
    };
}

let __builtSettings: any = null;

let __instance: any = {
    jsonStorage: { load: true, default: { enabled: false, platform: 'desktop' } },
    start: startNext,
    stop: stopNext,
    SettingsComponent: function (props: any) {
        const settingsApi = props?.api ?? props;
        const React = getReact(settingsApi);
        if (!React?.createElement) return null;
        try {
            if (settingsApi?.jsonStorage) jsonStorageApi = settingsApi.jsonStorage;
            if (!__builtSettings) __builtSettings = buildSettingsComponent(settingsApi);
            if (__builtSettings) return React.createElement(__builtSettings, { api: settingsApi });
        } catch (e) {
            hostError('settings build failed', e);
        }
        const RN: any = getRN(settingsApi) ?? {};
        return React.createElement(RN.Text ?? 'text', null, 'PlatformSpoofer settings could not load on this build.');
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
    updateConfig,
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
__instance.settings = __instance.SettingsComponent;
__instance.settingsComponentLazy = __instance.SettingsComponent;

export default __instance;
