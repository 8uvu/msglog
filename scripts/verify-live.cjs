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
const { unzipSync } = require('fflate');

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

// The folder-URL install for a plugin: the manifest the host publishes and the
// bundle users actually run. This is what "the same code" is measured against.
function localInstall(id) {
    const dir = join(DIST, id);
    const bundlePath = join(dir, 'index.js');
    const manifestPath = join(dir, 'manifest.json');
    if (!existsSync(bundlePath) || !existsSync(manifestPath)) return null;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return { bundlePath, script: manifest.dist?.script ?? manifest.main ?? 'index.js' };
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
        // There are two different questions here, and conflating them made this
        // checker cry wolf on its first run. "Is the host serving what its own
        // index promises?" must hold for every artifact; "is it serving the
        // bytes this worktree built?" only makes sense for the version being
        // released (older pool entries came from an earlier toolchain, before
        // the zip timestamps were pinned). And a file the host has not replaced
        // yet is propagation, not a failure.
        const isTarget = ONLY_VERSION ? version === ONLY_VERSION : version === latest;
        const published = liveIndex?.plugins?.[id] ?? null;
        const publishedEntry = published?.versions?.[version] ?? null;

        if (liveIndex && !published) {
            problems.push(`${label}: the published index does not list ${id}`);
        } else if (liveIndex && !publishedEntry) {
            pending.push(`${label}: not in the published index yet`);
        } else if (publishedEntry && ONLY_VERSION && (publishedEntry.sha256 !== entry.sha256 || publishedEntry.size !== entry.size)) {
            problems.push(
                `${label}: the published artifact is not the one built here (${String(publishedEntry.sha256).slice(0, 12)}…/${publishedEntry.size} vs ${entry.sha256.slice(0, 12)}…/${entry.size})`,
            );
        }
        if (published && !ONLY_VERSION && version === latest && published.channels?.latest !== version) {
            pending.push(`${label}: published latest is ${published.channels?.latest}`);
        }

        const local = localInstall(id);
        try {
            const zip = await get(`/pool/${label}.zip`, attempt > 0);
            const served = sha256(zip);
            if (publishedEntry && (served !== publishedEntry.sha256 || zip.length !== publishedEntry.size)) {
                problems.push(
                    `${label}: the host serves ${served.slice(0, 12)}… (${zip.length} bytes) while its own index advertises ${String(publishedEntry.sha256).slice(0, 12)}… (${publishedEntry.size} bytes)`,
                );
            } else if (!publishedEntry && served !== entry.sha256) {
                pending.push(`${label}: served zip is not the built zip yet`);
            }
            if (!local) continue;
            if (ONLY_VERSION) {
                // Releasing: the artifact must be byte-for-byte the one built and
                // verified here, which the pinned zip timestamps now guarantee.
                if (served !== entry.sha256 || zip.length !== entry.size) {
                    problems.push(`${label}: the released artifact is not the one built here (${served.slice(0, 12)}… vs ${entry.sha256.slice(0, 12)}…)`);
                }
            } else if (isTarget) {
                // Otherwise compare the code inside the archive, which is stable
                // across container metadata (zips published before the
                // timestamps were pinned still hold the right bundle).
                const inner = Buffer.from(unzipSync(new Uint8Array(zip))[local.script] ?? new Uint8Array());
                if (sha256(inner) !== sha256(readFileSync(local.bundlePath))) {
                    problems.push(`${label}: the published archive contains different code than this build`);
                }
            }
        } catch (error) {
            pending.push(`${label}: zip not served yet (${error.message})`);
        }

        if (!isTarget) continue;

        // The published manifest advertises the hash of the bundle it was built
        // with, so it is the honest reference for a host that has published
        // half a deploy: a mismatch with its own hash is broken, a mismatch
        // with our local build is just the host not having caught up.
        if (!local) continue;
        try {
            const servedManifest = JSON.parse((await get(`/${id}/manifest.json`, attempt > 0)).toString('utf8'));
            const servedHash = sha256(await get(`/${id}/index.js`, attempt > 0));
            if (servedManifest.hash && servedManifest.hash !== servedHash) {
                problems.push(`${label}: ${id}/manifest.json advertises hash ${String(servedManifest.hash).slice(0, 12)}… but serves ${servedHash.slice(0, 12)}…`);
            } else if (servedManifest.version !== version) {
                pending.push(`${label}: folder install still serves ${servedManifest.version}`);
            } else if (servedHash !== sha256(readFileSync(local.bundlePath))) {
                pending.push(`${label}: folder-URL bundle is not the built bundle yet`);
            }
        } catch (error) {
            pending.push(`${label}: folder install not served yet (${error.message})`);
        }
    }

    // The root install is what the bare repository URL fetches.
    if (!ONLY_ID) {
        try {
            const rootManifest = JSON.parse((await get('/manifest.json', attempt > 0)).toString('utf8'));
            const rootHash = sha256(await get('/index.js', attempt > 0));
            if (rootManifest.hash && rootManifest.hash !== rootHash) {
                problems.push(`root manifest.json advertises hash ${String(rootManifest.hash).slice(0, 12)}… but serves ${rootHash.slice(0, 12)}…`);
            } else {
                const rootLocal = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
                if (rootManifest.id !== rootLocal.id) pending.push(`root install still serves ${rootManifest.id}`);
                else if (rootHash !== sha256(readFileSync(join(DIST, 'index.js')))) pending.push('root index.js is not the built bundle yet');
            }
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
