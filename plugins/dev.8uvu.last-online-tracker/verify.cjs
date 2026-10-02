// Verifies dist/index.js through the Revenge-style loader.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const code = readFileSync(join(__dirname, '..', '..', 'dist', 'dev.8uvu.last-online-tracker', 'index.js'), 'utf8');
const subscriptions = [];
const stored = { value: {} };
const React = {
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
const RN = { View: 'View', Text: 'Text', TextInput: 'Input', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: null };
const dispatcher = {
    dispatch() {},
    subscribe(event, fn) { subscriptions.push({ event, fn }); },
    unsubscribe(event, fn) {
        const i = subscriptions.findIndex((sub) => sub.event === event && sub.fn === fn);
        if (i >= 0) subscriptions.splice(i, 1);
    },
};
const host = {
    react: { React, ReactNative: RN },
    metro: {
        findByDisplayName: (name) => name === 'React' ? React : name === 'ReactNative' ? RN : null,
        findByProps: (...props) => props.includes('subscribe') && props.includes('dispatch') ? dispatcher : null,
        findByStoreName: () => null,
    },
    discord: { flux: { dispatcher } },
    plugin: { jsonStorage: null },
    logger: { error: () => {} },
};
const cleanups = [];
const api = {
    cleanup: (off) => { if (typeof off === 'function') cleanups.push(off); },
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
    const one = subscriptions.find((sub) => sub.event === 'PRESENCE_UPDATE');
    const many = subscriptions.find((sub) => sub.event === 'PRESENCE_UPDATES');
    if (!one || !many) throw new Error('presence events were not subscribed');

    const engine = result.__engine;
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        one.fn({ user_id: '42', status: 'online' });
        now += engine.MIN_ONLINE_MS + 100;
        many.fn({ updates: [{ user_id: '42', status: 'offline' }] });
        if (!engine.getLastSeen()['42']) throw new Error('batched snake_case offline presence was not recorded');
        many.fn({ users: [{ userId: '7', status: 'online' }] });
        now += engine.MIN_ONLINE_MS + 100;
        many.fn([{ userId: '7', presence: { status: 'offline' } }]);
        if (!engine.getLastSeen()['7']) throw new Error('nested array offline presence was not recorded');
        const rendered = result.SettingsComponent({ api });
        if (!JSON.stringify(rendered).includes('LastOnlineTracker')) throw new Error('settings did not render');
    } finally {
        Date.now = realNow;
    }
    await result.stop();
    if (subscriptions.length) throw new Error('presence listeners were not removed');
    if (cleanups.length !== 2) throw new Error('Revenge cleanup API did not receive presence disposers');
    console.log('VERIFY OK: settings contract, single/batch presence handling, persistence path and cleanup');
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
