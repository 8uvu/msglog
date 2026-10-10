// Verifies dist/index.js through the Revenge-style loader.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const code = readFileSync(join(__dirname, '..', '..', 'dist', 'dev.8uvu.last-online-tracker', 'index.js'), 'utf8');
const subscriptions = [];
const stored = { value: {} };
const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) {
        const flat = children.length === 1 ? children[0] : children;
        if (typeof type === 'function') {
            try { return type({ ...(props || {}), children: flat }); } catch { return { type, props, children: flat }; }
        }
        return { type, props, children: flat };
    },
    useState(value) { return [typeof value === 'function' ? value() : value, () => {}]; },
    useEffect() {},
};
function collect(node, out = []) {
    if (!node || typeof node !== 'object') return out;
    out.push(node);
    const children = Array.isArray(node.children) ? node.children : [node.children];
    for (const child of children) collect(child, out);
    return out;
}
// No Discord Design components on this host: the plain React Native fallback must still render.
const RN = { View: 'View', Text: 'Text', TextInput: 'Input', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: 'Switch' };
const host = {
    react: { React, ReactNative: RN },
    metro: {
        findByDisplayName: (name) => name === 'React' ? React : name === 'ReactNative' ? RN : null,
        findByProps: () => null,
        findByStoreName: () => null,
    },
    plugin: { jsonStorage: null },
    logger: { error: () => {} },
};
const cleanups = [];
const api = {
    cleanup: (off) => { if (typeof off === 'function') cleanups.push(off); },
    unscoped: {
        react: { React, ReactNative: RN },
        discord: {
            flux: {
                onFluxEventDispatched(event, fn) {
                    subscriptions.push({ event, fn });
                    return () => {
                        const i = subscriptions.findIndex((sub) => sub.event === event && sub.fn === fn);
                        if (i >= 0) subscriptions.splice(i, 1);
                    };
                },
                Stores: { UserStore: { getUser: (id) => ({ id, username: 'user' + id }) } },
            },
        },
    },
    jsonStorage: {
        get: async () => stored.value,
        set: async (patch) => Object.assign(stored.value, patch),
        use: () => stored.value,
    },
};

async function main() {
    const evalAccess = [];
    const result = new Function('revenge', 'plugin', 'return ' + code)(new Proxy(host, {
        get(target, key) { evalAccess.push(String(key)); return target[key]; },
    }), (definition) => definition);
    if (evalAccess.length) throw new Error('eval-time Revenge access: ' + evalAccess.join(','));
    if (typeof result.SettingsComponent !== 'function' || !result.jsonStorage?.default) throw new Error('Revenge settings contract missing');

    await result.start(api);
    const batch = subscriptions.find((sub) => sub.event === 'PRESENCE_UPDATES');
    const single = subscriptions.find((sub) => sub.event === 'PRESENCE_UPDATE');
    if (!batch || !single) throw new Error('both PRESENCE_UPDATE and PRESENCE_UPDATES must be subscribed');

    const engine = result.__engine;
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        batch.fn({ updates: [{ user: { id: '42' }, status: 'online', clientStatus: { mobile: 'online' } }] });
        now += engine.MIN_ONLINE_MS + 100;
        batch.fn({ updates: [{ user: { id: '42' }, status: 'offline', clientStatus: {} }] });
        if (!engine.getLastSeen()['42']) throw new Error('batched offline presence was not recorded');

        single.fn({ type: 'PRESENCE_UPDATE', user: { id: '7' }, status: 'online', clientStatus: { desktop: 'online' } });
        now += engine.MIN_ONLINE_MS + 100;
        single.fn({ type: 'PRESENCE_UPDATE', userId: '7', status: 'offline', clientStatus: {} });
        if (!engine.getLastSeen()['7']) throw new Error('single-user offline presence was not recorded');

        stored.value.lastSeen = engine.getLastSeen();
        const rendered = result.SettingsComponent({ api });
        const renderText = JSON.stringify(rendered);
        for (const expected of ['LastOnlineTracker', 'Last online', 'user42', 'Offline ', 'Keep last-seen times', 'Offline notifications']) {
            if (!renderText.includes(expected)) throw new Error('settings view missing ' + expected);
        }
        const notifyToggle = collect(rendered).find((node) => node.props?.accessibilityLabel === 'Offline notifications');
        if (!notifyToggle || notifyToggle.props.value !== false) throw new Error('native settings switch was not rendered');
        notifyToggle.props.onValueChange(true);
        if (!stored.value.notify) throw new Error('notification setting was not persisted');
    } finally {
        Date.now = realNow;
    }
    await result.stop();
    if (subscriptions.length) throw new Error('presence listeners were not removed');
    if (cleanups.length !== 2) throw new Error('Revenge cleanup API did not receive both presence disposers');
    console.log('VERIFY OK: plain RN settings render, last-seen list shows recorded departures, PRESENCE_UPDATE + PRESENCE_UPDATES ingestion, persistence and cleanup');
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
