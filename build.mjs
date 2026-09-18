import { readFile, writeFile, copyFile, mkdir, readdir } from "fs/promises";
import { createHash } from "node:crypto";
import { zipSync, strToU8 } from "fflate";

const BASE_URL = "https://8uvu.github.io/msglog";

const artifacts = [];
const plugins = [];

for (let plug of await readdir("./plugins", { withFileTypes: true })) {
    if (!plug.isDirectory()) continue;
    const name = plug.name;

    const manifest = JSON.parse(
        await readFile(`./plugins/${name}/manifest.json`, "utf8"),
    );
    const id = manifest.id ?? name;
    const version = manifest.version;
    if (!id || !version) throw new Error(`${name}: missing id or version`);

    const script = (manifest.dist && manifest.dist.script) || manifest.main || "index.js";
    const bundle = await readFile(`./plugins/${name}/src/${script}`);

    const zipName = `${id}@${version}.zip`;
    const zip = zipSync({
        "manifest.json": strToU8(JSON.stringify(manifest, null, 4)),
        [script]: new Uint8Array(bundle),
    });

    await mkdir("./dist/pool", { recursive: true });
    await writeFile(`./dist/pool/${zipName}`, Buffer.from(zip));

    const entry = {
        url: `${BASE_URL}/pool/${zipName}`,
        sha256: createHash("sha256").update(zip).digest("hex"),
        size: zip.length,
        dependencies: Object.fromEntries(
            Object.entries(manifest.dependencies ?? {}).map(([depId, dep]) => [
                depId,
                { version: dep.version, optional: dep.optional },
            ]),
        ),
    };

    artifacts.push(zipName);
    plugins.push({ id, version, manifest, entry });

    await mkdir(`./dist/${id}`, { recursive: true });
    await copyFile(`./plugins/${name}/src/${script}`, `./dist/${id}/index.js`);
    await writeFile(`./dist/${id}/manifest.json`, JSON.stringify(manifest, null, 4));

    console.log(`Packaged ${id}@${version} (${zip.length} bytes) -> pool/${zipName}`);
}

const output = {};
for (const { id, manifest } of plugins) {
    const versions = {};
    let latest = null;
    for (const p of plugins) {
        if (p.id !== id) continue;
        versions[p.version] = p.entry;
        if (!/-/.test(p.version) && (latest === null || p.version > latest)) latest = p.version;
    }
    output[id] = {
        name: manifest.name,
        description: manifest.description ?? "",
        author: manifest.author ?? "",
        channels: { ...(latest ? { latest } : {}) },
        versions,
    };
}

const index = {
    format: 1,
    name: "msglog",
    description: "Revenge plugins by 8uvu",
    plugins: output,
};

await writeFile("./dist/index.json", JSON.stringify(index, null, 4) + "\n");
console.log(
    `Wrote index.json: ${Object.keys(output).length} plugin(s), ${artifacts.length} artifact(s)`,
);