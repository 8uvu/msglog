// The publishing policy, resolved in one place: which plugin ids dist/index.json
// advertises, which plugin the bare repository URL installs, and the opaque path
// every other plugin is published under. build.mjs, the dist checker, the live
// checker, the release command and the plugin verifiers all read it from here, so
// the published layout can never disagree with itself.
//
// Why slugs: an unlisted plugin used to be published at /<id>/ and
// /pool/<id>@<version>.zip, so anyone who browsed or guessed a URL could read
// the name straight off the site. Those plugins now publish at a slug instead.
// The id still travels *inside* the artifact (the host keys an install by it),
// but no path the site serves spells it out.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const repoRoot = join(__dirname, '..');
const POLICY_PATH = join(repoRoot, 'publish.json');
const BASE_URL = 'https://8uvu.github.io/msglog';

// A published path segment with nothing to read a name out of. Rotating a slug
// means anyone who installed from the old URL has to add the plugin again, so
// the values in publish.json are stable by design.
const SLUG_PATTERN = /^[0-9a-f]{12,32}$/;

let cached = null;

function readPolicy() {
    if (cached) return cached;
    let policy;
    try {
        policy = JSON.parse(readFileSync(POLICY_PATH, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
        throw new Error(`publish.json is unreadable — ${error.message}`);
    }
    if (!Array.isArray(policy.published) || !policy.published.length) {
        throw new Error('publish.json: "published" must list at least one plugin id');
    }
    if (typeof policy.root !== 'string' || !policy.root) {
        throw new Error('publish.json: "root" must name the plugin the bare repository URL installs');
    }
    if (!policy.published.includes(policy.root)) {
        throw new Error(`publish.json: the root plugin ${policy.root} is not in "published"`);
    }
    cached = { ...policy, slug: policy.slug ?? {} };
    return cached;
}

// Where a plugin is published: its id when advertised, its opaque slug otherwise.
// Returns null for an unlisted plugin that has no slug — a build is never allowed
// to fall back to publishing it under its real id.
function installPath(id, policy = readPolicy()) {
    if (policy.published.includes(id)) return id;
    return policy.slug[id] ?? null;
}

function requireInstallPath(id, policy = readPolicy()) {
    const path = installPath(id, policy);
    if (!path) {
        throw new Error(
            `${id} is not in publish.json "published", so it needs an opaque slug: add "${id}": "<12+ hex chars>" to the "slug" object. Without one it would be published at its real id, which is the leak publish.json exists to prevent.`,
        );
    }
    return path;
}

// The artifact name for a version: pool/<path>@<version>.zip.
function zipName(id, version, policy = readPolicy()) {
    return `${requireInstallPath(id, policy)}@${version}.zip`;
}

// The folder URL a user pastes into Revenge to install or update the plugin.
function installUrl(id, policy = readPolicy(), base = BASE_URL) {
    return `${String(base).replace(/\/+$/, '')}/${requireInstallPath(id, policy)}/`;
}

module.exports = {
    BASE_URL,
    POLICY_PATH,
    SLUG_PATTERN,
    installPath,
    installUrl,
    readPolicy,
    requireInstallPath,
    zipName,
};
