// Verifies the PlatformSpoofer bundle through the Revenge-style loader.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { requireInstallPath } = require('../../scripts/publish-paths.cjs');

// Published at the path publish.json gives it — an opaque slug while it is
// unlisted — so this keeps working if the plugin is advertised again.
const code = readFileSync(join(__dirname, '..', '..', 'dist', requireInstallPath('dev.8uvu.platform-spoofer'), 'index.js'), 'utf8');
const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) {
        const flat = children.length === 1 ? children[0] : children;
        if (typeof type === 'function') {
            try { return type({ ...(props || {}), children: flat }); } catch { return { type, props, children: flat }; }
        }
        return { type, props, children: flat };
    },
    useState(value) { return [typeof value === 'function' ? value() : value, (update) => {}]; },
    useEffect(effect) { effect(); },
};

function collect(node, out = []) {
    if (!node || typeof node !== 'object') return out;
    out.push(node);
    const children = Array.isArray(node.children) ? node.children : [node.children];
    for (const child of children) collect(child, out);
    return out;
}
// No Discord Design components on this host: the plain React Native fallback must still render.
const RN = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: 'Switch' };
const socket = { _doIdentify(props) { this.lastProps = props; } };
const stored = {};
const cleanups = [];
const host = {
    react: { React, ReactNative: RN },
    api: { react: { React, ReactNative: RN } },
    metro: {
        findByDisplayName: (name) => name === 'React' ? React : name === 'ReactNative' ? RN : null,
        findByStoreName: () => null,
        findByProps: (...props) => props.includes('_doIdentify') ? socket : null,
    },
    plugin: { jsonStorage: null },
    discord: { actions: { ToastActionCreators: { open() {} } } },
    logger: { error() {} },
};
const api = {
    cleanup: (fn) => { if (typeof fn === 'function') cleanups.push(fn); },
    unscoped: { react: { React, ReactNative: RN } },
    jsonStorage: {
        get: async () => stored,
        use: () => stored,
        set: async (patch) => Object.assign(stored, patch),
        subscribe: () => () => {},
    },
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function main() {
    const evalAccess = [];
    const plugin = new Function('revenge', 'plugin', 'return ' + code)(new Proxy(host, {
        get(target, key) { evalAccess.push(String(key)); return target[key]; },
    }), (definition) => definition);
    if (evalAccess.length) throw new Error('eval-time Revenge access: ' + evalAccess.join(','));
    if (typeof plugin.SettingsComponent !== 'function' || !plugin.jsonStorage?.default) throw new Error('Revenge settings contract missing');
    await plugin.start(api);

    const ui = plugin.SettingsComponent({ api });
    const text = JSON.stringify(ui);
    for (const expected of ['PlatformSpoofer', 'Terms of Service', 'Desktop', 'VR', 'Enable platform spoofing', 'Force-close']) {
        if (!text.includes(expected)) throw new Error('settings UI missing: ' + expected);
    }
    const find = (label) => collect(ui).find((node) => node.props?.accessibilityLabel === label);

    const toggle = find('Enable platform spoofing');
    if (!toggle || toggle.props.value !== false) throw new Error('enable switch not rendered');
    toggle.props.onValueChange(true);
    await tick();
    if (!stored.enabled) throw new Error('visible settings control did not persist enable toggle');

    const web = find('Web');
    if (!web || typeof web.props.onPress !== 'function') throw new Error('platform choice not rendered');
    web.props.onPress();
    await tick();
    if (stored.platform !== 'web') throw new Error('visible platform choice did not persist');

    const engine = plugin.__engine;
    socket._doIdentify({ os: 'Android', browser: 'Discord Android' });
    if (socket.lastProps.browser !== 'Discord Web') throw new Error('enabled setting did not patch identify payload');
    if (!stored.enabled || stored.platform !== 'web') throw new Error('settings were not persisted');

    await engine.updateConfig({ enabled: false });
    socket._doIdentify({ os: 'Android', browser: 'Discord Android' });
    if (socket.lastProps.browser !== 'Discord Android') throw new Error('disabling did not restore identify payload');

    await plugin.stop();
    for (const cleanup of cleanups) cleanup();
    if (cleanups.length !== 1) throw new Error('settings subscription cleanup was not registered');

    // Classic host shape (bunny globals) must also render the same settings page.
    const classic = new Function('bunny', 'definePlugin', 'return ' + code)({
        React,
        ReactNative: RN,
        metro: { common: { React, ReactNative: RN }, findByProps: () => null, findByDisplayName: () => null },
    }, (definition) => ({ default: definition }));
    const classicUi = JSON.stringify(classic.SettingsComponent());
    if (!classicUi.includes('Enable platform spoofing')) throw new Error('classic host did not render the settings page');
    console.log('VERIFY OK: plain RN settings render, enable/platform controls persist, gateway patch restore, cleanup, classic host');
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
