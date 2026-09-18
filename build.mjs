import { readFile, writeFile, readdir, copyFile, mkdir } from "fs/promises";

for (let plug of await readdir("./plugins", { withFileTypes: true })) {
    const name = plug.name;
    if (!plug.isDirectory()) continue;

    const manifest = JSON.parse(await readFile(`./plugins/${name}/manifest.json`, "utf8"));
    const entry = (manifest.dist && manifest.dist.script) || manifest.main || "index.js";

    await mkdir(`./dist/${name}`, { recursive: true });
    await copyFile(`./plugins/${name}/src/${entry}`, `./dist/${name}/index.js`);

    const out = { ...manifest, main: "index.js", dist: { ...(manifest.dist || {}), script: "index.js" } };
    await writeFile(`./dist/${name}/manifest.json`, JSON.stringify(out, null, 4));
    console.log(`Deployed ${manifest.name ?? name} (${entry})`);
}