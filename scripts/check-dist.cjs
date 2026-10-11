// Guards the built distribution against the failure mode that matters most
// here: publishing something that is not what was tested. Every artifact
// index.json advertises must exist with the hash and size it claims, every
// zipped bundle must be byte-identical to the folder-URL install, and the
// checked-in manifest must be the version that was built.
//
// Run after `node build.mjs` (CI does this before deploying).
const { createHash } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { unzipSync } = require('fflate');

const dist = join(__dirname, '..', 'dist');
const rootPlugin = 'dev.8uvu.message-logger';

const problems = [];
const fail = (message) => problems.push(message);
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const exists = (path) => {
    if (existsSync(path)) return true;
    fail(`missing ${path.slice(join(__dirname, '..').length + 1).replace(/\\/g, '/')}`);
    return false;
};

function readJson(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
        fail(`${path}: unreadable JSON — ${error.message}`);
        return null;
    }
}

if (!existsSync(join(dist, 'index.json'))) {
    console.error('CHECK-DIST FAILED: dist/index.json is missing — run `node build.mjs` first');
    process.exit(1);
}

const index = readJson(join(dist, 'index.json'));
const ids = Object.keys(index.plugins ?? {});
if (!ids.length) fail('index.json lists no plugins');

for (const id of ids) {
    const plugin = index.plugins[id];
    const versions = Object.entries(plugin.versions ?? {});
    if (!versions.length) fail(`${id}: index lists no versions`);

    // The version checked into plugins/ is the one a direct folder install
    // serves, so it has to be a version the index knows about.
    const sourceManifestPath = join(__dirname, '..', 'plugins', id, 'manifest.json');
    const sourceVersion = exists(sourceManifestPath) ? readJson(sourceManifestPath)?.version : null;
    if (sourceVersion && !(sourceVersion in (plugin.versions ?? {}))) {
        fail(`${id}: plugins/ manifest version ${sourceVersion} is not in index.json — rebuild or re-bump`);
    }

    for (const [version, entry] of versions) {
        const zipPath = join(dist, 'pool', `${id}@${version}.zip`);
        if (!exists(zipPath)) continue;
        const zip = readFileSync(zipPath);
        if (zip.length !== entry.size) fail(`${id}@${version}: index size ${entry.size} != zip ${zip.length}`);
        if (sha256(zip) !== entry.sha256) fail(`${id}@${version}: index sha256 does not match the zip on disk`);
        if (!String(entry.url ?? '').endsWith(`/pool/${id}@${version}.zip`)) {
            fail(`${id}@${version}: unexpected artifact url ${entry.url}`);
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
        const folderBundle = join(dist, id, 'index.js');
        if (exists(folderBundle)) {
            const onDisk = readFileSync(folderBundle);
            if (sha256(onDisk) !== sha256(Buffer.from(zipped))) {
                fail(`${id}@${version}: folder install ${id}/index.js differs from the zipped bundle`);
            }
        }
        const folderManifest = exists(join(dist, id, 'manifest.json')) ? readJson(join(dist, id, 'manifest.json')) : null;
        if (folderManifest) {
            if (folderManifest.version !== version) fail(`${id}: folder manifest version ${folderManifest.version} != ${version}`);
            if (folderManifest.hash !== sha256(Buffer.from(zipped))) fail(`${id}@${version}: folder manifest hash is stale`);
        }
    }

    // channels.latest must be the newest release, not a prerelease, and must be
    // the version jsonStorage-seeded installs actually receive.
    const releases = versions.map(([v]) => v).filter((v) => !v.includes('-'));
    const newest = releases.sort(compareVersions).pop();
    if (plugin.channels?.latest !== newest) {
        fail(`${id}: channels.latest ${plugin.channels?.latest} is not the newest release ${newest}`);
    }
}

// Root install: pasting the bare repository URL fetches dist/manifest.json and
// dist/index.js, so those must belong to the plugin people come for.
const rootManifest = exists(join(dist, 'manifest.json')) ? readJson(join(dist, 'manifest.json')) : null;
if (rootManifest) {
    if (rootManifest.id !== rootPlugin) fail(`root install serves ${rootManifest.id}, expected ${rootPlugin}`);
    if (exists(join(dist, 'index.js'))) {
        const rootBundle = readFileSync(join(dist, 'index.js'));
        if (rootManifest.hash !== sha256(rootBundle)) fail('root manifest hash does not match dist/index.js');
        const served = join(dist, rootManifest.id, 'index.js');
        if (exists(served) && sha256(readFileSync(served)) !== sha256(rootBundle)) {
            fail('root dist/index.js differs from the plugin folder bundle');
        }
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

function report() {
    if (problems.length) {
        console.error(`CHECK-DIST FAILED: ${problems.length} problem(s)`);
        for (const problem of problems) console.error('  - ' + problem);
        process.exit(1);
    }
    console.log(`CHECK-DIST OK: ${ids.length} plugin(s), every artifact matches index.json`);
}

report();
