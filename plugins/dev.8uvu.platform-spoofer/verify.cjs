// Verifies the PlatformSpoofer bundle through the Revenge-style loader.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const code = readFileSync(join(__dirname, '..', '..', 'dist', 'dev.8uvu.platform-spoofer', 'index.js'), 'utf8');
const React = {
    createElement(type, props, ...children) {
        const flat = children.length === 1 ? children[0] : children;
        if (typeof type === 'function') {
            try { return type({ ...(props || {}), children: flat }); } catch { return { type, props, children: flat }; }
        }
        return { type, props, children: flat };
    },
    useState(value) { return [typeof value === 'function' ? value() : value, () => {}]; },
};
const RN = { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: null };
const socket = { _doIdentify(props) { this.lastProps = props; } };
const stored = {};
const host = {
    react: { React, ReactNative: RN },
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
    jsonStorage: {
        get: async () => stored,
        use: () => stored,
        set: async (patch) => Object.assign(stored, patch),
    },
};

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
    for (const expected of ['PlatformSpoofer', 'ban-safety', 'Desktop', 'VR']) {
        if (!text.includes(expected)) throw new Error('settings UI missing: ' + expected);
    }

    const engine = plugin.__engine;
    await engine.updateConfig({ enabled: true, platform: 'web' });
    socket._doIdentify({ os: 'Android', browser: 'Discord Android' });
    if (socket.lastProps.browser !== 'Discord Web') throw new Error('enabled setting did not patch identify payload');
    if (!stored.enabled || stored.platform !== 'web') throw new Error('settings were not persisted');
    await engine.updateConfig({ enabled: false });
    await plugin.stop();
    console.log('VERIFY OK: settings contract, rendered UI, persistence and live identify toggle');
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
