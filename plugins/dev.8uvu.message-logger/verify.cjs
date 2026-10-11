// Verifies the MessageLogger distribution bundle through the Revenge-style
// loader. Every scenario boots a fresh copy of the same bundle with its own
// storage cache, then drives the real flux handlers, interceptors and row
// painter — nothing here reimplements plugin logic.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const code = readFileSync(join(__dirname, '..', '..', 'dist', 'dev.8uvu.message-logger', 'index.js'), 'utf8');

const LOG_FILE = '/docs/message-logger.json';
const tick = () => new Promise((resolve) => setImmediate(resolve));

function makeHarness(initialSettings = {}, options = {}) {
    const state = {
        eventHandlers: [],
        anyHandlers: [],
        cleanups: [],
        rows: null,
        fileContents: {},
        errors: [],
        modules: {},
        selectedChannel: options.selectedChannel ?? 'chan-cur',
        mutedChannels: options.mutedChannels ?? [],
        mutedCategories: options.mutedCategories ?? [],
        mutedGuilds: options.mutedGuilds ?? [],
    };
    const clipboard = {
        last: null,
        setString(value) {
            clipboard.last = value;
        },
        getString: async () => options.clipboardRead ?? '',
    };
    if (options.seededLog) state.fileContents[LOG_FILE] = JSON.stringify(options.seededLog);

    const channels = {
        'chan-1': { id: 'chan-1', type: 0, guild_id: 'guild-1', name: 'general' },
        'chan-cur': { id: 'chan-cur', type: 0, guild_id: 'guild-1', name: 'current' },
        'chan-muted': { id: 'chan-muted', type: 0, guild_id: 'guild-1', name: 'noisy' },
        'chan-wl': { id: 'chan-wl', type: 0, guild_id: 'guild-1', name: 'whitelisted' },
        'dm-1': { id: 'dm-1', type: 1 },
        'dm-muted': { id: 'dm-muted', type: 1 },
    };

    const channelStore = { getChannel: (id) => channels[id] ?? null };
    const selectedChannelStore = { getChannelId: () => state.selectedChannel };
    const userGuildSettingsStore = {
        isChannelMuted: (id) => state.mutedChannels.includes(id),
        isCategoryMuted: (id) => state.mutedCategories.includes(id),
        isGuildMuted: (id) => state.mutedGuilds.includes(id),
    };

    const store = [];
    let cursor = 0;
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
        // Real (if trivial) hooks so a settings page can be rendered twice and
        // see whatever its async reload filled in between the passes.
        useState(init) {
            const index = cursor++;
            if (!(index in store)) store[index] = typeof init === 'function' ? init() : init;
            return [store[index], (value) => { store[index] = typeof value === 'function' ? value(store[index]) : value; }];
        },
        useEffect(fn) {
            try {
                fn();
            } catch {}
        },
    };

    const RN = {
        View: 'View',
        Text: 'Text',
        TextInput: 'TextInput',
        Pressable: 'Pressable',
        ScrollView: 'ScrollView',
        Switch: null,
        Image: null,
        processColor: (value) => value,
    };

    const storage = {
        cache: { ...initialSettings },
        use() {
            return this.cache;
        },
        get: async () => storage.cache,
        set: async (patch) => Object.assign(storage.cache, patch),
        subscribe: () => () => {},
    };

    const fileModule = {
        getConstants: () => ({ DocumentsDirPath: '/docs' }),
        readFile: async (path) => {
            if (Object.hasOwn(state.fileContents, path)) return state.fileContents[path];
            throw new Error('ENOENT: ' + path);
        },
        writeFile: async (_dir, name, content) => {
            state.fileContents['/docs/' + name] = content;
        },
        readFileSync: () => '',
    };

    const flux = {
        onFluxEventDispatched(event, handler) {
            const entry = { event, handler };
            state.eventHandlers.push(entry);
            return () => {
                const i = state.eventHandlers.indexOf(entry);
                if (i >= 0) state.eventHandlers.splice(i, 1);
            };
        },
        onAnyFluxEventDispatched(handler) {
            state.anyHandlers.push(handler);
            return () => {
                const i = state.anyHandlers.indexOf(handler);
                if (i >= 0) state.anyHandlers.splice(i, 1);
            };
        },
    };

    const metro = {
        findByDisplayName: (name) => (name === 'React' ? React : name === 'ReactNative' ? RN : null),
        findByStoreName: (name) =>
            ({
                React,
                ChannelStore: channelStore,
                SelectedChannelStore: selectedChannelStore,
                UserGuildSettingsStore: userGuildSettingsStore,
            })[name] ?? null,
        findByProps: (...props) => {
            if (props.includes('deleteMessage')) return null; // no self-delete bypass in this harness
            if (props.includes('updateRows')) {
                state.modules.updateRows ??= {
                    updateRows(_channelId, raw) {
                        state.rows = JSON.parse(raw);
                    },
                };
                return state.modules.updateRows;
            }
            return null;
        },
    };

    const host = {
        react: { React, ReactNative: RN },
        metro,
        discord: {
            flux: {
                ...flux,
                // The real Revenge host exposes Discord's stores here.
                Stores: {
                    ChannelStore: channelStore,
                    SelectedChannelStore: selectedChannelStore,
                    UserGuildSettingsStore: userGuildSettingsStore,
                },
            },
            native: { FileModule: fileModule },
            actions: { ToastActionCreators: { open() {} } },
        },
        plugin: { jsonStorage: storage },
        externals: { ReactNativeClipboard: { Clipboard: clipboard } },
        logger: { log() {}, error: (...args) => state.errors.push(args.map(String).join(' ')) },
    };

    const api = {
        jsonStorage: storage,
        cleanup: (fn) => {
            if (typeof fn === 'function') state.cleanups.push(fn);
        },
        logger: host.logger,
    };

    return { host, api, state, storage, clipboard, React: { reset: () => { cursor = 0; } }, channels };
}

async function boot(initialSettings = {}, options = {}) {
    const h = makeHarness(initialSettings, options);
    const instance = new Function('revenge', 'plugin', 'return ' + code)(h.host, (definition) => definition);
    await instance.start(h.api);
    return { ...h, instance };
}

function handler(h, event) {
    const entry = h.state.eventHandlers.find((e) => e.event === event);
    if (!entry) throw new Error('no handler registered for ' + event);
    return entry.handler;
}

function intercept(h, payload) {
    let result;
    for (const cb of h.state.anyHandlers) result = cb(payload);
    return result;
}

function paint(h, rows) {
    h.state.rows = null;
    h.state.modules.updateRows.updateRows('chan-x', JSON.stringify(rows));
    return h.state.rows;
}

function message(overrides = {}) {
    return {
        id: 'm-1',
        channelId: 'chan-1',
        author: { id: '42', username: 'Alice' },
        content: 'hello',
        timestamp: new Date().toISOString(),
        mentions: [],
        ...overrides,
    };
}

function logged(h) {
    const raw = h.state.fileContents[LOG_FILE];
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

// ---- Shared assertion plumbing --------------------------------------------

const problems = [];
function check(label, condition, detail) {
    if (condition) return;
    problems.push(label + (detail === undefined ? '' : ' — ' + detail));
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

async function renderSettings(h) {
    h.React.reset();
    h.instance.SettingsComponent({ api: h.api });
    await tick();
    h.React.reset();
    return h.instance.SettingsComponent({ api: h.api });
}

function textNodes(node) {
    return collect(node).filter((n) => n.type === 'Text');
}

// Finds a button by the label inside it, so a test can actually press it.
function pressableWith(node, label) {
    return collect(node).find((n) => n.type === 'Pressable' && String(n.children?.children ?? '') === label);
}

function entry(id, status = 'deleted') {
    return {
        id,
        channelId: 'chan-1',
        authorId: '9',
        authorTag: 'Zed',
        content: 'seeded ' + id,
        attachments: [],
        timestamp: Date.now(),
        status,
        edits: [],
        mentionsMe: false,
        ghostPing: false,
    };
}

// ---- Scenarios -------------------------------------------------------------

async function scenarioDefaults() {
    const h = await boot();

    // 1. The loader must not touch `revenge` while evaluating the bundle.
    const evalAccess = [];
    new Function('revenge', 'plugin', 'return ' + code)(
        new Proxy(h.host, {
            get(target, key) {
                evalAccess.push(String(key));
                return target[key];
            },
        }),
        (definition) => definition,
    );
    check('bundle touches revenge at eval time', evalAccess.length === 0, evalAccess.join(','));

    // 2. Settings contract, including every new key (this is what Revenge
    //    seeds jsonStorage with).
    check('SettingsComponent missing', typeof h.instance.SettingsComponent === 'function');
    const defaults = h.instance.jsonStorage?.default ?? {};
    const expected = {
        deleteStyle: 'text',
        logDeletedAttachments: true,
        showEditDiffs: false,
        separatedDiffs: false,
        alwaysLogDirectMessages: true,
        alwaysLogCurrentChannel: true,
        ignoreMutedGuilds: false,
        ignoreMutedCategories: false,
        ignoreMutedChannels: false,
        sortNewest: true,
        logsPerPage: 100,
        maxStored: 300,
    };
    for (const [key, value] of Object.entries(expected)) {
        check('jsonStorage.default.' + key, defaults[key] === value, JSON.stringify(defaults[key]));
    }

    // 3. Listeners.
    for (const event of ['MESSAGE_CREATE', 'MESSAGE_DELETE', 'MESSAGE_DELETE_BULK', 'MESSAGE_UPDATE', 'CHANNEL_SELECT']) {
        check('missing flux listener ' + event, h.state.eventHandlers.some((e) => e.event === event));
    }

    // 4. Settings page renders and carries the new controls.
    const ui = await renderSettings(h);
    const text = JSON.stringify(ui);
    for (const needle of [
        'MessageLogger',
        'SAVED',
        'DELETED',
        'EDITED',
        'Deleted message style',
        'Red overlay',
        'Show edit diffs',
        'Separated diffs',
        'Log deleted attachments',
        'Muted and DMs',
        'Always log DMs',
        'Ignore muted channels',
        'Maximum stored messages',
        'Newest ↓',
        'Import log JSON from clipboard',
        'Saved log',
    ]) {
        check('settings UI missing "' + needle + '"', text.includes(needle));
    }

    // 5. Edit history, diffs off → the plain previous version, no row styling.
    const create = handler(h, 'MESSAGE_CREATE');
    const update = handler(h, 'MESSAGE_UPDATE');
    create({ message: message({ id: 'edit-1', content: 'before' }) });
    const edited = message({ id: 'edit-1', content: 'after' });
    update({ message: edited });
    intercept(h, { type: 'MESSAGE_UPDATE', message: edited });
    const editedRows = paint(h, [{ type: 1, message: { id: 'edit-1', channelId: 'chan-1', content: 'after' } }]);
    const editedRow = editedRows.find((row) => row.message.id === 'edit-1');
    check('edit history not rendered inline', editedRow?.message.content === 'before (edited)\nafter', JSON.stringify(editedRow?.message.content));
    check(
        'edited row still carries plugin highlight styling',
        editedRow &&
            editedRow.message.textColor === undefined &&
            !editedRow.backgroundHighlight &&
            !editedRow.highlight &&
            !editedRow.highlightColor &&
            !editedRow.highlightBackgroundColor &&
            editedRow.message.backgroundColor === undefined,
        JSON.stringify(editedRow),
    );

    // 6. Deleted message with an attachment: red text style, kept in chat, the
    //    attachment marked as gone, and the delete rewritten to automod-keep.
    create({
        message: message({
            id: 'del-1',
            author: { id: '42', username: 'Bob' },
            content: 'hello there',
            attachments: [{ url: 'https://example.com/pic.png' }],
        }),
    });
    const rewrite = intercept(h, { type: 'MESSAGE_DELETE', id: 'del-1', channelId: 'chan-1' });
    check('delete not rewritten into an automod keep event', rewrite?.type === 'MESSAGE_EDIT_FAILED_AUTOMOD', JSON.stringify(rewrite));
    check('automod rewrite lost the content', rewrite?.errorResponseBody?.message === 'hello there', JSON.stringify(rewrite?.errorResponseBody));
    const deletedRows = paint(h, [{ type: 1, message: { id: 'del-1', channelId: 'chan-1', content: 'hello there' } }]);
    const deletedRow = deletedRows.find((row) => row.message.id === 'del-1');
    check('deleted row is not red (default text style)', deletedRow?.message.textColor === '#f04747', JSON.stringify(deletedRow?.message));
    check('deleted row lost its red gutter', deletedRow?.backgroundHighlight?.gutterColor === '#f04747', JSON.stringify(deletedRow?.backgroundHighlight));
    check('deleted marker missing', String(deletedRow?.message.edited).startsWith('(deleted by Bob'), String(deletedRow?.message.edited));
    check(
        'deleted attachment not marked on the row',
        String(deletedRow?.message.content).endsWith('*(deleted attachment)*'),
        JSON.stringify(deletedRow?.message.content),
    );

    await tick();
    const log = logged(h);
    check('deleted message not persisted', log['del-1']?.status === 'deleted', JSON.stringify(log['del-1']));
    check('edited message not persisted', log['edit-1']?.status === 'edited', JSON.stringify(log['edit-1']));
    check('edit history not persisted', Array.isArray(log['edit-1']?.edits) && log['edit-1'].edits[0] === 'before', JSON.stringify(log['edit-1']?.edits));

    // 7. FakeDM-style removals (`mlDeleted`) must vanish and never be logged.
    const fakedm = intercept(h, { type: 'MESSAGE_DELETE', id: 'fake-1', channelId: 'chan-1', mlDeleted: true });
    await tick();
    check('mlDeleted delete was kept in chat', fakedm === undefined, JSON.stringify(fakedm));
    check('mlDeleted message was logged', !Object.hasOwn(logged(h), 'fake-1'), JSON.stringify(logged(h)['fake-1']));
    const fakeRows = paint(h, [{ type: 1, message: { id: 'fake-1', channelId: 'chan-1', content: 'fake dm' } }]);
    check('mlDeleted row got painted as deleted', fakeRows[0]?.message.textColor === undefined, JSON.stringify(fakeRows[0]?.message));

    await h.instance.stop();
}

async function scenarioOverlayAndDiffs() {
    const h = await boot({ deleteStyle: 'overlay', showEditDiffs: true, logsPerPage: 10 });

    // Overlay style: normal text, red overlay, no gutter.
    createDelete(h, 'del-overlay', 'gone');
    const rows = paint(h, [{ type: 1, message: { id: 'del-overlay', channelId: 'chan-1', content: 'gone' } }]);
    const row = rows[0];
    check('overlay style kept the red text', row?.message.textColor === undefined, JSON.stringify(row?.message));
    check('overlay style missing its background', row?.backgroundHighlight?.backgroundColor === '#f0474740', JSON.stringify(row?.backgroundHighlight));
    check('overlay style still painted a gutter', row?.backgroundHighlight?.gutterColor === undefined, JSON.stringify(row?.backgroundHighlight));

    // Inline edit diffs (single line form).
    const create = handler(h, 'MESSAGE_CREATE');
    const update = handler(h, 'MESSAGE_UPDATE');
    create({ message: message({ id: 'diff-1', content: 'the quick brown fox' }) });
    const next = message({ id: 'diff-1', content: 'the slow brown fox' });
    update({ message: next });
    intercept(h, { type: 'MESSAGE_UPDATE', message: next });
    const diffRows = paint(h, [{ type: 1, message: { id: 'diff-1', channelId: 'chan-1', content: 'the slow brown fox' } }]);
    const content = String(diffRows[0]?.message.content ?? '');
    check('diff missing the removed word', content.includes('~~quick~~'), content);
    check('diff missing the added word', content.includes('__slow__'), content);
    check('diff dropped the unchanged text', content.includes('the ~~quick~~ __slow__ brown fox'), content);

    // The log viewer renders the same diff with colours.
    const ui = await renderSettings(h);
    const texts = textNodes(ui).map((n) => ({ text: String(n.children ?? ''), color: n.props?.style?.color }));
    check(
        'viewer diff missing the struck-through removal',
        texts.some((t) => t.text === 'quick' && t.color === '#f23f43'),
        JSON.stringify(texts.filter((t) => t.text === 'quick' || t.text === 'slow')),
    );
    check(
        'viewer diff missing the highlighted addition',
        texts.some((t) => t.text === 'slow' && t.color === '#3ba55d'),
        JSON.stringify(texts.filter((t) => t.text === 'quick' || t.text === 'slow')),
    );

    await h.instance.stop();
}

async function scenarioSeparatedDiffs() {
    const h = await boot({ showEditDiffs: true, separatedDiffs: true });
    const create = handler(h, 'MESSAGE_CREATE');
    const update = handler(h, 'MESSAGE_UPDATE');
    create({ message: message({ id: 'diff-2', content: 'the quick brown fox' }) });
    const next = message({ id: 'diff-2', content: 'the slow brown fox' });
    update({ message: next });
    intercept(h, { type: 'MESSAGE_UPDATE', message: next });
    const rows = paint(h, [{ type: 1, message: { id: 'diff-2', channelId: 'chan-1', content: 'the slow brown fox' } }]);
    const lines = String(rows[0]?.message.content ?? '').split('\n');
    check('separated diff did not put removals on their own line', lines[0] === '~~quick~~', JSON.stringify(lines));
    check('separated diff did not put additions on their own line', lines[1] === '__slow__ (edited)', JSON.stringify(lines));
    await h.instance.stop();
}

function createDelete(h, id, content, overrides = {}) {
    handler(h, 'MESSAGE_CREATE')({ message: message({ id, content, ...overrides }) });
    return intercept(h, { type: 'MESSAGE_DELETE', id, channelId: overrides.channelId ?? 'chan-1' });
}

async function scenarioImportExport() {
    const h = await boot({}, { clipboardRead: JSON.stringify([entry('imp-1')]) });

    let ui = await renderSettings(h);
    const importButton = pressableWith(ui, 'Import log JSON from clipboard (merges)');
    check('import button missing', !!importButton);
    if (importButton) await importButton.props.onPress();
    await tick();
    check('clipboard import did not add the entry', Object.hasOwn(logged(h), 'imp-1'), JSON.stringify(Object.keys(logged(h))));

    ui = await renderSettings(h);
    const exportButton = pressableWith(ui, 'Copy log JSON to clipboard');
    check('export button missing', !!exportButton);
    if (exportButton) await exportButton.props.onPress();
    check('export did not copy the merged log', String(h.clipboard.last ?? '').includes('imp-1'), String(h.clipboard.last ?? '').slice(0, 60));

    await h.instance.stop();
}

async function scenarioPaging() {
    const seeded = {};
    for (let i = 0; i < 12; i++) seeded['pg-' + i] = entry('pg-' + i);
    const h = await boot({ logsPerPage: 10 }, { seededLog: seeded });
    const ui = await renderSettings(h);
    const text = JSON.stringify(ui);
    check('pagination did not cap the window', text.includes('Saved log (10 of 12)'), 'no "10 of 12"');
    check('load-more control missing', text.includes('Load 10 more (2 remaining)'), 'no load-more label');
    await h.instance.stop();
}

async function scenarioFilters() {
    const h = await boot(
        { ignoreMutedChannels: true, alwaysLogCurrentChannel: false },
        { mutedChannels: ['chan-muted', 'dm-muted'], selectedChannel: 'chan-1' },
    );

    createDelete(h, 'mute-1', 'muted channel', { channelId: 'chan-muted' });
    await tick();
    check('muted channel was still logged', !Object.hasOwn(logged(h), 'mute-1'), JSON.stringify(logged(h)['mute-1']));

    createDelete(h, 'dm-1', 'muted dm', { channelId: 'dm-muted' });
    await tick();
    check('always-log DMs lost to a muted DM', Object.hasOwn(logged(h), 'dm-1'), 'dm was skipped');

    // A channel you are looking at stays logged even when muted (MLE parity).
    const cur = await boot({ ignoreMutedChannels: true }, { mutedChannels: ['chan-cur'], selectedChannel: 'chan-cur' });
    createDelete(cur, 'cur-1', 'current channel', { channelId: 'chan-cur' });
    await tick();
    check('always-log current channel lost to a muted channel', Object.hasOwn(logged(cur), 'cur-1'), 'current channel was skipped');
    await cur.instance.stop();

    // Whitelist beats a mute.
    const wl = await boot({ ignoreMutedChannels: true, whitelistedIds: 'chan-wl' }, { mutedChannels: ['chan-wl'] });
    createDelete(wl, 'wl-1', 'whitelisted', { channelId: 'chan-wl' });
    await tick();
    check('whitelist lost to a muted channel', Object.hasOwn(logged(wl), 'wl-1'), 'whitelisted channel was skipped');
    await wl.instance.stop();

    // Explicit ignores beat whitelists (MLE: the blacklist has top priority).
    const bl = await boot({ whitelistedIds: 'chan-wl', ignoredChannels: 'chan-wl' }, {});
    createDelete(bl, 'bl-1', 'blacklisted', { channelId: 'chan-wl' });
    await tick();
    check('ignored channel was logged despite the ignore list', !Object.hasOwn(logged(bl), 'bl-1'), JSON.stringify(logged(bl)['bl-1']));
    await bl.instance.stop();

    await h.instance.stop();
}

async function main() {
    await scenarioDefaults();
    await scenarioOverlayAndDiffs();
    await scenarioSeparatedDiffs();
    await scenarioImportExport();
    await scenarioPaging();
    await scenarioFilters();

    if (problems.length) {
        console.error('VERIFY FAILED: ' + problems.length + ' problem(s)');
        for (const problem of problems) console.error('  - ' + problem);
        process.exit(1);
    }
    console.log('VERIFY OK: defaults, filters, delete styles, edit diffs, viewer, paging, import/export and persistence');
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
