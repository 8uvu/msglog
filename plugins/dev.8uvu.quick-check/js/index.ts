// Quick Check — pops a native Alert with a complete host diagnosis the
// moment it is enabled. No settings page needed, no design components,
// no reliance on anything beyond React Native itself.
// Zero eval-time access to host globals; universal across the three
// Revenge-family loaders (Next, Classic bunny, vendetta manager).

function rn(): any {
    let out: any = null;
    try { out = ((typeof revenge !== 'undefined' && (revenge as any))?.react?.ReactNative) || out; } catch {}
    try { out = ((typeof bunny !== 'undefined' && (bunny as any))?.metro?.common?.ReactNative) || out; } catch {}
    try { out = ((typeof vendetta !== 'undefined' && (vendetta as any))?.metro?.common?.ReactNative) || out; } catch {}
    try { out = ((typeof vendetta !== 'undefined' && (vendetta as any))?.common?.ReactNative) || out; } catch {}
    return out;
}

function react(): any {
    let out: any = null;
    try { out = ((typeof revenge !== 'undefined' && (revenge as any))?.react?.React) || out; } catch {}
    try { out = ((typeof bunny !== 'undefined' && (bunny as any))?.metro?.common?.React) || out; } catch {}
    try { out = ((typeof bunny !== 'undefined' && (bunny as any))?.React) || out; } catch {}
    try { out = ((typeof vendetta !== 'undefined' && (vendetta as any))?.metro?.common?.React) || out; } catch {}
    try { out = ((typeof vendetta !== 'undefined' && (vendetta as any))?.common?.React) || out; } catch {}
    return out;
}

function line(label: string, value: unknown): string {
    return label + ': ' + (value === undefined ? 'MISSING' : value === null ? 'null' : String(value));
}

function diagnosis(): string {
    const lines: string[] = [];

    let host = 'UNKNOWN (none of revenge/bunny/vendetta found)';
    try { if (typeof revenge !== 'undefined') host = 'Revenge (Next)'; } catch {}
    try { if (host.startsWith('UNKNOWN') && typeof bunny !== 'undefined') host = 'Revenge Classic (bunny)'; } catch {}
    try { if (host.startsWith('UNKNOWN') && typeof vendetta !== 'undefined') host = 'Vendetta-compat manager'; } catch {}
    lines.push('Host: ' + host);
    lines.push('');

    const R = react();
    const RN = rn();
    lines.push(line('React', R ? typeof R.createElement : undefined));
    lines.push(line('ReactNative', RN ? 'present' : undefined));
    lines.push(line('RN.Alert', RN?.Alert ? typeof RN.Alert.alert : undefined));
    lines.push('');

    // Flux dispatcher, whichever way this host exposes it.
    let dispatcher: any = null;
    try { if (typeof revenge !== 'undefined') dispatcher = (revenge as any)?.discord?.flux; } catch {}
    try { if (!dispatcher && typeof bunny !== 'undefined') dispatcher = (bunny as any)?.api?.flux; } catch {}
    try {
        if (!dispatcher && typeof vendetta !== 'undefined') {
            const v: any = vendetta;
            dispatcher = v?.metro?.common?.FluxDispatcher ?? v?.common?.FluxDispatcher;
        }
    } catch {}
    // typeof only guards bare identifiers, never member chains — check
    // the global's existence first, then probe the chain.
    lines.push(line('Flux (Next API)', typeof revenge !== 'undefined' ? typeof (revenge as any)?.discord?.flux?.onFluxEventDispatched : undefined));
    lines.push(line('Flux (bunny intercept)', typeof bunny !== 'undefined' ? typeof (bunny as any)?.api?.flux?.intercept : undefined));
    lines.push(line('FluxDispatcher.addInterceptor', typeof dispatcher?.addInterceptor));
    lines.push('');

    // Stores via metro.
    let store = 'none';
    try {
        const m: any = (typeof bunny !== 'undefined' ? (bunny as any)?.metro : null)
            ?? (typeof vendetta !== 'undefined' ? (vendetta as any)?.metro : null);
        const us = m?.findByStoreName?.('UserStore');
        store = us?.getCurrentUser ? 'resolved' : (us ? 'found, no getCurrentUser' : 'MISSING');
        if (us?.getCurrentUser) {
            const u = us.getCurrentUser();
            store += ' (user id: ' + String(u?.id ?? '?') + ')';
        }
    } catch (e) {
        store = 'finder threw: ' + (e instanceof Error ? e.message : String(e));
    }
    lines.push(line('UserStore (metro)', store));
    lines.push('');

    // Native file module (Revenge Next persistence path).
    lines.push(line('FileModule', typeof revenge !== 'undefined' && (revenge as any)?.discord?.native?.FileModule ? 'present' : undefined));
    lines.push('');

    lines.push('If React/RN show "MISSING" or the host is UNKNOWN,');
    lines.push('the loader never injected this plugin correctly.');
    lines.push('Send this whole popup to the plugin developer.');
    return lines.join('\n');
}

function popIt(): void {
    const RN: any = rn();
    const text = diagnosis();
    try {
        if (RN?.Alert?.alert) {
            RN.Alert.alert('Quick Check', text);
            return;
        }
    } catch {}
    // Fallback: vendetta alert API.
    try {
        const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
        v?.ui?.alerts?.showConfirmationAlert?.({
            title: 'Quick Check',
            content: text,
            confirmText: 'OK',
            cancelText: 'Close',
            onConfirm: () => {},
            onCancel: () => {},
        });
    } catch {}
    // Last resort: console (visible via adb logcat).
    try { console.log('[QuickCheck]\n' + text); } catch {}
}

// Discord's theme store decides light vs dark; default dark. Plain Text without
// an explicit color renders black on the dark theme, so every label sets one.
function settingsInk(): { text: string; sub: string } {
    let dark = true;
    try {
        const tm: any = (globalThis as any).revenge?.metro?.findByProps?.('theme', 'setTheme');
        const t = tm?.theme ?? tm?.resolvedTheme ?? tm?.currentTheme;
        if (t) dark = String(t).toLowerCase().includes('dark');
    } catch {}
    return dark ? { text: '#ffffff', sub: '#9ba0a8' } : { text: '#060607', sub: '#5c5e66' };
}

// Discord's own design components give the settings page Discord's native look.
// Resolved lazily (never at eval time) so the host cannot kill us.
function resolveDesign(): any {
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

function makeSettings(): any {
    const ink = settingsInk();
    const React = react();
    const RN = rn();
    if (!React || !RN) return null;
    const { View, Text, ScrollView } = RN;
    const el = React.createElement;
    const D = resolveDesign();
    return function Settings() {
        // Native Discord rows when the host exposes its design system.
        if (D?.TableRowGroup && D?.TableRow) {
            const rows = diagnosis().split('\n').map((text, i) => text.trim()
                ? el(D.TableRow, { key: 'r' + i, label: text })
                : el(View, { key: 'g' + i, style: { height: 6 } }));
            return el(
                ScrollView,
                { style: { flex: 1 } },
                el(D.TableRowGroup, { title: 'Quick Check' }, ...rows),
            );
        }
        return el(
            ScrollView,
            { style: { flex: 1 } },
            el(View, { style: { padding: 12 } }, el(Text, { style: { color: ink.text, fontSize: 13 } }, diagnosis())),
        );
    };
}

let _settings: any = null;
function SettingsComponent(props: any) {
    try {
        if (!_settings) _settings = makeSettings();
        if (!_settings) {
            const React = react();
            const RN = rn();
            if (React && RN?.Text) return React.createElement(RN.Text, { style: { color: settingsInk().text } }, 'React resolved late — toggle the plugin off and on.');
            return null;
        }
        return _settings(props);
    } catch (e) {
        const React = react();
        const RN = rn();
        if (React && RN?.Text) return React.createElement(RN.Text, { style: { color: settingsInk().text } }, 'QuickCheck settings crashed: ' + (e instanceof Error ? e.message : String(e)));
        return null;
    }
}

let instance: any = {
    jsonStorage: { load: true, default: {} },
    start() {
        try {
            popIt();
        } catch (e) {
            try { console.log('[QuickCheck] probe crashed: ' + (e instanceof Error ? e.stack : String(e))); } catch {}
            const RN: any = rn();
            try { RN?.Alert?.alert('QuickCheck crashed', String(e instanceof Error ? e.message : e)); } catch {}
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
