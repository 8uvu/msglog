// Clean URLs for Revenge, by 8uvu.
// Port of the Vencord/Equicord "cleanLinks" idea to mobile: strips tracking
// parameters (utm_*, fbclid, gclid, igshid, ...) from links in messages
// before they render, by patching MESSAGE_CREATE / MESSAGE_UPDATE in flux.
//
// HOST-COMPAT RULES (same as MessageLogger):
// - The client evaluates this bundle as `return <bundle>`; a throw during
//   evaluation marks the plugin "failed" and disables it. ZERO `revenge.*`
//   access at eval time — everything is resolved lazily inside functions.
// - No JSX (jsx-runtime paths differ across Revenge versions).

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
        return (revenge as any).discord.flux || null;
    } catch {
        return null;
    }
}

// ---- Settings --------------------------------------------------------------

let cfg: Settings = { ...DEFAULT_SETTINGS };
let cfgStorage: any = null;

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
    const React = (function () {
        try {
            const r: any = (revenge as any).react;
            return r.React || r;
        } catch {
            return null;
        }
    })();
    if (!React) return () => null;
    const el = React.createElement.bind(React);
    const RN: any = (function () {
        try {
            return (revenge as any).react.ReactNative || {};
        } catch {
            return {};
        }
    })();
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

    return function SettingsComponent({ api }: any) {
        const settings = api?.jsonStorage?.use?.() ?? cfg;
        const [, force] = React.useState(0);

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

let _SettingsComponent: any = null;
function SettingsComponent(props: any) {
    if (!_SettingsComponent) _SettingsComponent = makeSettingsComponent();
    return _SettingsComponent(props);
}

// ---- Plugin definition -------------------------------------------------------

const index_default = plugin({
    jsonStorage: {
        load: true,
        default: DEFAULT_SETTINGS,
    },
    async start({ cleanup, jsonStorage, logger }: any) {
        try {
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

            logger?.log?.('[CleanUrls] started');
        } catch (e) {
            logger?.error?.('[CleanUrls] start failed', e);
        }
    },
    SettingsComponent,
});

export default index_default;
