// Builds every plugin under plugins/ into the distribution layout:
//   dist/pool/<id>@<version>.zip        one artifact per version (pool is append-only)
//   dist/<id>/{index.js,manifest.json}  direct folder-URL installs
//   dist/{index.js,manifest.json}       root install for the first plugin
//   dist/index.json                     repository index for Revenge's plugin browser
//
// Follows the revenge-plugin-template conventions:
//   - manifest.json (format 1) declares id, version, dependencies, dist.script
//   - the JS entry is looked up in js/index.*, then src/index.*, then the
//     plugin folder itself (ts/tsx/js/jsx), and bundled with esbuild
//   - bare requires of react/react-native/clipboard/@revenge-mod/* are
//     rewritten to `revenge.*` lookups (current plugins resolve everything
//     lazily and import nothing, so this is a safety net for future ones)
//   - the bundle is wrapped as the single expression the host evaluates:
//     (() => { CJS shim; ...; return (module.exports&&module.exports.default)||module.exports })()
import { readFile, writeFile, copyFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { zipSync, strToU8 } from "fflate";
import esbuild from "esbuild";

const BASE_URL = "https://8uvu.github.io/msglog";

const artifacts = [];
const plugins = [];

for (let plug of await readdir("./plugins", { withFileTypes: true })) {
    if (!plug.isDirectory()) continue;
    const name = plug.name;
    const dir = `./plugins/${name}`;

    const manifest = JSON.parse(
        (await readFile(`${dir}/manifest.json`, "utf8")).replace(/^\uFEFF/, ""),
    );
    const id = manifest.id ?? name;
    const version = manifest.version;
    if (!id || !version) throw new Error(`${name}: missing id or version`);

    const script = (manifest.dist && manifest.dist.script) || manifest.main || "index.js";

    // Template entry lookup: js/index.*, then src/index.*, then folder root.
    let entry = null;
    outer: for (const base of [`${dir}/js`, `${dir}/src`, dir]) {
        for (const ext of ["ts", "tsx", "js", "jsx"]) {
            const p = `${base}/index.${ext}`;
            if (existsSync(p)) {
                entry = p;
                break outer;
            }
        }
    }
    if (!entry) throw new Error(`${name}: no index.{ts,tsx,js,jsx} entry found`);

    const result = await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: "cjs",
        platform: "neutral",
        target: "es2019",
        minify: false,
        define: { __DEV__: "false", IS_DEV: "false" },
        external: ["@revenge-mod/*", "@react-native-clipboard/clipboard"],
        write: false,
    });
    let bundle = result.outputFiles[0].text;

    const map = {
        "react": "({ default: revenge.react.React, ...revenge.react.React })",
        "react/jsx-runtime": "({ jsx: (revenge.react.jsxRuntime || revenge.react.ReactJSXRuntime).jsx, jsxs: (revenge.react.jsxRuntime || revenge.react.ReactJSXRuntime).jsxs, Fragment: (revenge.react.jsxRuntime || revenge.react.ReactJSXRuntime).Fragment })",
        "react-native": "({ ...revenge.react.ReactNative })",
        "@react-native-clipboard/clipboard": "({ default: revenge.externals.ReactNativeClipboard.Clipboard, ...revenge.externals.ReactNativeClipboard.Clipboard })",
        "@revenge-mod/discord/flux": "revenge.discord.flux",
        "@revenge-mod/discord/design": "revenge.discord.design",
        "@revenge-mod/discord/native": "revenge.discord.native",
        "@revenge-mod/discord/actions": "revenge.discord.actions",
    };
    for (const [pkg, expr] of Object.entries(map)) {
        bundle = bundle.split(`require("${pkg}")`).join(`(${expr})`);
    }
    const leftover = [...bundle.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]);
    if (leftover.length) {
        console.error(`${id}: UNMAPPED REQUIRES: ${[...new Set(leftover)].join(", ")}`);
        process.exit(1);
    }

    const wrapped = `(() => { const module = { exports: {} }; const exports = module.exports; ${bundle}; return (module.exports && module.exports.default) || module.exports; })()`;
    const bundleBytes = Buffer.from(wrapped, "utf8");
    const bundleHash = createHash("sha256").update(bundleBytes).digest("hex");

    // Hybrid manifest: `main`/`hash`/`authors`/`vendetta` keep the direct
    // folder-URL install working on vendetta-style clients, while the new
    // format fields wire up jsonStorage/settings on current Revenge builds.
    const deployed = {
        ...manifest,
        main: script,
        hash: bundleHash,
        authors: [{ name: manifest.author ?? "Unknown" }],
        vendetta: { icon: "ic_chat_bubble" },
    };

    const zipName = `${id}@${version}.zip`;
    const zip = zipSync({
        "manifest.json": strToU8(JSON.stringify(manifest, null, 4)),
        [script]: bundleBytes,
    });

    await mkdir("./dist/pool", { recursive: true });
    await writeFile(`./dist/pool/${zipName}`, Buffer.from(zip));

    const entryObj = {
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
    plugins.push({ id, version, manifest, entry: entryObj });

    await mkdir(`./dist/${id}`, { recursive: true });
    await writeFile(`./dist/${id}/index.js`, bundleBytes);
    await writeFile(`./dist/${id}/manifest.json`, JSON.stringify(deployed, null, 4));

    console.log(`Packaged ${id}@${version} (${zip.length} bytes) -> pool/${zipName}`);
}

// Root-level plugin install: pasting https://8uvu.github.io/msglog/ straight
// into Revenge's plugin URL box fetches <root>/manifest.json then <root>/index.js.
const primary = plugins[0];
if (primary) {
    const { id, manifest } = primary;
    const script = (manifest.dist && manifest.dist.script) || manifest.main || "index.js";
    const bundleBytes = await readFile(`./dist/${id}/index.js`);
    const rootDeployed = {
        ...manifest,
        main: script,
        hash: createHash("sha256").update(bundleBytes).digest("hex"),
        authors: [{ name: manifest.author ?? "Unknown" }],
        vendetta: { icon: "ic_chat_bubble" },
    };
    await copyFile(`./dist/${id}/index.js`, `./dist/index.js`);
    await writeFile(`./dist/manifest.json`, JSON.stringify(rootDeployed, null, 4));
    console.log(`Root plugin install: ${id} (index.js + manifest.json)`);
}

const output = {};
for (const { id, manifest } of plugins) {
    let latest = null;
    for (const p of plugins) {
        if (p.id !== id) continue;
        if (!/-/.test(p.version) && (latest === null || p.version > latest)) latest = p.version;
    }
    output[id] = {
        name: manifest.name,
        description: manifest.description ?? "",
        author: manifest.author ?? "",
        channels: { ...(latest ? { latest } : {}) },
        versions: Object.fromEntries(
            plugins.filter((p) => p.id === id).map((p) => [p.version, p.entry]),
        ),
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
