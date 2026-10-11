# 8uvu's Revenge Plugins

Custom Revenge plugins by 8uvu.

## Plugins

| Plugin | What it does | Install URL |
| --- | --- | --- |
| **MessageLogger** | Saves deleted and edited messages to a persistent on-device log, flags ghost pings, and ships a searchable viewer with edit diffs, image caching and import/export. | `https://8uvu.github.io/msglog/dev.8uvu.message-logger/` |
| **FakeDM** | Injects fake messages, calls, system messages, reactions and embeds into any DM or channel, with batch conversations that survive a restart. | `https://8uvu.github.io/msglog/dev.8uvu.fake-dm/` |
| **Clean URLs** | Strips tracking parameters (`utm_*`, `fbclid`, `gclid`, `igshid`, ...) from links in messages, with blacklist and whitelist modes. | `https://8uvu.github.io/msglog/dev.8uvu.clean-urls/` |
| **PlatformSpoofer** | Spoofs the platform Discord shows next to your name (desktop, web, iOS, Xbox, ...). | `https://8uvu.github.io/msglog/dev.8uvu.platform-spoofer/` |
| **LastOnlineTracker** | Records when friends go offline — a "last seen" Discord never shows you. Only counts departures you witnessed, so server syncs cannot fake them. Watches three independent presence sources and reports in its settings which ones this build actually exposes. | `https://8uvu.github.io/msglog/dev.8uvu.last-online-tracker/` |
| **HostProbe** | Diagnostic: reports which loader and APIs your Revenge build actually exposes (globals, flux, storage, toasts, file module). | `https://8uvu.github.io/msglog/dev.8uvu.host-probe/` |
| **QuickCheck** | Diagnostic: pops a native alert with your device's host diagnosis the moment the plugin is enabled. | `https://8uvu.github.io/msglog/dev.8uvu.quick-check/` |

Add a single plugin by pasting its install URL in Revenge (Settings > Revenge >
Plugins), or add the whole repository:

```
https://8uvu.github.io/msglog/
```

The bare repository URL installs **MessageLogger** (the build pins the root
plugin to `dev.8uvu.message-logger` in `build.mjs`). Only the plugins listed in
`PUBLISHED_PLUGIN_IDS` are advertised there — see *What gets published* below.

## Development

```bash
pnpm install
node build.mjs            # write dist/ (pool zips, folder installs, index.json)
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

`dist/` is the entire public surface: `index.json` (the list Revenge shows for
the repository URL), the root install, one folder URL per plugin, the pool zips,
and a generated 404 page. Only the plugins in `PUBLISHED_PLUGIN_IDS` — declared
in `build.mjs` — are advertised. Everything else still builds and stays
installable by its own folder URL, but appears nowhere public: not in
`index.json`, not on the 404 page (which is what a directory URL such as
`/dev.8uvu.message-logger/` returns), and not in any file the site serves.
`scripts/check-dist.cjs` fails the build if the published surface names an
unlisted plugin, so this cannot regress by accident.

This hides plugins from the **site**. It does not hide them from the
**repository**: `https://github.com/8uvu/msglog` is public, so the plugin sources
are readable there. Making the repository private — or publishing build output
from a private repository — is the step that closes that one.

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
