// Verifies the MessageLogger distribution bundle through the Revenge-style loader.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const code = readFileSync(join(__dirname, '..', '..', 'dist', 'dev.8uvu.message-logger', 'index.js'), 'utf8');
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
const RN = { View: 'View', Text: 'Text', TextInput: 'Input', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: null, processColor: (value) => value };
const storage = { cache: {}, use() { return this.cache; }, get: async () => storage.cache, set: async (patch) => Object.assign(storage.cache, patch), subscribe: () => () => {} };
const fileContents = {};
const fileModule = {
    getConstants: () => ({ DocumentsDirPath: '/docs' }),
    readFile: async (path) => { if (Object.hasOwn(fileContents, path)) return fileContents[path]; throw new Error('ENOENT: ' + path); },
    writeFile: async (_dir, name, content) => { fileContents['/docs/' + name] = content; },
    readFileSync: () => '',
};
const eventHandlers = [];
const anyHandlers = [];
const registeredCleanups = [];
const modules = {};
const flux = {
    onFluxEventDispatched(event, handler) {
        const entry = { event, handler };
        eventHandlers.push(entry);
        return () => { const i = eventHandlers.indexOf(entry); if (i >= 0) eventHandlers.splice(i, 1); };
    },
    onAnyFluxEventDispatched(handler) {
        anyHandlers.push(handler);
        return () => { const i = anyHandlers.indexOf(handler); if (i >= 0) anyHandlers.splice(i, 1); };
    },
};
const host = {
    react: { React, ReactNative: RN },
    metro: {
        findByDisplayName: (name) => name === 'React' ? React : name === 'ReactNative' ? RN : null,
        findByStoreName: () => null,
        findByProps: (...props) => {
            if (props.includes('updateRows')) return modules.updateRows ??= { updateRows(_channel, raw) { modules.lastRows = JSON.parse(raw); } };
            if (props.includes('getConstants') && props.includes('readFile')) return fileModule;
            if (props.includes('dispatch')) return { dispatch() {} };
            return null;
        },
    },
    discord: { flux, native: { FileModule: fileModule }, actions: { ToastActionCreators: { open() {} } } },
    plugin: { jsonStorage: storage },
    logger: { error() {}, log() {} },
};
const api = { jsonStorage: storage, cleanup: () => {}, logger: host.logger };

async function main() {
    const evalAccess = [];
    const plugin = new Function('revenge', 'plugin', 'return ' + code)(new Proxy(host, {
        get(target, key) { evalAccess.push(String(key)); return target[key]; },
    }), (definition) => definition);
    if (evalAccess.length) throw new Error('eval-time Revenge access: ' + evalAccess.join(','));
    if (typeof plugin.SettingsComponent !== 'function' || !plugin.jsonStorage?.default) throw new Error('Revenge settings contract missing');

    await plugin.start(api);
    for (const expected of ['MESSAGE_CREATE', 'MESSAGE_DELETE', 'MESSAGE_UPDATE']) {
        if (!eventHandlers.some((entry) => entry.event === expected)) throw new Error('missing message listener: ' + expected);
    }

    const create = eventHandlers.find((entry) => entry.event === 'MESSAGE_CREATE').handler;
    const update = eventHandlers.find((entry) => entry.event === 'MESSAGE_UPDATE').handler;
    create({ message: { id: 'edited-1', channelId: 'chan-1', author: { id: '42', username: 'Alice' }, content: 'before', timestamp: new Date().toISOString(), mentions: [] } });
    const changedMessage = { id: 'edited-1', channelId: 'chan-1', author: { id: '42', username: 'Alice' }, content: 'after', timestamp: new Date().toISOString(), mentions: [] };
    update({ message: changedMessage });
    for (const intercept of anyHandlers) intercept({ type: 'MESSAGE_UPDATE', message: changedMessage });

    const rendered = plugin.SettingsComponent({ api });
    const text = JSON.stringify(rendered);
    for (const expected of ['MessageLogger', 'SAVED', 'DELETED', 'EDITED', 'Saved log']) {
        if (!text.includes(expected)) throw new Error('settings UI missing: ' + expected);
    }
    modules.updateRows.updateRows('chan-1', JSON.stringify([{ type: 1, message: { id: 'edited-1', content: 'after' } }]));
    const edited = modules.lastRows.find((row) => row.message.id === 'edited-1');
    if (!edited || edited.message.textColor !== '#afb2b4' || edited.backgroundHighlight) throw new Error('edited row is not neutrally dimmed without a highlight: ' + JSON.stringify(edited));

    await plugin.stop();
    console.log('VERIFY OK: settings UI, event registration and edit row styling');
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
