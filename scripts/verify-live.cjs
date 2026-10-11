// Confirms the *published* host serves exactly what this worktree built: the
// index entry, the pool zip bytes and the folder-URL files. A green build and a
// green Actions run do not prove a browser gets the new bundle, which is the
// whole reason this exists.
//
// It also checks the two things a user actually notices: that every folder URL —
// the link pasted into Revenge — answers with JSON instead of the 404 page, and
// that an unlisted plugin is no longer reachable at its own id.
//
// Usage:
//   node scripts/verify-live.cjs                          # one pass
//   node scripts/verify-live.cjs --wait 240               # retry until it is live
//   node scripts/verify-live.cjs --id dev.8uvu.message-logger --version 1.7.1
//
// Exit codes: 0 live and matching, 1 mismatch, 2 not live yet (still
// propagating / deploy not finished).
const { createHash } = require('node:crypto');
const { readFileSync, existsSync, readdirSync } = require('node:fs');
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

const { installPath, readPolicy } = require('./publish-paths.cjs');
let policy;
try {
    policy = readPolicy();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

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

// The folder-URL install for a plugin, addressed by the path it is published at
// (its id when advertised, its opaque slug otherwise): the manifest the host
// publishes and the bundle users actually run. This is what "the same code" is
// measured against.
function localInstall(path) {
    const dir = join(DIST, path);
    const bundlePath = join(dir, 'index.js');
    const manifestPath = join(dir, 'manifest.json');
    if (!existsSync(bundlePath) || !existsSync(manifestPath)) return null;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return { bundlePath, script: manifest.dist?.script ?? manifest.main ?? 'index.js' };
}

// Every plugin in the worktree, not just the advertised ones: a plugin left out
// of index.json is still published at its own folder URL and its pool zip still
// has to be the artifact built here. `listed` says whether index.json advertises
// it, which decides whether an index entry is expected at all.
function targets() {
    const out = [];
    let ids = [];
    try {
        ids = readdirSync(join(DIST, '..', 'plugins'));
    } catch {
        ids = Object.keys(local.plugins ?? {});
    }
    for (const id of ids.sort()) {
        if (ONLY_ID && id !== ONLY_ID) continue;
        const manifestPath = join(DIST, '..', 'plugins', id, 'manifest.json');
        if (!existsSync(manifestPath)) continue;
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const version = manifest.version;
        if (!version || (ONLY_VERSION && version !== ONLY_VERSION)) continue;
        const plugin = local.plugins?.[id] ?? null;
        out.push({
            id,
            path: installPath(id, policy),
            version,
            entry: plugin?.versions?.[version] ?? null,
            latest: plugin?.channels?.latest ?? version,
            listed: Boolean(plugin),
        });
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

    for (const { id, path, version, entry, latest, listed } of targets()) {
        const label = `${id}@${version}`;
        if (!path) {
            problems.push(`${id} is unlisted but publish.json gives it no slug — the site cannot serve it`);
            continue;
        }
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
        // What the served bytes are measured against: the host's own index entry
        // when there is one, otherwise the artifact this worktree built — the
        // only reference that exists for a plugin left out of index.json.
        const localZipPath = join(DIST, 'pool', `${path}@${version}.zip`);
        const localZip = existsSync(localZipPath) ? readFileSync(localZipPath) : null;
        const reference = publishedEntry?.sha256 ?? (localZip ? sha256(localZip) : null);
        const referenceSize = publishedEntry?.size ?? localZip?.length ?? null;

        if (listed) {
            if (liveIndex && !published) problems.push(`${label}: the published index does not list ${id}`);
            else if (liveIndex && !publishedEntry) pending.push(`${label}: not in the published index yet`);
            else if (publishedEntry && entry && ONLY_VERSION && (publishedEntry.sha256 !== entry.sha256 || publishedEntry.size !== entry.size)) {
                problems.push(
                    `${label}: the published artifact is not the one built here (${String(publishedEntry.sha256).slice(0, 12)}…/${publishedEntry.size} vs ${entry.sha256.slice(0, 12)}…/${entry.size})`,
                );
            }
            if (published && !ONLY_VERSION && version === latest && published.channels?.latest !== version) {
                pending.push(`${label}: published latest is ${published.channels?.latest}`);
            }
        } else if (publishedEntry) {
            // Leaving a plugin out of index.json is a deliberate act; the site
            // advertising it again means the build or the deploy regressed.
            problems.push(`${label}: the published index advertises ${id}, which this build leaves unlisted`);
        }

        const install = localInstall(path);
        try {
            const zip = await get(`/pool/${path}@${version}.zip`, attempt > 0);
            const served = sha256(zip);
            if (reference && (served !== reference || zip.length !== referenceSize)) {
                const against = publishedEntry ? "the host's own index" : 'this build';
                // Releasing, or contradicting the host's own index, is a real
                // failure; anything else is the deploy still propagating.
                if (publishedEntry || ONLY_VERSION) {
                    problems.push(
                        `${label}: the served zip does not match ${against} (${served.slice(0, 12)}… vs ${String(reference).slice(0, 12)}…)`,
                    );
                } else if (isTarget) {
                    pending.push(`${label}: served zip is not the built zip yet`);
                }
            } else if (isTarget && !ONLY_VERSION && install) {
                // Compare the code inside the archive too: containers published
                // before the zip timestamps were pinned still hold the right
                // bundle, and this is what catches "different code, same
                // version".
                const inner = Buffer.from(unzipSync(new Uint8Array(zip))[install.script] ?? new Uint8Array());
                if (sha256(inner) !== sha256(readFileSync(install.bundlePath))) {
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
        if (!install) continue;
        let newLayoutLive = false;
        try {
            const servedManifest = JSON.parse((await get(`/${path}/manifest.json`, attempt > 0)).toString('utf8'));
            const servedHash = sha256(await get(`/${path}/index.js`, attempt > 0));
            const builtHash = sha256(readFileSync(install.bundlePath));
            if (servedManifest.hash && servedManifest.hash !== servedHash) {
                problems.push(`${label}: ${path}/manifest.json advertises hash ${String(servedManifest.hash).slice(0, 12)}… but serves ${servedHash.slice(0, 12)}…`);
            } else if (servedManifest.version !== version) {
                pending.push(`${label}: folder install still serves ${servedManifest.version}`);
            } else if (servedHash !== builtHash) {
                // The folder URL is how an unlisted plugin is installed, so for
                // it this is the primary check rather than a formality.
                if (listed || ONLY_VERSION) problems.push(`${label}: the folder-URL bundle is not the built bundle`);
                else pending.push(`${label}: folder-URL bundle is not the built bundle yet`);
            } else {
                newLayoutLive = true;
            }
        } catch (error) {
            pending.push(`${label}: folder install not served yet (${error.message})`);
        }

        // The install URL has to answer with JSON. A URL that returns the 404
        // page instead is exactly the "failed to manifest" an install reports,
        // and nothing else here would catch a plugin that is live but
        // uninstallable.
        try {
            const body = (await get(`/${path}/`, attempt > 0)).toString('utf8');
            let parsed = null;
            try {
                parsed = JSON.parse(body);
            } catch {
                parsed = null;
            }
            const servesManifest = parsed && !parsed.plugins;
            if (!parsed) problems.push(`/${path}/ did not answer with JSON — the install URL cannot become a plugin`);
            else if (servesManifest && parsed.id !== id) problems.push(`/${path}/ answers with a manifest for ${parsed.id}`);
            else if (!servesManifest && !parsed.plugins[id]) problems.push(`/${path}/ answers with a repository that does not list ${id}`);
        } catch (error) {
            pending.push(`/${path}/ not served yet (${error.message})`);
        }

        // An unlisted plugin must no longer be reachable at its own id: the
        // opaque path is the point of it. While the previous deploy is still
        // being served that is propagation; once this build is live at the
        // opaque path, a named path answering with these exact bytes means the
        // deploy published it under the real name as well.
        if (!listed && path !== id) {
            for (const named of [`/${id}/manifest.json`, `/pool/${id}@${version}.zip`]) {
                let body;
                try {
                    body = await get(named, true);
                } catch {
                    continue; // a missing path is exactly the goal
                }
                const builtBytes = named.endsWith('.zip') ? localZip : readFileSync(join(DIST, path, 'manifest.json'));
                if (newLayoutLive && builtBytes && sha256(body) === sha256(builtBytes)) {
                    problems.push(`${label}: the site still serves this build at ${named} — it must only be published at /${path}/`);
                } else {
                    pending.push(`${label}: ${named} is still served — it must disappear from the published surface`);
                }
            }
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
    console.log(
        `LIVE VERIFY OK: ${BASE} serves this build (${targets().length} artifact(s), every install URL answers with JSON, no unlisted plugin reachable at its own name)`,
    );
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
