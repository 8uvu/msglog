# 8uvu's Revenge Plugins

Custom Revenge plugins by 8uvu.

## Plugins

| Plugin | What it does | Install URL |
| --- | --- | --- |
| **MessageLogger** | Saves deleted and edited messages to a persistent on-device log, flags ghost pings, and ships a searchable viewer with edit diffs, image caching and import/export. | `https://8uvu.github.io/msglog/dev.8uvu.message-logger/` |

The other plugins in this repository are deliberately unlisted. They are still
built and still installable, but only at the opaque paths recorded in
`publish.json`, so neither the site nor this README names them. `node build.mjs`
prints every install URL, including theirs — that is the only place to get them
from.

Add a single plugin by pasting its install URL in Revenge (Settings > Revenge >
Plugins), or add the whole repository:

```
https://8uvu.github.io/msglog/
```

The bare repository URL installs **MessageLogger** (`publish.json` pins the root
plugin to `dev.8uvu.message-logger`). Only the ids in that file's `published`
list are advertised there — see *What gets published* below.

## Development

```bash
pnpm install
node build.mjs            # write dist/ and print every install URL
node scripts/verify-all.mjs   # integrity + every plugin verifier + typecheck
node scripts/verify-live.cjs  # does the published host serve this build?
```

`verify-all.mjs` is the single source of truth for "is this shippable", and it
is what CI runs. It covers:

- **dist integrity** (`scripts/check-dist.cjs`) — every artifact `index.json`
  advertises exists with the hash and size it claims, the zipped bundle is
  byte-identical to the folder-URL install, the checked-in manifest matches the
  built version, and the root install points at the pinned plugin.
- **every plugin verifier** — each plugin's `verify.cjs` boots the built bundle
  through a Revenge-shaped host and drives the real handlers, interceptors and
  row painters. They assert behaviour, not implementation.
- **typecheck** — `tsc --noEmit` over the plugin sources (non-strict; the host
  objects are `any` by nature).

Artifacts are byte-reproducible: `build.mjs` pins the zip timestamps and
`esbuild`/`fflate` are pinned to exact versions, so the hashes in
`index.json` mean something. Before that, every build of the same source
produced a different archive, which is why a published bundle could never be
checked against a rebuild of it.

## What gets published

`dist/` is the entire public surface, and `publish.json` is the policy that
decides its shape:

- `published` — the plugin ids `index.json` advertises. That is the list
  Revenge's plugin browser shows, and the only place the site names a plugin.
- `root` — the plugin the bare repository URL installs.
- `slug` — the opaque path every *other* plugin is published at instead of its
  id: `dist/38e0c511d322/` and `dist/pool/38e0c511d322@1.2.2.zip` rather than
  `dist/dev.8uvu.fake-dm/`. The id still travels *inside* the artifact, because
  the host keys an install by it — no URL or filename the site serves spells it
  out, so browsing or guessing URLs reveals nothing. (See `scripts/publish-paths.cjs`,
  which the build, both checkers, the release command and the plugin verifiers
  all resolve their paths through.)

Every plugin folder is published with three files, so that whichever one the
install box fetches it gets JSON instead of the 404 page — a URL answering with
the 404 page is exactly the "failed to manifest" Revenge reports:

- `manifest.json` — the manifest the host reads
- `index.json` — a one-plugin repository index; GitHub Pages serves `index.json`
  for a directory URL, which is what makes the bare folder link work
- `index.js` — the bundled plugin

`node build.mjs` wipes `dist/` first. It is the published surface, not a build
cache: a file left behind by an earlier layout keeps being served, which is how
`/dev.8uvu.fake-dm/` stayed reachable long after that plugin was unlisted.
`scripts/check-dist.cjs` fails the build if the published surface — the index,
the 404 page, the root install, or the *name* of anything in `dist/` — names an
unlisted plugin, and `scripts/verify-live.cjs` fails if the deployed site still
serves one at its real id, or if an install URL does not answer with JSON.

This hides plugins from the **site**. It does not hide them from the
**repository**: `https://github.com/8uvu/msglog` is public, so `plugins/` and
`publish.json` are readable there — and anyone who reads them can work out every
slug. Making the repository private — or keeping unlisted plugin sources out of
it and publishing only their built artifacts — is the step that closes that one.

## Releasing

```bash
node scripts/release.mjs dev.8uvu.message-logger patch "Fix unseen-message edits"
```

That bumps the manifest and `PLUGIN_VERSION`, rebuilds, runs every check,
commits the plugin directory, pushes to `master`, then waits for the published
host to serve the new bundle. It exits non-zero if the deploy never catches up,
so a fix cannot silently sit unpublished — which is exactly how a release went
missing before.

CI on `master` runs the same checks in `verify` and only then deploys to GitHub
Pages; a failing check blocks the deploy instead of publishing a broken build.
