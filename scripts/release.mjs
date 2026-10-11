// Ships a plugin in one command: bump, build, verify, commit, push, then
// confirm the published host serves the new bundle. The point is that a fix
// cannot quietly sit unpublished — the failures that actually bit this project
// were "forgot to push" and "version never changed".
//
// Usage:
//   node scripts/release.mjs dev.8uvu.message-logger patch
//   node scripts/release.mjs dev.8uvu.message-logger 1.7.1
//   node scripts/release.mjs dev.8uvu.message-logger patch "Fix unseen-message edits"
//
// Flags: --dry-run (no commit/push), --no-push, --no-live, --no-verify,
//        --wait <seconds> (live check budget, default 240)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2).filter((a) => a !== '--');
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
const flagValue = (name, fallback) => {
    const i = argv.indexOf('--' + name);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const id = positional[0];
const targetVersion = positional[1];
const message = positional[2];
if (!id || !targetVersion) {
    console.error('usage: node scripts/release.mjs <plugin-id> <patch|minor|major|1.2.3> ["commit message"]');
    process.exit(1);
}

const dryRun = flags.has('--dry-run');
const noPush = dryRun || flags.has('--no-push');
const noLive = flags.has('--no-live');
const noVerify = flags.has('--no-verify');
const liveWait = Number(flagValue('wait', 240));

const step = (label) => console.log(`\n── ${label} ${'─'.repeat(Math.max(4, 56 - label.length))}`);
function run(command, args, options = {}) {
    const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
    return result.status ?? 1;
}
function runCapture(command, args) {
    const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
    return { status: result.status ?? 1, out: (result.stdout ?? '').trim() };
}

// ---- 1. Work out the new version ------------------------------------------
const pluginDir = join(root, 'plugins', id);
const manifestPath = join(pluginDir, 'manifest.json');
if (!existsSync(manifestPath)) {
    console.error(`no such plugin: plugins/${id}/manifest.json`);
    process.exit(1);
}
const manifestRaw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw.replace(/^\uFEFF/, ''));
const current = manifest.version;
const next = /^\d+\.\d+\.\d+/.test(targetVersion) ? targetVersion : bump(current, targetVersion);
if (next === current) {
    console.error(`${id} is already at ${current} — a release needs a new version`);
    process.exit(1);
}

// Puts the worktree back exactly as it was found, so --dry-run is safe to run
// on a dirty tree.
function restoreDryRun() {
    if (!dryRun) return;
    writeFileSync(manifestPath, manifestRaw);
    if (entryBumped && entryFile && entryOriginal !== null) writeFileSync(entryFile, entryOriginal);
    run(process.execPath, ['build.mjs']);
    console.log('\ndry run: worktree files restored (dist/ rebuilt at the current version)');
}

function bump(version, kind) {
    const [major = 0, minor = 0, patch = 0] = String(version).split('.').map(Number);
    if (kind === 'major') return `${major + 1}.0.0`;
    if (kind === 'minor') return `${major}.${minor + 1}.0`;
    if (kind === 'patch') return `${major}.${minor}.${patch + 1}`;
    console.error(`unrecognised version: ${kind}`);
    process.exit(1);
}

console.log(`Releasing ${id}: ${current} -> ${next}${dryRun ? ' (dry run)' : ''}`);

// ---- 2. Bump every place the version is written down ----------------------
const entryFile = ['js/index.ts', 'js/index.tsx', 'js/index.js', 'src/index.ts', 'src/index.tsx'].map((p) => join(pluginDir, p)).find(existsSync);
const touched = [];
// Surgical edit: rewriting the file through JSON.stringify would reformat the
// whole manifest and bury the real change under whitespace noise.
const bumpedManifest = manifestRaw.replace(/"version":\s*"[^"]+"/, `"version": "${next}"`);
if (!bumpedManifest.includes(`"version": "${next}"`)) {
    console.error('could not find a version field to bump in the manifest');
    process.exit(1);
}
writeFileSync(manifestPath, bumpedManifest);
touched.push(manifestPath);
console.log(`bumped ${manifestPath.slice(root.length + 1).replace(/\\/g, '/')} to ${next}`);

let entryOriginal = null;
let entryBumped = false;
if (entryFile) {
    const relative = entryFile.slice(root.length + 1).replace(/\\/g, '/');
    const source = readFileSync(entryFile, 'utf8');
    // Several plugins report their own version in a toast or the debug page,
    // which is how a user answers "did the new build actually load?". Keep it in
    // step with the manifest or that answer is a lie. (Built with a RegExp, not
    // a regex literal: `${...}` is not interpolated inside /slashes/, which is
    // how a release once shipped a stale self-reported version.)
    const declaration = /const PLUGIN_VERSION = '([^']*)'/;
    const found = declaration.exec(source);
    if (!found) {
        console.warn(`note: no PLUGIN_VERSION constant in ${relative} — bump it by hand if the plugin reports a version`);
    } else {
        if (found[1] !== current) console.warn(`note: ${relative} said ${found[1]} while the manifest said ${current}`);
        entryOriginal = source;
        entryBumped = true;
        writeFileSync(entryFile, source.replace(declaration, `const PLUGIN_VERSION = '${next}'`));
        touched.push(entryFile);
        console.log(`bumped PLUGIN_VERSION to ${next} in ${relative}`);
    }
}

// ---- 3. Build --------------------------------------------------------------
step('build');
if (run(process.execPath, ['build.mjs'])) {
    restoreDryRun();
    console.error('build failed — nothing released');
    process.exit(1);
}
const zipPath = join(root, 'dist', 'pool', `${id}@${next}.zip`);
if (!existsSync(zipPath)) {
    restoreDryRun();
    console.error(`build did not produce dist/pool/${id}@${next}.zip`);
    process.exit(1);
}
if (entryBumped) {
    // Prove the self-reported version actually made it into the bundle the host
    // will evaluate — a stale one is invisible in every other check.
    const built = readFileSync(join(root, 'dist', id, 'index.js'), 'utf8');
    if (!new RegExp(`PLUGIN_VERSION = ["']${next}["']`).test(built)) {
        restoreDryRun();
        console.error(`the built bundle does not report ${next} — the version constant did not survive the build`);
        process.exit(1);
    }
    console.log(`verified the built bundle reports ${next}`);
}

// ---- 4. Every check --------------------------------------------------------
if (noVerify) console.warn('skipping verification (--no-verify)');
else {
    step('verify');
    if (run(process.execPath, ['scripts/verify-all.mjs'])) {
        restoreDryRun();
        console.error('verification failed — nothing committed. Fix it and re-run.');
        process.exit(1);
    }
}

// ---- 5. Commit and push ----------------------------------------------------
if (dryRun) {
    step('dry run');
    const wouldStage = runCapture('git', ['status', '--porcelain', `plugins/${id}`]).out;
    restoreDryRun();
    console.log(`would have committed plugins/${id} (${wouldStage.split('\n').filter(Boolean).length} file(s)) and pushed ${next}`);
    process.exit(0);
}

step('commit');
// Stage the whole plugin directory: a release carries its source, manifest and
// verifier together, so the pushed commit is buildable on its own.
const pluginPath = `plugins/${id}`;
if (run('git', ['add', pluginPath])) {
    console.error('git add failed');
    process.exit(1);
}
const staged = runCapture('git', ['diff', '--cached', '--name-only']).out;
if (!staged) {
    console.error('nothing staged — already committed?');
    process.exit(1);
}
const subject = message ?? `Release ${id} ${next}`;
if (run('git', ['commit', '-m', subject])) {
    console.error('git commit failed');
    process.exit(1);
}
const head = runCapture('git', ['rev-parse', 'HEAD']).out;

if (noPush) {
    console.log(`committed ${head.slice(0, 7)} — not pushed (--no-push)`);
    process.exit(0);
}
step('push');
if (run('git', ['push', 'origin', 'HEAD:master'])) {
    console.error('push failed — the release is committed locally but not published');
    process.exit(1);
}

// ---- 6. Confirm the published host actually serves it ----------------------
if (noLive) {
    console.log(`pushed ${head.slice(0, 7)} — skipping the live check (--no-live)`);
    process.exit(0);
}
step(`live check (up to ${liveWait}s)`);
const live = run(process.execPath, ['scripts/verify-live.cjs', '--id', id, '--version', next, '--wait', String(liveWait)]);
if (live === 0) {
    console.log(`\nReleased ${id} ${next}: pushed ${head.slice(0, 7)} and confirmed live.`);
    process.exit(0);
}
if (live === 2) {
    console.error(`\n${id} ${next} is pushed (${head.slice(0, 7)}) but the host has not caught up yet.`);
    console.error('Check the Actions run for master, then re-run: node scripts/verify-live.cjs --id ' + id + ' --version ' + next);
    process.exit(2);
}
console.error(`\n${id} ${next} is pushed but the published bundle does not match this build — investigate before telling anyone to update.`);
process.exit(1);
