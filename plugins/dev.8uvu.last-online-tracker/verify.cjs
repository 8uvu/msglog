// Verifies dist/index.js through the Revenge-style loader.
//
// The plugin has three independent ways to observe presence (named flux events,
// an any-dispatch census, raw gateway frames, plus store polling) because a
// single guessed API can simply not exist on a given build. Each path is driven
// here with the real bundle, and the host is configurable so a test can take
// surfaces away and prove the fallbacks still work.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { requireInstallPath } = require('../../scripts/publish-paths.cjs');

// The built bundle lives at whatever path the publishing policy says this plugin
// is published at — an opaque slug while the plugin is unlisted.
const code = readFileSync(join(__dirname, '..', '..', 'dist', requireInstallPath('dev.8uvu.last-online-tracker'), 'index.js'), 'utf8');

const problems = [];
function check(label, condition, detail) {
    if (condition) return;
    problems.push(label + (detail === undefined ? '' : ' — ' + detail));
}

function makeHarness(options = {}) {
    const state = { subscriptions: [], anyHandlers: [], cleanups: [] };
    const stored = { value: { ...(options.stored ?? {}) } };

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
    // No Discord Design components on this host: the plain React Native fallback must still render.
    const RN = { View: 'View', Text: 'Text', TextInput: 'Input', Pressable: 'Pressable', ScrollView: 'ScrollView', Switch: 'Switch' };

    // Which methods exist decides which detection path the plugin can use.
    const storeMethods = options.presenceStoreMethods ?? ['getUserIds'];
    const presenceStore = {
        ids: [...(options.presenceStoreIds ?? [])],
        status: { ...(options.presenceStoreStatus ?? {}) },
    };
    if (storeMethods.includes('getUserIds')) presenceStore.getUserIds = () => presenceStore.ids;
    if (storeMethods.includes('getStatus')) presenceStore.getStatus = (id) => presenceStore.status[id] ?? 'unknown';

    // The gateway socket the plugin patches — read-only observation, so the
    // original must still run and its result must survive.
    const gatewayCalls = [];
    const originalHandleMessage = function (frame, isBinary) {
        gatewayCalls.push({ frame, isBinary });
        return 'handled';
    };
    const gatewaySocket = { _doIdentify() {}, _handleMessage: originalHandleMessage };

    const flux = {
        onFluxEventDispatched(event, fn) {
            const entry = { event, fn };
            state.subscriptions.push(entry);
            return () => {
                const i = state.subscriptions.indexOf(entry);
                if (i >= 0) state.subscriptions.splice(i, 1);
            };
        },
    };
    if (!options.noAnyDispatch && !options.noFlux) {
        flux.onAnyFluxEventDispatched = (fn) => {
            state.anyHandlers.push(fn);
            return () => {
                const i = state.anyHandlers.indexOf(fn);
                if (i >= 0) state.anyHandlers.splice(i, 1);
            };
        };
    } else if (!options.noFlux) {
        // Older hosts: the census has to fall back to a raw interceptor.
        flux.dispatcher = {
            addInterceptor: (fn) => {
                state.anyHandlers.push(fn);
                return () => {
                    const i = state.anyHandlers.indexOf(fn);
                    if (i >= 0) state.anyHandlers.splice(i, 1);
                };
            },
        };
    }

    const host = {
        react: { React, ReactNative: RN },
        metro: {
            findByDisplayName: (name) => (name === 'React' ? React : name === 'ReactNative' ? RN : null),
            findByProps: (...props) => {
                if (options.noGateway) return null;
                if (props.includes('_doIdentify') || props.includes('_handleMessage')) return gatewaySocket;
                return null;
            },
            findByStoreName: (name) => (name === 'PresenceStore' && !options.noPresenceStore ? presenceStore : null),
        },
        plugin: { jsonStorage: null },
        logger: { error: (...args) => (options.logger ?? (() => {}))(args.map(String).join(' ')) },
    };

    const api = {
        cleanup: (off) => { if (typeof off === 'function') state.cleanups.push(off); },
        unscoped: {
            react: { React, ReactNative: RN },
            discord: {
                flux: options.noFlux
                    ? { Stores: { UserStore: { getUser: (id) => ({ id, username: 'user' + id }) } } }
                    : { ...flux, Stores: { UserStore: { getUser: (id) => ({ id, username: 'user' + id }) } } },
            },
        },
        jsonStorage: {
            get: async () => stored.value,
            set: async (patch) => Object.assign(stored.value, patch),
            use: () => stored.value,
        },
    };

    return {
        host,
        api,
        state,
        stored,
        presenceStore,
        // Drives the gateway the way the real socket would: a text frame.
        gatewayFrame(payload) {
            const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
            return gatewaySocket._handleMessage(text, false);
        },
        gatewayRestored: () => gatewaySocket._handleMessage === originalHandleMessage,
        gatewayCalls: () => gatewayCalls.length,
        // Any-dispatch path: every registered census handler sees the dispatch.
        dispatchAny(payload) {
            for (const fn of [...state.anyHandlers]) fn(payload);
        },
    };
}

async function boot(options = {}) {
    const h = makeHarness(options);
    const evalAccess = [];
    const result = new Function('revenge', 'plugin', 'return ' + code)(new Proxy(h.host, {
        get(target, key) { evalAccess.push(String(key)); return target[key]; },
    }), (definition) => definition);
    if (evalAccess.length) throw new Error('eval-time Revenge access: ' + evalAccess.join(','));
    if (typeof result.SettingsComponent !== 'function' || !result.jsonStorage?.default) throw new Error('Revenge settings contract missing');
    await result.start(h.api);
    return { ...h, result, engine: result.__engine };
}

function collect(node, out = []) {
    if (!node || typeof node !== 'object') return out;
    out.push(node);
    const children = Array.isArray(node.children) ? node.children : [node.children];
    for (const child of children) collect(child, out);
    return out;
}

// ---- The original regression scenario: events, persistence, settings --------
async function scenarioEventsAndSettings() {
    const h = await boot();
    const sub = (event) => h.state.subscriptions.find((s) => s.event === event);
    const batch = sub('PRESENCE_UPDATES');
    const single = sub('PRESENCE_UPDATE');
    check('PRESENCE_UPDATES must be subscribed', !!batch);
    check('PRESENCE_UPDATE must be subscribed', !!single);
    if (!batch || !single) {
        await h.result.stop();
        return;
    }

    const engine = h.engine;
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        batch.fn({ type: 'PRESENCE_UPDATES', updates: [{ user: { id: '42' }, status: 'online', clientStatus: { mobile: 'online' } }] });
        now += engine.MIN_ONLINE_MS + 100;
        batch.fn({ type: 'PRESENCE_UPDATES', updates: [{ user: { id: '42' }, status: 'offline', clientStatus: {} }] });
        check('batched offline presence was not recorded', !!engine.getLastSeen()['42'], JSON.stringify(engine.getLastSeen()));

        single.fn({ type: 'PRESENCE_UPDATE', user: { id: '7' }, status: 'online', clientStatus: { desktop: 'online' } });
        now += engine.MIN_ONLINE_MS + 100;
        single.fn({ type: 'PRESENCE_UPDATE', userId: '7', status: 'offline', clientStatus: {} });
        check('single-user offline presence was not recorded', !!engine.getLastSeen()['7'], JSON.stringify(engine.getLastSeen()));

        // A departure needs a witnessed online window; a burst of offline rows
        // for people we never watched must not be recorded.
        batch.fn({ type: 'PRESENCE_UPDATES', updates: [{ user: { id: 'stranger' }, status: 'offline', clientStatus: {} }] });
        check('unwitnessed departure was recorded', !engine.getLastSeen()['stranger'], JSON.stringify(engine.getLastSeen()['stranger']));

        h.stored.value.lastSeen = engine.getLastSeen();
        const rendered = h.result.SettingsComponent({ api: h.api });
        const renderText = JSON.stringify(rendered);
        for (const expected of ['LastOnlineTracker', 'Last online', 'user42', 'Offline ', 'Keep last-seen times', 'Offline notifications']) {
            check('settings view missing ' + expected, renderText.includes(expected));
        }
        const notifyToggle = collect(rendered).find((node) => node.props?.accessibilityLabel === 'Offline notifications');
        check('native settings switch was not rendered', !!notifyToggle && notifyToggle.props.value === false, JSON.stringify(!!notifyToggle));
        notifyToggle?.props.onValueChange(true);
        check('notification setting was not persisted', !!h.stored.value.notify, JSON.stringify(h.stored.value.notify));
    } finally {
        Date.now = realNow;
    }
    await h.result.stop();
    check('presence listeners were not removed', h.state.subscriptions.length === 0, String(h.state.subscriptions.length));
    check('census listener was not removed', h.state.anyHandlers.length === 0, String(h.state.anyHandlers.length));
    check('Revenge cleanup API did not receive the presence disposers', h.state.cleanups.length >= 3, String(h.state.cleanups.length));
    check('gateway handler was not restored on stop', h.gatewayRestored(), 'socket still patched');
}

// ---- The new detection paths ------------------------------------------------
async function scenarioDetectionPaths() {
    const h = await boot();
    const engine = h.engine;
    const diag0 = engine.getDiagnostics();
    check('census was not installed', diag0.censusInstalled === true, JSON.stringify(diag0));
    check('gateway socket handler was not patched', diag0.gatewayHandlers > 0, JSON.stringify(diag0));
    check('presence store was not found', String(diag0.storeLabel ?? '').includes('PresenceStore'), String(diag0.storeLabel));
    check('store polling was not started', diag0.polling === true, JSON.stringify(diag0));

    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        // 1. Raw gateway frames — the path that needs no flux dispatch at all.
        h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'gw-1' }, status: 'online', client_status: { desktop: 'online' } } });
        now += engine.MIN_ONLINE_MS + 100;
        const result = h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'gw-1' }, status: 'offline' } });
        check('gateway presence frame did not record a departure', !!engine.getLastSeen()['gw-1'], JSON.stringify(engine.getLastSeen()));
        check('gateway observation changed the handler result', result === 'handled', String(result));
        check('gateway frames were not counted', engine.getDiagnostics().gatewayPresenceFrames >= 2, JSON.stringify(engine.getDiagnostics().gatewayPresenceFrames));
        // A non-presence frame must be ignored rather than mis-parsed.
        h.gatewayFrame({ t: 'MESSAGE_CREATE', d: { id: 'x' } });
        check('a non-presence frame was counted as presence', engine.getDiagnostics().gatewayPresenceFrames === 2, JSON.stringify(engine.getDiagnostics().gatewayPresenceFrames));

        // 2. An action name nobody guessed, through the any-dispatch census.
        h.dispatchAny({ type: 'PRESENCE_UPDATE_BULK_V2', updates: [{ user: { id: 'census-1' }, status: 'online' }] });
        now += engine.MIN_ONLINE_MS + 100;
        h.dispatchAny({ type: 'PRESENCE_UPDATE_BULK_V2', updates: [{ user: { id: 'census-1' }, status: 'offline' }] });
        check('an unguessed presence action was not ingested', !!engine.getLastSeen()['census-1'], JSON.stringify(engine.getLastSeen()));
        check('census did not record the action type', engine.getDiagnostics().presenceActionTypes.includes('PRESENCE_UPDATE_BULK_V2'), JSON.stringify(engine.getDiagnostics().presenceActionTypes));

        // 3. Store polling: no events at all, only the online set changing.
        h.presenceStore.ids = ['store-1'];
        engine.pollPresenceStore();
        now += engine.MIN_ONLINE_MS + 100;
        h.presenceStore.ids = [];
        engine.pollPresenceStore();
        check('store polling did not record a departure', !!engine.getLastSeen()['store-1'], JSON.stringify(engine.getLastSeen()));
        check('store polls were not counted', engine.getDiagnostics().storePolls >= 2, JSON.stringify(engine.getDiagnostics().storePolls));

        const report = engine.probeReport();
        for (const needle of ['flux', 'gateway', 'store', 'departures']) {
            check('probe report missing ' + needle, report.includes(needle), report);
        }

        const rendered = h.result.SettingsComponent({ api: h.api });
        const text = JSON.stringify(rendered);
        for (const needle of ['Detection', 'Flux presence listeners', 'Presence actions seen', 'Gateway socket', 'Presence store', 'Run presence probe']) {
            check('settings view missing ' + needle, text.includes(needle));
        }
        // The user's only way to answer "did the new build load?" is the version
        // the plugin shows. It must be the manifest's version, and it must
        // survive the bundler (an unused constant is dropped).
        const manifestVersion = JSON.parse(readFileSync(join(__dirname, 'manifest.json'), 'utf8')).version;
        check('settings view does not show the plugin version ' + manifestVersion, text.includes('Version ' + manifestVersion), JSON.stringify(text.slice(0, 200)));
    } finally {
        Date.now = realNow;
    }
    await h.result.stop();
    check('gateway handler was not restored on stop', h.gatewayRestored(), 'socket still patched');
    check('polling was not stopped', engine.getDiagnostics().polling === false, JSON.stringify(engine.getDiagnostics()));
    check('census listener survived stop', h.state.anyHandlers.length === 0, String(h.state.anyHandlers.length));
}

// ---- A host with no any-dispatch API, only a raw interceptor ---------------
async function scenarioCensusFallback() {
    const h = await boot({ noAnyDispatch: true });
    const engine = h.engine;
    check('census did not fall back to a raw interceptor', engine.getDiagnostics().censusInstalled === true, JSON.stringify(engine.getDiagnostics()));
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        h.dispatchAny({ type: 'PRESENCE_UPDATE', user: { id: 'fallback-1' }, status: 'online' });
        now += engine.MIN_ONLINE_MS + 100;
        h.dispatchAny({ type: 'PRESENCE_UPDATE', user: { id: 'fallback-1' }, status: 'offline' });
        check('interceptor census did not ingest presence', !!engine.getLastSeen()['fallback-1'], JSON.stringify(engine.getLastSeen()));
    } finally {
        Date.now = realNow;
    }
    await h.result.stop();
}

// ---- Per-user status polling, where 'unknown' must mean no information ------
async function scenarioStatusPolling() {
    const h = await boot({ presenceStoreMethods: ['getStatus'], presenceStoreStatus: {} });
    const engine = h.engine;
    check('per-user store methods not recognised', String(engine.getDiagnostics().storeLabel ?? '').includes('getStatus'), String(engine.getDiagnostics().storeLabel));
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'st-1' }, status: 'online' } });
        now += engine.MIN_ONLINE_MS + 100;
        h.presenceStore.status['st-1'] = 'offline';
        engine.pollPresenceStore();
        check('per-user status polling did not record a departure', !!engine.getLastSeen()['st-1'], JSON.stringify(engine.getLastSeen()));

        // 'unknown' / a missing status is absence of information. Recording a
        // departure from it would invent history, which is worse than missing one.
        h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'st-2' }, status: 'online' } });
        now += engine.MIN_ONLINE_MS + 100;
        h.presenceStore.status['st-2'] = 'unknown';
        engine.pollPresenceStore();
        check('an unknown status was recorded as a departure', !engine.getLastSeen()['st-2'], JSON.stringify(engine.getLastSeen()['st-2']));
    } finally {
        Date.now = realNow;
    }
    await h.result.stop();
}

// ---- A host that exposes nothing at all ------------------------------------
//
// This is the case the plugin used to fail silently in: no event hook, no
// unguessable action, no socket, no store. It must say so plainly — and this
// scenario also proves the assertions above are not vacuous, since with the
// surfaces removed nothing is recorded from the very same frames.
async function scenarioNoSurfaces() {
    const logs = [];
    const h = await boot({
        noFlux: true,
        noAnyDispatch: true,
        noGateway: true,
        noPresenceStore: true,
        logger: (line) => logs.push(line),
    });
    const engine = h.engine;
    const diag = engine.getDiagnostics();
    check('reported a flux subscription with no flux hook', diag.subscribed === false, JSON.stringify(diag));
    check('reported a census with no dispatch API', diag.censusInstalled === false, JSON.stringify(diag));
    check('patched gateway handlers that do not exist', diag.gatewayHandlers === 0, JSON.stringify(diag));
    check('claimed to have found a presence store', diag.storeLabel === null, String(diag.storeLabel));
    check('did not log that no presence surface exists', logs.some((line) => line.includes('no presence surface')), JSON.stringify(logs));

    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
        h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'nobody-1' }, status: 'online' } });
        now += engine.MIN_ONLINE_MS + 100;
        h.gatewayFrame({ t: 'PRESENCE_UPDATE', d: { user: { id: 'nobody-1' }, status: 'offline' } });
        check('recorded a departure with every surface missing', !engine.getLastSeen()['nobody-1'], JSON.stringify(engine.getLastSeen()));

        const text = JSON.stringify(h.result.SettingsComponent({ api: h.api }));
        for (const needle of ['not installed', 'no inbound handler found', 'not found']) {
            check('settings view does not report the missing surface: ' + needle, text.includes(needle), 'missing: ' + needle);
        }
    } finally {
        Date.now = realNow;
    }
    await h.result.stop();
}

async function main() {
    await scenarioEventsAndSettings();
    await scenarioDetectionPaths();
    await scenarioCensusFallback();
    await scenarioStatusPolling();
    await scenarioNoSurfaces();

    if (problems.length) {
        console.error('VERIFY FAILED: ' + problems.length + ' problem(s)');
        for (const problem of problems) console.error('  - ' + problem);
        process.exit(1);
    }
    console.log('VERIFY OK: flux events, gateway frames, action census, store polling, settings, persistence and cleanup');
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
