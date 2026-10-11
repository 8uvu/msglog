// Confirms the *published* host serves exactly what this worktree built: the
// index entry, the pool zip bytes and the folder-URL files. A green build and a
// green Actions run do not prove a browser gets the new bundle, which is the
// whole reason this exists.
//
// Usage:
//   node scripts/verify-live.cjs                          # one pass
//   node scripts/verify-live.cjs --wait 240               # retry until it is live
//   node scripts/verify-live.cjs --id dev.8uvu.message-logger --version 1.7.1
//
// Exit codes: 0 live and matching, 1 mismatch, 2 not live yet (still
// propagating / deploy not finished).
const { createHash } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
    const i = argv.indexOf('--' + name);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes('--' + name);

const DIST = join(__dirname, '..', 'dist');
const BASE = String(arg('base', 'https://8uvu.github.io/msglog')).replace(/\/+$/, '');
const WAIT = Number(arg('wait', 0));
const ONLY_ID = arg('id');
const ONLY_VERSION = arg('version');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const problems = [];
const pending = [];

if (!existsSync(join(DIST, 'index.json'))) {
    console.error('no dist/index.json — run `node build.mjs` first');
    process.exit(1);
}

const local = JSON.parse(readFileSync(join(DIST, 'index.json'), 'utf8'));

async function get(path, bust) {
    const url = BASE + path + (bust ? (path.includes('?') ? '&' : '?') + 't=' + Date.now() : '');
    const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return Buffer.from(await response.arrayBuffer());
}

function targets() {
    const out = [];
    for (const [id, plugin] of Object.entries(local.plugins ?? {})) {
        if (ONLY_ID && id !== ONLY_ID) continue;
        for (const [version, entry] of Object.entries(plugin.versions ?? {})) {
            if (ONLY_VERSION && version !== ONLY_VERSION) continue;
            out.push({ id, version, entry, latest: plugin.channels?.latest });
        }
    }
    return out;
}

async function check(attempt) {
    problems.length = 0;
    pending.length = 0;

    let liveIndex = null;
    try {
        liveIndex = JSON.parse((await get('/index.json', attempt > 0)).toString('utf8'));
    } catch (error) {
        pending.push(`index.json not served yet (${error.message})`);
    }

    for (const { id, version, entry, latest } of targets()) {
        const label = `${id}@${version}`;

        if (liveIndex) {
            const published = liveIndex.plugins?.[id];
            if (!published) problems.push(`${label}: the published index does not list ${id}`);
            else {
                if (!(version in (published.versions ?? {}))) pending.push(`${label}: not in the published index yet`);
                else {
                    const entryLive = published.versions[version];
                    if (entryLive.sha256 !== entry.sha256 || entryLive.size !== entry.size) {
                        problems.push(`${label}: published index entry differs from the built one (${entryLive.sha256}/${entryLive.size} vs ${entry.sha256}/${entry.size})`);
                    }
                }
                if (!ONLY_VERSION && version === latest && published.channels?.latest !== version) {
                    pending.push(`${label}: published latest is ${published.channels?.latest}`);
                }
            }
        }

        try {
            const zip = await get(`/pool/${label}.zip`, attempt > 0);
            if (zip.length !== entry.size) problems.push(`${label}: served zip is ${zip.length} bytes, built zip is ${entry.size}`);
            else if (sha256(zip) !== entry.sha256) problems.push(`${label}: served zip hash ${sha256(zip).slice(0, 12)}… does not match the built hash`);
        } catch (error) {
            pending.push(`${label}: zip not served yet (${error.message})`);
        }

        const localBundle = join(DIST, id, 'index.js');
        const localManifest = join(DIST, id, 'manifest.json');
        if (!existsSync(localBundle) || !existsSync(localManifest)) continue;
        try {
            const servedManifest = JSON.parse((await get(`/${id}/manifest.json`, attempt > 0)).toString('utf8'));
            if (servedManifest.version !== version) pending.push(`${label}: folder manifest still ${servedManifest.version}`);
            const servedBundle = await get(`/${id}/index.js`, attempt > 0);
            if (sha256(servedBundle) !== sha256(readFileSync(localBundle))) {
                problems.push(`${label}: folder-URL bundle does not match the built bundle`);
            }
        } catch (error) {
            pending.push(`${label}: folder install not served yet (${error.message})`);
        }
    }

    // The root install is what the bare repository URL fetches.
    if (!ONLY_ID) {
        try {
            const rootManifest = JSON.parse((await get('/manifest.json', attempt > 0)).toString('utf8'));
            const rootLocal = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
            if (rootManifest.id !== rootLocal.id) problems.push(`root install serves ${rootManifest.id}, built ${rootLocal.id}`);
            const rootBundle = await get('/index.js', attempt > 0);
            if (sha256(rootBundle) !== sha256(readFileSync(join(DIST, 'index.js')))) problems.push('root index.js does not match the built bundle');
        } catch (error) {
            pending.push(`root install not served yet (${error.message})`);
        }
    }
}

async function main() {
    const deadline = Date.now() + WAIT * 1000;
    let attempt = 0;
    for (;;) {
        attempt++;
        await check(attempt);
        for (const problem of problems) console.error('  ! ' + problem);
        if (!problems.length && !pending.length) break;
        if (problems.length) break;
        for (const note of pending) console.log(`  … ${note}`);
        if (Date.now() >= deadline || attempt >= 60) break;
        console.log(`retrying in 10s (${Math.max(0, Math.round((deadline - Date.now()) / 1000))}s left)`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    if (problems.length) {
        console.error(`LIVE VERIFY FAILED: the published bundle does not match this build (${problems.length} problem(s))`);
        process.exit(1);
    }
    if (pending.length) {
        console.error(`LIVE VERIFY PENDING: published host has not caught up yet (${pending.length} item(s))`);
        process.exit(2);
    }
    console.log(`LIVE VERIFY OK: ${BASE} serves this build (${targets().length} artifact(s))`);
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
