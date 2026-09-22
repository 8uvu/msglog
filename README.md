# 8uvu's Revenge Plugins

Custom Revenge plugins by 8uvu.

## Plugins

### Message Logger
Saves deleted and edited messages to a persistent on-device log, flags ghost
pings, and ships a searchable viewer with export.

**Install:** Add this plugin URL in Revenge (Settings > Revenge > Plugins):
```
https://8uvu.github.io/msglog/dev.8uvu.message-logger/
```

### Clean URLs
Strips tracking parameters (`utm_*`, `fbclid`, `gclid`, `igshid`, ...) from
links in messages as they arrive, with blacklist and whitelist modes.

**Install:**
```
https://8uvu.github.io/msglog/dev.8uvu.clean-urls/
```

## Repository

Add the whole repo as a plugin repository in Revenge:
```
https://8uvu.github.io/msglog/
```
Note: pasting the bare URL installs the repo's *root* plugin (currently
whichever plugin the build lists first — check `dist/index.json`).
