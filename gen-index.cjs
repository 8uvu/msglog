const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, renameSync } = require('node:fs');
const { unzipSync } = require('C:\\Users\\Epitaph\\Equicord\\node_modules\\.pnpm\\fflate@0.8.3\\node_modules\\fflate\\lib\\node.cjs');

const repoDir = 'D:\\Revenge plugins\\repo';
const poolDir = repoDir + '\\pool';
const baseUrl = (process.argv[2] || 'https://<user>.github.io/<repo>').replace(/\/$/, '') + '/pool';

mkdirSync(poolDir, { recursive: true });

const distZips = readdirSync('D:\\Revenge plugins\\message-logger').filter(f => f.endsWith('.zip'));
for (const z of distZips) copyFileSync('D:\\Revenge plugins\\message-logger\\' + z, poolDir + '\\' + z);

function readManifestFromZip(zipPath) {
    const bytes = readFileSync(zipPath);
    const entries = unzipSync(bytes, { filter: file => file.name === 'manifest.json' });
    const manifestBytes = entries['manifest.json'];
    if (!manifestBytes) throw new Error(`${zipPath}: no manifest.json`);
    return JSON.parse(new TextDecoder().decode(manifestBytes));
}

const plugins = {};
const poolFiles = readdirSync(poolDir).filter(f => f.endsWith('.zip')).sort();
for (const file of poolFiles) {
    const m = /^([^@/\\]+)@([^@/\\]+)\.zip$/.exec(file);
    if (!m) throw new Error('Bad pool file name: ' + file);
    const manifest = readManifestFromZip(poolDir + '\\' + file);
    const claimedId = m[1];
    const claimedVer = m[2];
    if (claimedId !== manifest.id || claimedVer !== manifest.version) {
        const correctName = `${manifest.id}@${manifest.version}.zip`;
        if (file !== correctName) {
            renameSync(poolDir + '\\' + file, poolDir + '\\' + correctName);
        }
    }
    const id = manifest.id;
    const version = manifest.version;
    const bytes = readFileSync(poolDir + '\\' + id + '@' + version + '.zip');
    const entry = {
        url: `${baseUrl}/${id}@${version}.zip`,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        size: bytes.length,
        dependencies: Object.fromEntries(
            Object.entries(manifest.dependencies ?? {}).map(([depId, dep]) => [depId, { version: dep.version, optional: dep.optional }]),
        ),
    };
    if (!plugins[id]) {
        plugins[id] = {
            name: manifest.name,
            description: manifest.description ?? '',
            author: manifest.author ?? '',
            channels: {},
            versions: {},
        };
    }
    plugins[id].versions[version] = entry;
}
for (const p of Object.values(plugins)) {
    const vers = Object.keys(p.versions);
    const cmp = (a, b) => {
        const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const d = (pa[i] ?? 0) - (pb[i] ?? 0);
            if (d) return d;
        }
        return 0;
    };
    const nonLabeled = vers.filter(v => !/-/.test(v)).sort(cmp);
    if (nonLabeled.length) p.channels.latest = nonLabeled[nonLabeled.length - 1];
}

const index = {
    format: 1,
    name: "8uvu's plugins",
    description: 'Custom Revenge plugins by 8uvu.',
    plugins,
};

writeFileSync(repoDir + '\\index.json', JSON.stringify(index, null, 2) + '\n');
console.log('index.json written: ' + Object.keys(plugins).length + ' plugin(s)');
console.log(JSON.stringify(index, null, 2).slice(0, 800));
