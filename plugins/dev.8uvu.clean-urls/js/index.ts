// Clean URLs for Revenge, by 8uvu.
// Port of the Vencord/Equicord "cleanLinks" idea to mobile: strips tracking
// parameters (utm_*, fbclid, gclid, igshid, ...) from links in messages
// before they render, by patching MESSAGE_CREATE / MESSAGE_UPDATE in flux.
//
// HOST-COMPAT RULES (same as MessageLogger):
// - UNIVERSAL BUILD for Revenge Next AND Classic:
//   * Next wraps the script as `return <script>` inside
//     new Function('revenge','plugin',...) and uses <result>.default.
//   * Classic wraps it as `(bunny,definePlugin)=>{<script>; return
//     plugin?.default ?? plugin}` — so the script must ASSIGN a `plugin`
//     variable (globalThis.plugin). The build wrapper does this.
//   => ZERO host-global property access at eval time on either host.
// - start() gets no arguments on Classic (api via `bunny` global) and the
//   API object on Next, so it adapts to whichever is present.
// - No JSX (jsx-runtime paths differ across builds).

declare const revenge: any;
declare const bunny: any;
declare const vendetta: any;
declare const plugin: any;

interface Settings {
    enabled: boolean;
    mode: 'blacklist' | 'whitelist';
    customBlacklist: string;
    customWhitelist: string;
}

const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    mode: 'blacklist',
    customBlacklist: '',
    customWhitelist: '',
};

// Known tracking params (exact matches, lowercase).
const TRACKING_PARAMS = new Set([
    'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'msclkid',
    'twclid', 'ttclid', 'yclid', 'igshid', 'igsh', 'si', 'mkt_tok', 'mc_eid',
    'mc_cid', '_hsenc', '_hsmi', 'vero_conv', 'vero_id', 'ref_src', 'ref_url',
    'spm', 'scm', 'share_source', 'share_medium', 'tt_from', 's_kwcid',
    'elqtrackid', 'trk_contact', 'trk_msg', 'trk_module', 'trk_sid',
    'rb_clickid', 'oly_anon_id', 'oly_enc_id', 'wickedid', 'hsa_cam',
    'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_tgt', 'hsa_kw', 'hsa_mt', 'hsa_net',
    'hsa_ver', 'ml_subscriber', 'ml_subscriber_hash', 'trk',
]);

// Known tracking param prefixes (lowercase).
const TRACKING_PREFIXES = ['utm_', 'fb_', 'ga_', 'mc_', 'matomo_', 'pk_', 'mtm_'];

// ---- Lazy host accessors ---------------------------------------------------

function getFlux(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const f: any = revenge.discord?.flux;
            if (f && typeof f.onFluxEventDispatched === 'function') return f;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const f: any = bunny.api?.flux;
            if (f && typeof f.intercept === 'function') {
                // Adapt Classic's intercept (all events) to the Next-style
                // onFluxEventDispatched(type, patch) signature.
                return {
                    onFluxEventDispatched: (type: string, patch: (payload: any) => any) =>
                        f.intercept((payload: any) => {
                            if (payload?.type !== type) return;
                            return patch(payload);
                        }),
                };
            }
        }
    } catch {}
    try {
        if (typeof vendetta !== 'undefined') {
            const fd: any = (vendetta as any)?.common?.FluxDispatcher;
            if (fd && typeof fd.addInterceptor === 'function') {
                // Vendetta-manager path: the dispatcher's interceptors see
                // every dispatch; returning false blocks, undefined passes.
                return {
                    onFluxEventDispatched: (type: string, patch: (payload: any) => any) =>
                        fd.addInterceptor((payload: any) => {
                            if (payload?.type !== type) return;
                            return patch(payload);
                        }),
                };
            }
        }
    } catch {}
    return null;
}

// ---- Settings --------------------------------------------------------------

let cfg: Settings = { ...DEFAULT_SETTINGS };
let cfgStorage: any = null;
let hostKind: 'next' | 'classic' = 'next';

function coerce(raw: any): Settings {
    const c = raw && typeof raw === 'object' ? raw : {};
    return {
        enabled: c.enabled !== false,
        mode: c.mode === 'whitelist' ? 'whitelist' : 'blacklist',
        customBlacklist: typeof c.customBlacklist === 'string' ? c.customBlacklist : '',
        customWhitelist: typeof c.customWhitelist === 'string' ? c.customWhitelist : '',
    };
}

function refreshConfig() {
    try {
        if (cfgStorage?.cache && typeof cfgStorage.cache === 'object') cfg = coerce(cfgStorage.cache);
    } catch {}
}

function splitList(raw: string): Set<string> {
    return new Set(
        raw
            .split(/[\s,]+/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
    );
}

// ---- URL cleaning -----------------------------------------------------------

function isTracked(key: string, custom: Set<string>): boolean {
    return TRACKING_PARAMS.has(key) || TRACKING_PREFIXES.some((p) => key.startsWith(p)) || custom.has(key);
}

function cleanUrl(url: string): string {
    const schemeEnd = url.indexOf('://');
    const hostStart = schemeEnd === -1 ? (url.startsWith('//') ? 2 : 0) : schemeEnd + 3;
    const afterHost = url.indexOf('/', hostStart);
    const authority = afterHost === -1 ? url : url.slice(0, afterHost);
    const rest = afterHost === -1 ? '' : url.slice(afterHost);

    const queryStart = rest.indexOf('?');
    if (queryStart === -1) return url;
    const hashStart = rest.indexOf('#');
    const path = rest.slice(0, queryStart);
    const queryEnd = hashStart === -1 ? rest.length : hashStart;
    const query = rest.slice(queryStart + 1, queryEnd);
    const hashPart = hashStart === -1 ? '' : rest.slice(hashStart);

    const keep: string[] = [];
    const custom = splitList(cfg.mode === 'whitelist' ? cfg.customWhitelist : cfg.customBlacklist);
    for (const pair of query.split('&')) {
        if (!pair) continue;
        const eq = pair.indexOf('=');
        const rawKey = eq === -1 ? pair : pair.slice(0, eq);
        let key = rawKey;
        try {
            key = decodeURIComponent(rawKey);
        } catch {}
        key = key.toLowerCase();

        if (cfg.mode === 'whitelist') {
            if (custom.size === 0 || custom.has(key)) keep.push(pair);
        } else if (!isTracked(key, custom)) {
            keep.push(pair);
        }
    }

    const cleaned = path + (keep.length ? '?' + keep.join('&') : '') + hashPart;
    return authority + cleaned;
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

function cleanText(text: string): string {
    if (!text || typeof text !== 'string' || !text.includes('?')) return text;
    return text.replace(URL_RE, (m) => {
        // Trailing punctuation that is part of the sentence, not the URL.
        const trimmed = m.match(/[.,;:!?]+$/);
        const body = trimmed ? m.slice(0, m.length - trimmed[0].length) : m;
        return cleanUrl(body) + (trimmed ? trimmed[0] : '');
    });
}

function handlePayload(payload: any) {
    if (!cfg.enabled) return payload;
    const message = payload?.message;
    if (!message || typeof message.content !== 'string') return payload;
    const cleaned = cleanText(message.content);
    if (cleaned !== message.content) message.content = cleaned;
    return payload;
}

// ---- Settings UI (React, no JSX) --------------------------------------------

function makeSettingsComponent() {
    const React = getReact();
    if (!React) return () => null;
    const el = React.createElement.bind(React);
    const RN: any = getRN() || {};
    const { View = 'view', Text = 'text', TextInput = 'input', Pressable = View } = RN;

    const SwitchRowFallback = (props: any) =>
        el(
            Pressable,
            {
                onPress: () => props.onValueChange(!props.value),
                style: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
            },
            el(Text, { style: { flex: 1 } }, props.label),
            el(Text, { style: { opacity: 0.7, marginLeft: 8 } }, props.value ? 'On' : 'Off'),
        );

    function SwitchRow(props: any) {
        let design: any = null;
        try {
            design = (revenge as any).discord.design;
        } catch {}
        const Row = design?.TableSwitchRow ?? design?.Design?.TableSwitchRow;
        if (Row) return el(Row, props, null);
        return el(SwitchRowFallback, props, null);
    }

    function RowGroup(props: any) {
        let design: any = null;
        try {
            design = (revenge as any).discord.design;
        } catch {}
        const Group = design?.TableRowGroup ?? design?.Design?.TableRowGroup;
        if (Group) return el(Group, { title: props.title }, ...props.children);
        return el(
            View,
            { style: { marginVertical: 8 } },
            el(Text, { style: { fontWeight: 'bold', padding: 12 } }, props.title),
            ...props.children,
        );
    }

    return function SettingsComponent(props: any) {
        // Classic renders this with no props; Next passes { api }.
        const api: any = props?.api ?? classicSettingsApi();
        const settings = api?.jsonStorage?.use?.() ?? cfg;
        const [, force] = React.useState(0);

        React.useEffect(() => {
            settingsChangedCb = () => force((n: number) => n + 1);
            return () => {
                settingsChangedCb = null;
            };
        }, []);

        const toggleMode = (mode: 'blacklist' | 'whitelist') => {
            api?.jsonStorage?.set?.({ mode });
            force((n: number) => n + 1);
        };

        const btn = (mode: 'blacklist' | 'whitelist', label: string) =>
            el(
                Pressable,
                {
                    key: mode,
                    onPress: () => toggleMode(mode),
                    style: { paddingVertical: 8, paddingHorizontal: 12 },
                },
                el(Text, { style: { fontWeight: settings?.mode === mode ? 'bold' : 'normal' } }, label),
            );

        return el(
            View,
            null,
            el(
                RowGroup,
                { title: 'Clean URLs' },
                el(SwitchRow, {
                    key: 'enabled',
                    label: 'Enabled',
                    value: settings?.enabled !== false,
                    onValueChange: (v: boolean) => api?.jsonStorage?.set?.({ enabled: v }),
                }),
                el(View, { style: { flexDirection: 'row', paddingVertical: 4 } }, btn('blacklist', 'Blacklist mode'), btn('whitelist', 'Whitelist mode')),
                el(Text, { style: { paddingHorizontal: 16, opacity: 0.7 } },
                    settings?.mode === 'whitelist'
                        ? 'Only keep the query parameters listed below.'
                        : 'Strip known tracking parameters (plus any custom ones below).',
                ),
            ),
            el(
                RowGroup,
                { title: settings?.mode === 'whitelist' ? 'Whitelisted parameters' : 'Extra blacklisted parameters' },
                el(TextInput, {
                    placeholder: settings?.mode === 'whitelist' ? 'ref, q, …' : 'my_param, another_one, …',
                    defaultValue: settings?.mode === 'whitelist' ? settings?.customWhitelist ?? '' : settings?.customBlacklist ?? '',
                    onChangeText: (t: string) =>
                        api?.jsonStorage?.set?.(
                            settings?.mode === 'whitelist' ? { customWhitelist: t } : { customBlacklist: t },
                        ),
                    style: { padding: 8 },
                }),
            ),
        );
    };
}

// ---- Plugin definition -------------------------------------------------------

// Host accessors are existence-probed so the same bundle runs on both hosts.
function getReact(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const r: any = revenge.react;
            if (r) return r.React || r;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            const r = b.React || b.common?.React || b.api?.react?.React;
            if (r) return r;
        }
    } catch {}
    try {
        const r: any = (vendetta as any)?.common?.React;
        if (r) return r;
    } catch {}
    return null;
}

function getRN(): any {
    try {
        if (typeof revenge !== 'undefined') {
            const rn: any = revenge.react?.ReactNative;
            if (rn) return rn;
        }
    } catch {}
    try {
        if (typeof bunny !== 'undefined') {
            const b: any = bunny;
            const rn = b.ReactNative || b.common?.ReactNative;
            if (rn) return rn;
        }
    } catch {}
    try {
        const rn: any = (vendetta as any)?.common?.ReactNative;
        if (rn) return rn;
    } catch {}
    return null;
}

let classicDisposers: Array<() => void> = [];
let classicStorageProxy: any = null;
let classicStorageKind: 'bunny' | 'vendetta' | null = null;

function refreshClassicConfig() {
    try {
        const data = classicStorageKind === 'vendetta' ? classicStorageProxy : classicStorageProxy?.data;
        if (data && typeof data === 'object') cfg = coerce(data.settings);
    } catch {}
}

function classicSettingsApi(): any {
    return {
        use: () => ({ ...cfg }),
        set: (update: any) => {
            try {
                if (!classicStorageProxy || typeof classicStorageProxy !== 'object') return;
                if (classicStorageKind === 'vendetta') {
                    classicStorageProxy.settings = { ...coerce(classicStorageProxy.settings), ...update };
                } else {
                    const data = classicStorageProxy.data && typeof classicStorageProxy.data === 'object' ? classicStorageProxy.data : {};
                    classicStorageProxy.data = {
                        ...data,
                        settings: { ...coerce(data.settings), ...update },
                    };
                }
                refreshClassicConfig();
                settingsChangedCb?.();
            } catch {}
        },
    };
}

let settingsChangedCb: (() => void) | null = null;

async function startClassic() {
    const b: any = (typeof bunny !== 'undefined' && bunny) || {};
    const v: any = typeof vendetta !== 'undefined' ? vendetta : null;
    const p = b.plugin ?? v ?? {};
    try {
        if (!b.plugin?.createStorage && v?.plugin?.storage && typeof v.plugin.storage === 'object') {
            // Vendetta-manager path: plain MMKV proxy, no .data wrapper.
            classicStorageProxy = v.plugin.storage;
            classicStorageKind = 'vendetta';
            if (!classicStorageProxy.settings || typeof classicStorageProxy.settings !== 'object') {
                classicStorageProxy.settings = { ...DEFAULT_SETTINGS };
            }
            const emitter = classicStorageProxy[Symbol.for('vendetta.storage.emitter')];
            const off = emitter?.on?.('SET', () => {
                try {
                    refreshClassicConfig();
                } catch {}
            });
            if (typeof off === 'function') classicDisposers.push(off);
            refreshClassicConfig();
        }
        const store = p.createStorage?.();
        const promise = store?.[Symbol.for('bunny.storage.promise')];
        if (promise && typeof promise.then === 'function') await promise.catch(() => {});
        if (store && typeof store === 'object') {
            classicStorageProxy = store;
            classicStorageKind = 'bunny';
            const data = store.data && typeof store.data === 'object' ? store.data : {};
            if (!data.settings) store.data = { ...data, settings: { ...DEFAULT_SETTINGS } };
            refreshClassicConfig();
            const emitter = store[Symbol.for('vendetta.storage.emitter')];
            const off = emitter?.on?.('SET', () => {
                try {
                    refreshClassicConfig();
                } catch {}
            });
            if (typeof off === 'function') classicDisposers.push(off);
        }
    } catch (e) {
        p.logger?.error?.('[CleanUrls] classic storage unavailable, using defaults', e);
    }

    const flux = getFlux();
    if (!flux || typeof flux.onFluxEventDispatched !== 'function') {
        p.logger?.error?.('[CleanUrls] flux API unavailable — plugin idle this session');
        return;
    }

    for (const event of ['MESSAGE_CREATE', 'MESSAGE_UPDATE']) {
        try {
            const off = flux.onFluxEventDispatched(event, (payload: any) => {
                try {
                    return handlePayload(payload);
                } catch {
                    return payload;
                }
            });
            if (typeof off === 'function') classicDisposers.push(off);
            p.logger?.log?.('[CleanUrls] registered ' + event);
        } catch (e) {
            p.logger?.error?.('[CleanUrls] could not register ' + event, e);
        }
    }

    p.logger?.log?.('[CleanUrls] started (Revenge Classic / vendetta host)');
}

// Constructed on first render, not at eval time.
let _SettingsComponent: any = null;
function SettingsComponent(props: any) {
    if (!_SettingsComponent) {
        _SettingsComponent = makeSettingsComponent();
    }
    if (hostKind !== 'next') refreshClassicConfig();
    return _SettingsComponent(props);
}

// Universal instance: Revenge Classic's loader reads `plugin?.default ??
// plugin` from the script scope; Revenge Next injects a `plugin` factory and
// reads <result>.default — when present we pass the instance through it.
let __instance: any = {
    jsonStorage: {
        load: true,
        default: DEFAULT_SETTINGS,
    },
    async start(api: any) {
        try {
            if (api && typeof api === 'object' && (api.cleanup || api.jsonStorage)) {
                // Revenge Next passes the API object into start().
                hostKind = 'next';
                const { cleanup, jsonStorage, logger } = api;
                cfgStorage = jsonStorage ?? null;
                refreshConfig();
                if (jsonStorage) {
                    try {
                        await jsonStorage.get();
                        refreshConfig();
                        cleanup(jsonStorage.subscribe(() => refreshConfig()));
                    } catch (e) {
                        logger?.error?.('[CleanUrls] jsonStorage unavailable, using defaults', e);
                    }
                }

                const flux = getFlux();
                if (!flux || typeof flux.onFluxEventDispatched !== 'function') {
                    logger?.error?.('[CleanUrls] flux API unavailable — plugin idle this session');
                    return;
                }

                for (const event of ['MESSAGE_CREATE', 'MESSAGE_UPDATE']) {
                    try {
                        cleanup(
                            flux.onFluxEventDispatched(event, (payload: any) => {
                                try {
                                    return handlePayload(payload);
                                } catch {
                                    return payload;
                                }
                            }),
                        );
                        logger?.log?.('[CleanUrls] registered ' + event);
                    } catch (e) {
                        logger?.error?.('[CleanUrls] could not register ' + event, e);
                    }
                }

                logger?.log?.('[CleanUrls] started (Revenge Next)');
            } else {
                // Revenge Classic calls start() with no arguments.
                hostKind = 'classic';
                await startClassic();
            }
        } catch (e) {
            // Best-effort host logging.
            try {
                (typeof bunny !== 'undefined' ? bunny.plugin?.logger : null)?.error?.('[CleanUrls] start failed', e);
            } catch {}
        }
    },
    stop() {
        while (classicDisposers.length) {
            try {
                classicDisposers.pop()?.();
            } catch {}
        }
    },
    SettingsComponent,
};

if (typeof plugin === 'function') {
    // Revenge Next: consume the injected factory (registers the options).
    __instance = plugin(__instance);
}
globalThis.plugin = __instance;

// Vendetta-manager compat: that loader reads {onLoad, onUnload, settings}
// from the evaluated result and calls onLoad() with no arguments.
__instance.onLoad = function () {
    return __instance.start?.();
};
__instance.onUnload = function () {
    return __instance.stop?.();
};
__instance.settings = __instance.SettingsComponent;

export default globalThis.plugin;
