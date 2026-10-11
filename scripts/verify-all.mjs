// Runs every check the repository has, so CI and the release command cannot
// drift apart: distribution integrity, the settings-UI harness, each plugin's
// own verifier, and the typecheck.
//
// Usage: node scripts/verify-all.mjs [--json]
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const steps = [];
const skipped = [];
const missing = [];

steps.push({ name: 'dist integrity', args: ['scripts/check-dist.cjs'] });

if (existsSync(join(root, 'verify-ui.cjs'))) {
    steps.push({ name: 'settings UI harness', args: ['verify-ui.cjs'] });
}

for (const dir of readdirSync(join(root, 'plugins')).sort()) {
    const verifier = join(root, 'plugins', dir, 'verify.cjs');
    if (existsSync(verifier)) steps.push({ name: dir, args: [join('plugins', dir, 'verify.cjs')] });
}

// The typecheck is only optional when the repository does not declare it. If
// package.json lists typescript, a missing install is a broken environment and
// must not silently shrink this suite — that is how a check quietly stops
// running.
const declaredDevDeps = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies ?? {};
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (existsSync(tsc)) steps.push({ name: 'typecheck', args: [tsc, '--noEmit'] });
else if (declaredDevDeps.typescript) missing.push('typecheck (typescript is declared in package.json but not installed — run `pnpm install`)');
else skipped.push('typecheck (this repository does not declare typescript)');

const results = [];
for (const step of steps) {
    process.stdout.write(`\n── ${step.name} ${'─'.repeat(Math.max(4, 58 - step.name.length))}\n`);
    const run = spawnSync(process.execPath, step.args, { cwd: root, stdio: 'inherit' });
    results.push({ ...step, status: run.status ?? 1, signal: run.signal });
}

const failed = results.filter((r) => r.status !== 0);
console.log('');
for (const miss of missing) console.error(`MISSING  ${miss}`);
for (const skip of skipped) console.log(`SKIP  ${skip}`);
for (const result of results) {
    console.log(`${result.status === 0 ? 'PASS' : result.signal ? 'CRASH' : 'FAIL'}  ${result.name}`);
}

if (failed.length || missing.length) {
    console.error(`\nVERIFY-ALL FAILED: ${failed.length} of ${results.length} check(s) failed${missing.length ? `, ${missing.length} could not run` : ''}`);
    process.exit(1);
}
console.log(`\nVERIFY-ALL OK: ${results.length} check(s) passed${skipped.length ? `, ${skipped.length} skipped` : ''}`);
