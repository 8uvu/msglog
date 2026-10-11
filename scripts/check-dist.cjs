// Guards the built distribution against the failure mode that matters most
// here: publishing something that is not what was tested. Every advertised
// artifact must exist with the hash and size index.json claims, every zipped
// bundle must be byte-identical to the folder-URL install, and the checked-in
// manifest must be the version that was built.
//
// It also enforces a privacy rule: the published surface — index.json, the 404
// page, the root manifest, and the advertised bundles — must never name a plugin
// that index.json does not advertise. A directory URL such as
// /dev.8uvu.message-logger/ lands on the 404 page, so anything printed there is
// one click away from any visitor.
//
// Run after `node build.mjs` (CI does this before deploying).
const { createHash } = require('node:crypto');
const { readFileSync, existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { unzipSync } = require('fflate');

const repoRoot = join(__dirname, '..');
const dist = join(repoRoot, 'dist');
const rootPlugin = 'dev.8uvu.message-logger';

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

for (const id of allIds) {
    const isAdvertised = advertised.includes(id);
    const source = readJson(join(repoRoot, 'plugins', id, 'manifest.json'));
    const version = source?.version;
    if (!version) {
        fail(`${id}: no version in plugins/${id}/manifest.json`);
        continue;
    }
    if ((source.id ?? id) !== id) fail(`${id}: manifest id is ${source.id}`);

    // Unlisted plugins are still built and still installable by folder URL, so
    // their artifact has to be there; they just are not advertised.
    const zipPath = join(dist, 'pool', `${id}@${version}.zip`);
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
            if (!String(entry.url ?? '').endsWith(`/pool/${id}@${version}.zip`)) {
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
    } else if (!existsSync(join(dist, id, 'index.js'))) {
        fail(`${id} is unlisted but has no folder install — a direct URL install would break`);
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

    const folderBundle = join(dist, id, 'index.js');
    if (exists(folderBundle) && sha256(readFileSync(folderBundle)) !== zippedHash) {
        fail(`${id}@${version}: folder install ${id}/index.js differs from the zipped bundle`);
    }
    const folderManifestPath = join(dist, id, 'manifest.json');
    const folderManifest = exists(folderManifestPath) ? readJson(folderManifestPath) : null;
    if (folderManifest) {
        if (folderManifest.version !== version) fail(`${id}: folder manifest version ${folderManifest.version} != ${version}`);
        if (folderManifest.hash !== zippedHash) fail(`${id}@${version}: folder manifest hash is stale`);
    }
}

// ---- The published surface must not name an unlisted plugin ----------------
const unlisted = allIds.filter((id) => !advertised.includes(id));
const secrets = [];
for (const id of unlisted) {
    const manifest = readJson(join(repoRoot, 'plugins', id, 'manifest.json'));
    for (const needle of [id, manifest?.name].filter(Boolean)) secrets.push({ id, needle });
}

const servedFiles = ['index.json', '404.md', '404.html', 'README.md', 'manifest.json', 'index.js'];
for (const id of advertised) servedFiles.push(`${id}/manifest.json`, `${id}/index.js`);
for (const name of servedFiles) {
    const body = readText(join(dist, name));
    if (body === null) continue;
    for (const { needle } of secrets) {
        if (body.includes(needle)) fail(`dist/${name} names the unlisted plugin "${needle}" — the site must not advertise it`);
    }
}

// ---- Root install ----------------------------------------------------------
if (!advertised.includes(rootPlugin)) {
    fail(`the root install target ${rootPlugin} is not advertised in index.json`);
}
const rootManifest = exists(join(dist, 'manifest.json')) ? readJson(join(dist, 'manifest.json')) : null;
if (rootManifest) {
    if (rootManifest.id !== rootPlugin) fail(`root install serves ${rootManifest.id}, expected ${rootPlugin}`);
    if (exists(join(dist, 'index.js'))) {
        const rootBundle = readFileSync(join(dist, 'index.js'));
        if (rootManifest.hash !== sha256(rootBundle)) fail('root manifest hash does not match dist/index.js');
        const served = join(dist, rootPlugin, 'index.js');
        if (exists(served) && sha256(readFileSync(served)) !== sha256(rootBundle)) {
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
    `CHECK-DIST OK: ${advertised.length} advertised, ${unlisted.length} unlisted plugin(s); every artifact matches index.json and nothing unlisted is named on the site`,
);
