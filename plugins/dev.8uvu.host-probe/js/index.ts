// Host Probe — diagnostic plugin that reports which plugin loader and API
// surface the running Revenge build actually exposes. Zero eval-time access
// to host globals: everything resolves lazily inside functions, and the
// start lifecycle branches on what exists.
//
// Universal across the three known Revenge-family loaders:
//   - Revenge Next:  new Function('revenge','plugin','return '+code) → .default → start(api)
//   - Revenge Classic bunny manager: (bunny,definePlugin)=>{code; return plugin?.default ?? plugin} → start()
//   - Vendetta-compat manager: vendetta=>{return code} → onLoad()/settings

interface ProbeRow {
    key: string;
    value: string;
}

const rows: ProbeRow[] = [];

function push(key: string, value: unknown): void {
    rows.push({ key, value: value === undefined ? 'undefined' : String(value) });
}

function probeGlobals(): string[] {
    const present: string[] = [];
    try { if (typeof revenge !== 'undefined' && (revenge as any)) present.push('revenge'); } catch {}
    try { if (typeof bunny !== 'undefined' && (bunny as any)) present.push('bunny'); } catch {}
    try { if (typeof vendetta !== 'undefined' && (vendetta as any)) present.push('vendetta'); } catch {}
    try { if (typeof plugin !== 'undefined' && typeof (plugin as any) === 'function') present.push('plugin(factory)'); } catch {}
    return present;
}

function probeRevenge(): void {
    try {
        if (typeof revenge === 'undefined') return;
        const r: any = revenge;
        push('revenge.api version', r?.api?.version ?? r?.apiVersion ?? '?');
        push('revenge.react', !!r?.react);
        push('revenge.react.jsxRuntime', !!r?.react?.jsxRuntime);
        push('revenge.discord.flux', !!r?.discord?.flux);
        push('flux.onFluxEventDispatched', typeof r?.discord?.flux?.onFluxEventDispatched);
        push('flux.Stores.UserStore', !!r?.discord?.flux?.Stores?.UserStore);
        push('revenge.discord.actions', !!r?.discord?.actions);
        push('revenge.discord.design', !!r?.discord?.design);
        push('revenge.discord.native.FileModule', !!r?.discord?.native?.FileModule);
        push('revenge.logger', !!r?.logger);
    } catch (e) {
        push('revenge probe error', e instanceof Error ? e.message : String(e));
    }
}

function probeBunny(): void {
    try {
        if (typeof bunny === 'undefined') return;
        const b: any = bunny;
        push('bunny.api.flux.intercept', typeof b?.api?.flux?.intercept);
        push('bunny.plugin.createStorage', typeof b?.plugin?.createStorage);
        push('bunny.plugin.logger', !!b?.plugin?.logger);
        push('bunny.metro', !!b?.metro);
        push('bunny.metro.common.React', !!b?.metro?.common?.React);
        push('bunny.metro.common.FluxDispatcher', !!b?.metro?.common?.FluxDispatcher);
        push('bunny.native.FileModule', !!(b?.api?.native?.FileModule || b?.native?.FileModule));
    } catch (e) {
        push('bunny probe error', e instanceof Error ? e.message : String(e));
    }
}

function probeVendetta(): void {
    try {
        if (typeof vendetta === 'undefined') return;
        const v: any = vendetta;
        push('vendetta.plugin.storage', !!v?.plugin?.storage);
        push('vendetta.metro.common.React', !!v?.metro?.common?.React);
        push('vendetta.metro.common.FluxDispatcher', !!v?.metro?.common?.FluxDispatcher);
        push('dispatcher.addInterceptor', typeof (v?.metro?.common?.FluxDispatcher ?? v?.common?.FluxDispatcher)?.addInterceptor);
        push('vendetta.ui.toasts.showToast', typeof v?.ui?.toasts?.showToast ?? typeof v?.common?.toasts?.showToast);
        push('vendetta.metro.findByStoreName', typeof v?.metro?.findByStoreName);
        try {
            const us = v?.metro?.findByStoreName?.('UserStore');
            push('metro UserStore', !!us);
        } catch {
            push('metro UserStore', 'finder threw');
        }
    } catch (e) {
        push('vendetta probe error', e instanceof Error ? e.message : String(e));
    }
}

function probeStorageApi(api: any): void {
    push('jsonStorage passed to start', !!api?.jsonStorage);
    if (api?.jsonStorage) {
        push('jsonStorage.get', typeof api.jsonStorage.get);
        push('jsonStorage.subscribe', typeof api.jsonStorage.subscribe);
    }
}

function summary(): string {
    const globals = probeGlobals();
    let kind = 'unknown host';
    try {
        if (typeof revenge !== 'undefined') kind = 'Revenge (Next API)';
        else if (typeof bunny !== 'undefined') kind = 'Revenge Classic (bunny)';
        else if (typeof vendetta !== 'undefined') kind = 'Vendetta-compat manager';
    } catch {}
    return kind + ' · globals: ' + (globals.join(', ') || 'NONE');
}

// ---- Lazy UI resolution (no react access at eval time) ---------------------

let _React: any = null;
function react(): any {
    if (_React) return _React;
    try { if (typeof revenge !== 'undefined') { const r: any = (revenge as any).react; if (r) _React = r.React || r; } } catch {}
    try { if (!_React && typeof bunny !== 'undefined') { const b: any = bunny; _React = b.React || b.common?.React || b.metro?.common?.React; } } catch {}
    try { if (!_React && typeof vendetta !== 'undefined') _React = (vendetta as any)?.common?.React ?? (vendetta as any)?.metro?.common?.React; } catch {}
    return _React;
}

let _RN: any = null;
function reactNative(): any {
    if (_RN) return _RN;
    try { if (typeof revenge !== 'undefined') _RN = (revenge as any)?.react?.ReactNative; } catch {}
    try { if (!_RN && typeof bunny !== 'undefined') { const b: any = bunny; _RN = b.ReactNative || b.common?.ReactNative || b.metro?.common?.ReactNative; } } catch {}
    try { if (!_RN && typeof vendetta !== 'undefined') _RN = (vendetta as any)?.common?.ReactNative ?? (vendetta as any)?.metro?.common?.ReactNative; } catch {}
    return _RN;
}

function makeSettings(): any {
    const React = react();
    const RN = reactNative();
    if (!React || !RN) return null;
    const { View, Text, ScrollView } = RN;
    const el = React.createElement;
    return function Settings() {
        return el(
            ScrollView,
            { style: { flex: 1 } },
            el(View, { style: { padding: 12 } }, el(Text, { style: { fontWeight: 'bold', marginBottom: 8 } }, summary())),
            rows.map((r, i) =>
                el(
                    View,
                    { key: i, style: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 } },
                    el(Text, { style: { flex: 1 } }, r.key),
                    el(Text, { style: { opacity: 0.7 } }, r.value),
                ),
            ),
        );
    };
}

function showToastEverywhere(content: string, key: string): void {
    const show = (fn: any, arg: any) => {
        try {
            if (typeof fn !== 'function') return false;
            fn(arg);
            return true;
        } catch {
            return false;
        }
    };
    try {
        const a: any = typeof revenge !== 'undefined' ? (revenge as any)?.discord?.actions : null;
        const open = a?.ToastActionCreators?.open ?? a?.open;
        if (show(open, { key, content })) return;
    } catch {}
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        const s = v?.ui?.toasts?.showToast ?? v?.common?.toasts?.showToast;
        if (show(s, { key, content }) || show(s, content)) return;
    } catch {}
    try {
        const b: any = typeof bunny !== 'undefined' ? bunny : null;
        if (show(b?.api?.toasts?.showToast, { key, content })) return;
    } catch {}
    try {
        const ta: any = reactNative()?.ToastAndroid;
        ta?.show?.(content, ta?.SHORT ?? 0);
    } catch {}
}

function runProbe(startApi: any): void {
    rows.length = 0;
    push('probe at', new Date().toLocaleTimeString());
    push('globals present', probeGlobals().join(', ') || 'NONE');
    push('plugin factory injected', typeof plugin !== 'undefined' && typeof (plugin as any) === 'function');
    probeStorageApi(startApi);
    probeRevenge();
    probeBunny();
    probeVendetta();

    const oneLine = summary();
    showToastEverywhere('Host Probe: ' + oneLine, 'hostprobe-summary');
    try {
        (typeof revenge !== 'undefined' ? (revenge as any)?.logger : null)?.log?.('[HostProbe] ' + rows.map((r) => r.key + '=' + r.value).join(' | '));
    } catch {}
}

// ---- Universal plugin instance --------------------------------------------

let _settings: any = null;
function SettingsComponent(props: any) {
    if (!_settings) _settings = makeSettings();
    if (!_settings) return null;
    const React = react();
    return _settings(props);
}

let instance: any = {
    jsonStorage: { load: true, default: {} },
    start(api: any) {
        try {
            runProbe(api);
        } catch (e) {
            showToastEverywhere('HostProbe probe failed: ' + (e instanceof Error ? e.message : String(e)), 'hostprobe-fail');
        }
    },
    stop() {},
    SettingsComponent,
};

if (typeof plugin === 'function') {
    instance = (plugin as any)(instance);
}
(globalThis as any).plugin = instance;

instance.onLoad = function () {
    instance.start?.();
};
instance.onUnload = function () {
    instance.stop?.();
};
instance.settings = instance.SettingsComponent;

export default globalThis.plugin;
