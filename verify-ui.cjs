// Renders every built plugin's settings page twice and checks the UI contract:
//
//  Path A - the host has NO Discord design components:
//     the page must still render, contain visible text, and set an explicit
//     color on every Text/TextInput (uncolored text is black on Discord's dark
//     theme, i.e. invisible).
//
//  Path B - the host provides Discord's design system:
//     the page must render at least one of Discord's own native components
//     (TableRowGroup / TableSwitchRow / TableRow / TableRadioGroup /
//     TableRadioRow), which is what makes it look like the rest of Discord.
//
// Run after `node build.mjs`.
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(__dirname, 'dist');

const RN = {
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    Switch: 'Switch',
    Image: 'Image',
};

const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) {
        const flat = children.length === 1 ? children[0] : children;
        if (typeof type === 'function') {
            try {
                return type({ ...(props || {}), children: flat });
            } catch {
                return { type: type.name || 'Component', props, children: flat };
            }
        }
        return { type, props, children: flat };
    },
    useState(value) { return [typeof value === 'function' ? value() : value, () => {}]; },
    useEffect() {},
    useLayoutEffect() {},
    useRef(value) { return { current: value }; },
    useMemo(fn) { return fn(); },
    useCallback(fn) { return fn; },
};

// Discord's own components. Detected by name so a settings page using them and
// a settings page rolling its own rows are told apart.
const NATIVE_TYPES = [
    'TableRowGroup',
    'TableSwitchRow',
    'TableRow',
    'TableRadioGroup',
    'TableRadioRow',
    // Discord's own input/button (names from the DESIGN stub below):
    'DTextInput',
    'DTextField',
    'DButton',
];
const DESIGN = {
    TableRowGroup: 'TableRowGroup',
    TableSwitchRow: 'TableSwitchRow',
    TableRow: 'TableRow',
    TableRadioGroup: 'TableRadioGroup',
    TableRadioRow: 'TableRadioRow',
    TextInput: 'DTextInput',
    TextField: 'DTextField',
    Text: 'DText',
    Button: 'DButton',
};

function makeHost(design) {
    const host = {
        react: { React, ReactNative: RN },
        metro: {
            findByDisplayName: (name) => (name === 'React' ? React : name === 'ReactNative' ? RN : null),
            findByProps: () => null,
            findByStoreName: () => null,
        },
        discord: { flux: { onFluxEventDispatched: () => () => {}, Stores: {} }, design: design ?? {}, actions: {} },
        logger: { log() {}, error() {} },
        plugin: { jsonStorage: null },
    };
    return host;
}

function makeApi(stored, design) {
    return {
        cleanup: () => {},
        unscoped: {
            react: { React, ReactNative: RN },
            discord: { design: design ?? {}, flux: { onFluxEventDispatched: () => () => {}, Stores: {} } },
        },
        jsonStorage: {
            get: async () => stored,
            set: async (patch) => Object.assign(stored, patch),
            use: () => stored,
            cache: stored,
            subscribe: () => () => {},
        },
    };
}

function flatStyle(style) {
    if (!style) return {};
    if (Array.isArray(style)) return style.reduce((acc, s) => ({ ...acc, ...flatStyle(s) }), {});
    return typeof style === 'object' ? style : {};
}

function collect(node, out = []) {
    if (node == null || typeof node !== 'object') return out;
    if (Array.isArray(node)) {
        for (const child of node) collect(child, out);
        return out;
    }
    out.push(node);
    collect(node.children, out);
    return out;
}

function textOf(node) {
    const parts = [];
    const visit = (child) => {
        if (child == null || typeof child === 'boolean') return;
        if (typeof child === 'string' || typeof child === 'number') parts.push(String(child));
        else if (Array.isArray(child)) child.forEach(visit);
        else if (typeof child === 'object') visit(child.children);
    };
    visit(node.children);
    return parts.join('').trim();
}

async function renderPage(id, code, design) {
    const host = makeHost(design);
    const stored = {};
    const api = makeApi(stored, design);
    const previous = globalThis.revenge;
    if (design) globalThis.revenge = host;
    try {
        const inst = new Function('revenge', 'plugin', 'return ' + code)(host, (definition) => definition);
        if (!inst || typeof inst.SettingsComponent !== 'function') return { error: 'no SettingsComponent exported' };
        try {
            await inst.start?.(api);
        } catch (e) {
            // A failing start must not hide the settings page; the page is what we check.
        }
        try {
            return { ui: inst.SettingsComponent({ api }) };
        } catch (e) {
            return { error: 'SettingsComponent threw: ' + (e && e.message ? e.message : String(e)) };
        }
    } finally {
        if (design) {
            if (previous === undefined) delete globalThis.revenge;
            else globalThis.revenge = previous;
        }
    }
}

function checkFallbackPath(ui) {
    const problems = [];
    if (ui == null) return ['settings page rendered null without Discord design components'];
    const nodes = collect(ui);
    const texts = nodes.filter((n) => n.type === 'Text');
    if (texts.filter((n) => textOf(n).length > 0).length === 0) problems.push('settings page has no visible text');
    for (const node of texts) {
        if (textOf(node).length === 0) continue;
        if (!flatStyle(node.props?.style).color) problems.push(`Text without explicit color: "${textOf(node).slice(0, 40)}"`);
    }
    for (const node of nodes.filter((n) => n.type === 'TextInput')) {
        if (!flatStyle(node.props?.style).color) problems.push('TextInput without explicit text color');
    }
    return problems;
}

function checkNativePath(ui) {
    const problems = [];
    if (ui == null) return ['settings page rendered null even though Discord design components are available'];
    const nodes = collect(ui);
    const native = nodes.filter((n) => NATIVE_TYPES.includes(n.type));
    if (native.length === 0) {
        problems.push('settings page did not use any Discord design component (' + NATIVE_TYPES.join(', ') + ')');
    }
    // When Discord provides an input, the page must not keep its own.
    if (nodes.some((n) => n.type === 'TextInput')) {
        problems.push('settings page renders its own TextInput even though Discord provides one');
    }
    return problems;
}

async function main() {
    const ids = readdirSync(distDir).filter((name) => existsSync(join(distDir, name, 'index.js')));
    if (ids.length === 0) throw new Error('no built plugins in dist/; run node build.mjs first');
    let failed = 0;
    for (const id of ids) {
        const code = readFileSync(join(distDir, id, 'index.js'), 'utf8');
        const problems = [];

        const fallback = await renderPage(id, code, null);
        problems.push(...(fallback.error ? [fallback.error] : checkFallbackPath(fallback.ui)));

        const native = await renderPage(id, code, { Design: DESIGN });
        problems.push(...(native.error ? [native.error] : checkNativePath(native.ui).map((p) => p + ' (with design components present)')));

        if (problems.length) {
            failed++;
            console.log(`FAIL ${id}`);
            for (const p of problems) console.log('  - ' + p);
        } else {
            console.log(`PASS ${id}`);
        }
    }
    if (failed) {
        console.error(`UI CHECK FAILED: ${failed} plugin(s)`);
        process.exit(1);
    }
    console.log(`UI CHECK OK: ${ids.length} plugin(s) — fallback renders readably and Discord's own components are used when available`);
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
