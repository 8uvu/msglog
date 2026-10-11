// Guards the built distribution against the failure mode that matters most
// here: publishing something that is not what was tested. Every advertised
// artifact must exist with the hash and size index.json claims, every zipped
// bundle must be byte-identical to the folder-URL install, every folder URL must
// answer with a usable manifest and a one-plugin index, and the checked-in
// manifest must be the version that was built.
//
// It also enforces the privacy rule: the published surface — index.json, the 404
// page, the root install, and the name of every file and directory in dist/ —
// must never name a plugin index.json does not advertise. An unlisted plugin is
// published at the opaque slug from publish.json instead of its id, so a visitor
// who browses or guesses a URL cannot read its name off the site.
//
// Run after `node build.mjs` (CI does this before deploying).
const { createHash } = require('node:crypto');
const { readFileSync, existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { unzipSync } = require('fflate');
const {
    SLUG_PATTERN,
    readPolicy,
    requireInstallPath,
    zipName,
} = require('./publish-paths.cjs');

const repoRoot = join(__dirname, '..');
const dist = join(repoRoot, 'dist');

const problems = [];
const fail = (message) => problems.push(message);
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const rel = (path) => path.slice(repoRoot.length + 1).replace(/\\/g, '/');

function exists(path) {
    if (existsSync(path)) return true;
    fail(`missing ${rel(path)}`);
    return false;
}
function readText(path) {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}
function readJson(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
        fail(`${rel(path)}: unreadable JSON — ${error.message}`);
        return null;
    }
}
function compareVersions(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const delta = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (delta) return delta;
    }
    return 0;
}

if (!existsSync(join(dist, 'index.json'))) {
    console.error('CHECK-DIST FAILED: dist/index.json is missing — run `node build.mjs` first');
    process.exit(1);
}

const index = readJson(join(dist, 'index.json'));
const advertised = Object.keys(index.plugins ?? {});
if (!advertised.length) fail('index.json advertises no plugins');

const allIds = readdirSync(join(repoRoot, 'plugins'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

// ---- The publishing policy itself -------------------------------------------
let policy = null;
try {
    policy = readPolicy();
} catch (error) {
    fail(error.message);
}

if (policy) {
    if (!advertised.includes(policy.root)) {
        fail(`publish.json pins the root install to ${policy.root}, which index.json does not advertise`);
    }
    for (const id of advertised) {
        if (!allIds.includes(id)) fail(`index.json advertises ${id}, which is not a plugin directory`);
    }
    for (const id of policy.published) {
        if (!advertised.includes(id)) fail(`publish.json lists ${id} as published but index.json does not advertise it — rebuild`);
        // An id that is both advertised and hidden leaves nobody able to tell
        // which of its two URLs is the real one.
        if (policy.slug[id]) fail(`publish.json gives ${id} an advertised entry and a slug — pick one`);
    }
    const slugOwners = new Map();
    for (const id of allIds) {
        if (policy.published.includes(id)) continue;
        const slug = policy.slug[id];
        if (!slug) {
            fail(`${id} is unlisted but has no slug in publish.json — it would be published under its real id`);
            continue;
        }
        if (!SLUG_PATTERN.test(slug)) fail(`${id}: slug "${slug}" is not an opaque path segment (expected ${SLUG_PATTERN})`);
        if (allIds.includes(slug)) fail(`${id}: slug "${slug}" collides with a plugin id`);
        const name = readJson(join(repoRoot, 'plugins', id, 'manifest.json'))?.name;
        for (const needle of [id, name].filter(Boolean)) {
            if (slug.toLowerCase().includes(String(needle).toLowerCase())) {
                fail(`${id}: slug "${slug}" spells out "${needle}"`);
            }
        }
        if (slugOwners.has(slug)) fail(`slug "${slug}" is used by both ${slugOwners.get(slug)} and ${id}`);
        slugOwners.set(slug, id);
    }
}

// ---- Every plugin's artifacts ----------------------------------------------
for (const id of allIds) {
    const isAdvertised = advertised.includes(id);
    const source = readJson(join(repoRoot, 'plugins', id, 'manifest.json'));
    const version = source?.version;
    if (!version) {
        fail(`${id}: no version in plugins/${id}/manifest.json`);
        continue;
    }
    if ((source.id ?? id) !== id) fail(`${id}: manifest id is ${source.id}`);

    // Where this plugin must be published — and, for an unlisted one, the only
    // place it is allowed to be.
    let path = id;
    try {
        path = requireInstallPath(id, policy);
    } catch (error) {
        fail(error.message);
        continue;
    }

    let zipFile = `${path}@${version}.zip`;
    if (policy) zipFile = zipName(id, version, policy);
    const zipPath = join(dist, 'pool', zipFile);
    if (!exists(zipPath)) continue;
    const zip = readFileSync(zipPath);

    if (isAdvertised) {
        const plugin = index.plugins[id];
        const entry = plugin.versions?.[version];
        if (!entry) {
            fail(`${id}: plugins/ manifest version ${version} is not in index.json — rebuild or re-bump`);
        } else {
            if (zip.length !== entry.size) fail(`${id}@${version}: index size ${entry.size} != zip ${zip.length}`);
            if (sha256(zip) !== entry.sha256) fail(`${id}@${version}: index sha256 does not match the zip on disk`);
            if (!String(entry.url ?? '').endsWith(`/pool/${zipFile}`)) {
                fail(`${id}@${version}: unexpected artifact url ${entry.url}`);
            }
        }
        const releases = Object.keys(plugin.versions ?? {})
            .filter((v) => !v.includes('-'))
            .sort(compareVersions);
        const newest = releases[releases.length - 1];
        if (plugin.channels?.latest !== newest) {
            fail(`${id}: channels.latest ${plugin.channels?.latest} is not the newest release ${newest}`);
        }
    } else if (!existsSync(join(dist, path, 'index.js'))) {
        fail(`${id} is unlisted but has no folder install at ${path}/ — a direct URL install would break`);
    }

    let files;
    try {
        files = unzipSync(new Uint8Array(zip));
    } catch (error) {
        fail(`${id}@${version}: zip is unreadable — ${error.message}`);
        continue;
    }
    const innerManifest = files['manifest.json'] ? JSON.parse(Buffer.from(files['manifest.json']).toString('utf8')) : null;
    if (!innerManifest) {
        fail(`${id}@${version}: zip has no manifest.json`);
    } else {
        if ((innerManifest.id ?? id) !== id) fail(`${id}@${version}: zip manifest id is ${innerManifest.id}`);
        if (innerManifest.version !== version) fail(`${id}@${version}: zip manifest version is ${innerManifest.version}`);
    }
    const script = innerManifest?.dist?.script ?? innerManifest?.main ?? 'index.js';
    const zipped = files[script];
    if (!zipped) {
        fail(`${id}@${version}: zip has no ${script}`);
        continue;
    }
    const zippedHash = sha256(Buffer.from(zipped));

    const folderBundle = join(dist, path, 'index.js');
    if (exists(folderBundle) && sha256(readFileSync(folderBundle)) !== zippedHash) {
        fail(`${id}@${version}: folder install ${path}/index.js differs from the zipped bundle`);
    }

    const folderManifestPath = join(dist, path, 'manifest.json');
    const folderManifest = exists(folderManifestPath) ? readJson(folderManifestPath) : null;
    if (folderManifest) {
        if (folderManifest.id !== id) fail(`${path}/manifest.json is the manifest for ${folderManifest.id} — the host keys an install by this id`);
        if (folderManifest.version !== version) fail(`${path}: folder manifest version ${folderManifest.version} != ${version}`);
        if (folderManifest.hash !== zippedHash) fail(`${id}@${version}: folder manifest hash is stale`);
        if (!folderManifest.main && !folderManifest.dist?.script) fail(`${path}/manifest.json names no script to run`);
    }

    // The folder URL is the install URL handed to users, and it has to answer
    // with JSON: a URL that returns the 404 page is the "failed to manifest" an
    // install reports.
    const folderIndexPath = join(dist, path, 'index.json');
    const folderIndex = exists(folderIndexPath) ? readJson(folderIndexPath) : null;
    if (folderIndex) {
        if (folderIndex.format !== 1) fail(`${path}/index.json: format is ${folderIndex.format}, expected 1`);
        const listed = Object.keys(folderIndex.plugins ?? {});
        if (listed.length !== 1 || listed[0] !== id) {
            fail(`${path}/index.json must describe exactly ${id} — it lists ${listed.join(', ') || 'nothing'}`);
        } else {
            const folderEntry = folderIndex.plugins[id].versions?.[version];
            if (!folderEntry) {
                fail(`${path}/index.json does not offer version ${version}`);
            } else {
                if (folderEntry.sha256 !== sha256(zip)) fail(`${path}/index.json advertises a different artifact than pool/${zipFile}`);
                if (folderEntry.size !== zip.length) fail(`${path}/index.json advertises size ${folderEntry.size} but the zip is ${zip.length}`);
                if (!String(folderEntry.url ?? '').endsWith(`/pool/${zipFile}`)) fail(`${path}/index.json points at ${folderEntry.url}`);
            }
        }
    }
}

// ---- The published surface must not name an unlisted plugin ----------------
const unlisted = allIds.filter((id) => !advertised.includes(id));
const secrets = [];
for (const id of unlisted) {
    const manifest = readJson(join(repoRoot, 'plugins', id, 'manifest.json'));
    for (const needle of [id, manifest?.name].filter(Boolean)) secrets.push({ id, needle });
}

// Every path in dist/: a plugin published at its real id shows up as a directory
// or an artifact name, which is exactly the leak the slugs exist to prevent.
function walk(dir, out = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        out.push(full);
        if (entry.isDirectory()) walk(full, out);
    }
    return out;
}
for (const entryPath of walk(dist)) {
    const name = rel(entryPath);
    for (const { needle } of secrets) {
        // An artifact's *contents* legitimately carry the id — the host keys an
        // install by it — but no path on the site may.
        if (name.toLowerCase().includes(String(needle).toLowerCase())) {
            fail(`dist/${name} names the unlisted plugin "${needle}" — it may only be published at its opaque path`);
        }
    }
}

const servedFiles = ['index.json', '404.md', '404.html', 'README.md', 'manifest.json', 'index.js'];
for (const id of advertised) servedFiles.push(`${id}/manifest.json`, `${id}/index.js`, `${id}/index.json`);
for (const name of servedFiles) {
    const body = readText(join(dist, name));
    if (body === null) continue;
    for (const { needle } of secrets) {
        if (body.includes(needle)) fail(`dist/${name} names the unlisted plugin "${needle}" — the site must not advertise it`);
    }
}

// ---- Root install ----------------------------------------------------------
if (policy) {
    if (!advertised.includes(policy.root)) {
        fail(`the root install target ${policy.root} is not advertised in index.json`);
    }
} else if (!advertised.includes('dev.8uvu.message-logger')) {
    fail('the root install target dev.8uvu.message-logger is not advertised in index.json');
}
const rootManifest = exists(join(dist, 'manifest.json')) ? readJson(join(dist, 'manifest.json')) : null;
if (rootManifest) {
    if (policy && rootManifest.id !== policy.root) fail(`root install serves ${rootManifest.id}, expected ${policy.root}`);
    if (exists(join(dist, 'index.js'))) {
        const rootBundle = readFileSync(join(dist, 'index.js'));
        if (rootManifest.hash !== sha256(rootBundle)) fail('root manifest hash does not match dist/index.js');
        const served = join(dist, rootManifest.id, 'index.js');
        if (existsSync(served) && sha256(readFileSync(served)) !== sha256(rootBundle)) {
            fail('root dist/index.js differs from the plugin folder bundle');
        }
    }
}

if (problems.length) {
    console.error(`CHECK-DIST FAILED: ${problems.length} problem(s)`);
    for (const problem of problems) console.error('  - ' + problem);
    process.exit(1);
}
console.log(
    `CHECK-DIST OK: ${advertised.length} advertised, ${unlisted.length} unlisted plugin(s); every artifact matches its index, every folder URL answers with a manifest and an index, and no unlisted plugin is named anywhere in dist/`,
);
