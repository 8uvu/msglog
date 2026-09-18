const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync, readdirSync, statSync } = require('node:fs');

const distDir = __dirname + '/dist';
const baseUrl = (process.argv[2] || 'https://8uvu.github.io/msglog').replace(/\/$/, '');

const dirs = readdirSync(distDir).filter(d => {
    try { return statSync(distDir + '/' + d + '/manifest.json').isFile(); } catch { return false; }
});

const plugins = {};
for (const dir of dirs) {
    const manifest = JSON.parse(readFileSync(distDir + '/' + dir + '/manifest.json', 'utf8'));
    const id = dir;
    const version = manifest.version || '1.0.0';
    const zipName = `${id}@${version}.zip`;
    const bytes = readFileSync(distDir + '/' + dir + '/index.js');
    const entry = {
        url: `${baseUrl}/${zipName}`,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        size: bytes.length,
    };
    if (!plugins[id]) {
        plugins[id] = {
            name: manifest.name,
            description: manifest.description || '',
            author: (manifest.authors && manifest.authors[0] && manifest.authors[0].name) || '',
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

const index = { format: 1, name: "8uvu's plugins", description: 'Custom Revenge plugins by 8uvu.', plugins };
writeFileSync(distDir + '/index.json', JSON.stringify(index, null, 2) + '\n');
console.log('index.json written: ' + Object.keys(plugins).length + ' plugin(s)');