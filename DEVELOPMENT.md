# Decky Plugin Development Guide

A comprehensive guide for developing Decky Loader plugins for Steam Deck, based on best practices from ProtonDB Badges and real-world development experience.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setting Up a New Plugin](#setting-up-a-new-plugin)
3. [Frontend Development (TypeScript/React)](#frontend-development)
4. [Backend Development (Python)](#backend-development)
5. [Route Patching](#route-patching)
6. [Settings Management](#settings-management)
7. [API Calls & Data Fetching](#api-calls--data-fetching)
8. [UI Components](#ui-components)
9. [Debugging](#debugging)
10. [Testing on Steam Deck](#testing-on-steam-deck)
11. [Release & CI/CD](#release--cicd)
12. [Common Pitfalls](#common-pitfalls)
13. [Reference Links](#reference-links)

---

## Project Structure

A well-organized Decky plugin follows this structure:

```
my-decky-plugin/
├── .github/
│   └── workflows/
│       └── release.yml          # GitHub Actions for auto-release
├── src/
│   ├── components/              # React components
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAppId.ts
│   │   ├── useParams.ts
│   │   └── useSettings.ts
│   ├── index.tsx                # Plugin entry point
│   ├── settings.tsx             # Settings panel
│   ├── translations.ts          # i18n strings
│   └── utils.ts                 # Utility functions
├── .gitignore
├── LICENSE
├── README.md
├── main.py                      # Python backend
├── plugin.json                  # Plugin metadata
├── package.json                 # NPM dependencies
├── pnpm-lock.yaml
├── rollup.config.js             # Build configuration
└── tsconfig.json                # TypeScript configuration
```

---

## Setting Up a New Plugin

### 1. Initialize the Project

```bash
# Clone the official template or create from scratch
mkdir my-decky-plugin && cd my-decky-plugin

# Initialize package.json
pnpm init
```

### 2. Required Dependencies

```json
{
  "dependencies": {
    "@decky/api": "^1.1.2",
    "react-icons": "^5.3.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.7.0"
  },
  "devDependencies": {
    "@decky/rollup": "^1.0.1",
    "@decky/ui": "^4.7.2",
    "@rollup/plugin-commonjs": "^28.0.3",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "rollup": "^4.22.5",
    "shx": "^0.3.4",
    "typescript": "^5.6.2"
  }
}
```

### 3. plugin.json

```json
{
  "name": "my-plugin-name",
  "author": "your-username",
  "version": "1.0.0",
  "api_version": 1,
  "flags": [],
  "publish": {
    "tags": ["tag1", "tag2"],
    "description": "Short description of your plugin."
  }
}
```

### 4. tsconfig.json

```json
{
  "compilerOptions": {
    "outDir": "dist",
    "module": "ESNext",
    "target": "ES2020",
    "jsx": "react",
    "jsxFactory": "window.SP_REACT.createElement",
    "jsxFragmentFactory": "window.SP_REACT.Fragment",
    "declaration": false,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. rollup.config.js

```javascript
import deckyPlugin from "@decky/rollup";

export default deckyPlugin({
  // Add custom Rollup options here if needed
});
```

---

## Frontend Development

### Plugin Entry Point (index.tsx)

```typescript
import React from "react";
import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FaIcon } from "react-icons/fa";

import Settings from "./settings";
import { loadSettings } from "./hooks/useSettings";
import patchLibraryApp from "./lib/patchLibraryApp";

export default definePlugin(() => {
  // Load settings on plugin init
  loadSettings();
  
  // Set up route patches
  const libraryPatch = patchLibraryApp();

  return {
    name: "my-plugin-name",
    title: <div className={staticClasses.Title}>My Plugin</div>,
    icon: <FaIcon />,
    content: <Settings />,
    onDismount() {
      // Cleanup patches when plugin unloads
      routerHook.removePatch("/library/app/:appid", libraryPatch);
    },
  };
});
```

### Key Imports from @decky/api

```typescript
import { 
  definePlugin,      // Define plugin entry
  routerHook,        // Route patching
  call,              // Call Python backend methods
  fetchNoCors,       // Fetch external APIs without CORS
} from "@decky/api";
```

### Key Imports from @decky/ui

```typescript
import {
  // Patching utilities
  afterPatch,
  findInReactTree,
  wrapReactType,
  createReactTreePatcher,
  
  // CSS classes
  staticClasses,
  appDetailsClasses,
  appDetailsHeaderClasses,
  
  // UI Components
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  DropdownItem,
  SliderField,
  ToggleField,
  TextField,
  Navigation,
  
  // Router
  ReactRouter,
} from "@decky/ui";
```

---

## Backend Development

### Python Backend (main.py)

```python
import json
import os
import subprocess
from typing import List

import decky

# Settings file path - use Decky's recommended directory
SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "option1": "value1",
    "option2": 10,
}

def load_settings() -> dict:
    """Load settings from file, with defaults."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)
                decky.logger.debug(f"Loaded settings: {settings}")
                return {**DEFAULT_SETTINGS, **settings}
        except Exception as e:
            decky.logger.exception(f"Failed to load settings: {e}")
    return DEFAULT_SETTINGS.copy()

def save_settings(settings: dict) -> bool:
    """Save settings to file."""
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        return True
    except Exception as e:
        decky.logger.exception(f"Failed to save settings: {e}")
        return False

# ============================================
# Methods exposed to frontend via call()
# ============================================

async def get_settings() -> dict:
    """Get all settings."""
    decky.logger.debug("get_settings called")
    return load_settings()

async def set_settings(key: str, value) -> bool:
    """Set a single setting."""
    decky.logger.debug(f"set_settings: {key} = {value}")
    settings = load_settings()
    if key in DEFAULT_SETTINGS:
        settings[key] = value
        return save_settings(settings)
    return False

async def my_custom_method(arg1: str, arg2: int) -> dict:
    """Custom method example."""
    decky.logger.info(f"Custom method called: {arg1}, {arg2}")
    return {"result": "success", "data": arg1 * arg2}

# ============================================
# Plugin lifecycle
# ============================================

async def _main():
    """Called when plugin loads."""
    decky.logger.info("Plugin loaded")

async def _unload():
    """Called when plugin unloads."""
    decky.logger.info("Plugin unloaded")
```

### Calling Backend from Frontend

```typescript
import { call } from "@decky/api";

// Simple call with no arguments
const settings = await call<[], SettingsType>("get_settings");

// Call with positional arguments (NOT an object!)
const result = await call("set_settings", "option1", "newValue");

// Call with multiple arguments
const data = await call("my_custom_method", "hello", 5);
```

**⚠️ IMPORTANT: Arguments are passed as positional args, NOT as an object!**

```typescript
// ❌ WRONG - Don't do this
call("set_settings", { key: "option1", value: "newValue" });

// ✅ CORRECT - Pass as separate arguments
call("set_settings", "option1", "newValue");
```

---

## Route Patching

### Basic Route Patching (ProtonDB Style)

```typescript
import { routerHook } from "@decky/api";
import {
  afterPatch,
  findInReactTree,
  appDetailsClasses,
  createReactTreePatcher,
} from "@decky/ui";

function patchLibraryApp() {
  return routerHook.addPatch("/library/app/:appid", (tree: any) => {
    const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);

    if (routeProps) {
      const patchHandler = createReactTreePatcher(
        [
          (tree: any) =>
            findInReactTree(
              tree,
              (x: any) => x?.props?.children?.props?.overview
            )?.props?.children,
        ],
        (_: Array<Record<string, unknown>>, ret?: React.ReactElement) => {
          // Find the inner container
          const container = findInReactTree(
            ret,
            (x: React.ReactElement) =>
              Array.isArray(x?.props?.children) &&
              x?.props?.className?.includes(appDetailsClasses.InnerContainer)
          );

          if (typeof container !== "object") {
            return ret;
          }

          // Inject your component
          container.props.children.splice(
            1, // Position (0 = first, 1 = after header, etc.)
            0, // Delete count
            <MyComponent key="my-component" />
          );

          return ret;
        }
      );

      afterPatch(routeProps, "renderFunc", patchHandler);
    }

    return tree;
  });
}
```

### Getting Route Parameters

Create a `useParams` hook:

```typescript
// src/hooks/useParams.ts
import { ReactRouter } from "@decky/ui";

export const useParams = Object.values(ReactRouter).find((val) =>
  /return (\w)\?\1\.params:{}/.test(`${val}`)
) as <T>() => T;
```

Usage:

```typescript
const { appid } = useParams<{ appid: string }>();
```

### Getting App Details

```typescript
// Declare the global appStore
declare const appStore: {
  GetAppOverviewByGameID: (id: number) => {
    appid: number;
    display_name: string;
    app_type: number;
  } | null;
};

// Usage
const appDetails = appStore.GetAppOverviewByGameID(parseInt(appId, 10));
const gameName = appDetails?.display_name || "";
```

---

## Settings Management

### Reactive Settings with RxJS (Recommended)

```typescript
// src/hooks/useSettings.ts
import { call } from "@decky/api";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

export type Settings = {
  option1: string;
  option2: number;
};

const DEFAULT_SETTINGS: Settings = {
  option1: "default",
  option2: 10,
};

// Reactive state
const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
const LoadingContext = new BehaviorSubject<boolean>(true);

// Update and persist
function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  const newSettings = { ...SettingsContext.value, [key]: value };
  SettingsContext.next(newSettings);
  call("set_settings", key, value).catch(console.error);
}

// Load from backend (call at plugin init)
export function loadSettings() {
  LoadingContext.next(true);
  call<[], Settings>("get_settings")
    .then((settings) => {
      if (settings) {
        SettingsContext.next({ ...DEFAULT_SETTINGS, ...settings });
      }
    })
    .catch(console.error)
    .finally(() => LoadingContext.next(false));
}

// Hook for components
export function useSettings() {
  const [settings, setSettings] = useState(SettingsContext.value);
  const [loading, setLoading] = useState(LoadingContext.value);

  useEffect(() => {
    const settingsSub = SettingsContext.subscribe(setSettings);
    const loadingSub = LoadingContext.subscribe(setLoading);
    return () => {
      settingsSub.unsubscribe();
      loadingSub.unsubscribe();
    };
  }, []);

  return {
    settings,
    loading,
    setOption1: (v: string) => updateSetting("option1", v),
    setOption2: (v: number) => updateSetting("option2", v),
  };
}
```

---

## API Calls & Data Fetching

### Using fetchNoCors for External APIs

```typescript
import { fetchNoCors } from "@decky/api";

async function fetchExternalData(url: string) {
  try {
    const response = await fetchNoCors(url, { method: "GET" });
    if (response.status === 200) {
      return await response.json();
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
  return null;
}
```

### Caching Data in localStorage

```typescript
const CACHE_KEY = "my-plugin-cache";
const CACHE_DURATION = 86400000; // 1 day

interface CacheEntry {
  timestamp: number;
  data: any;
}

function getCache(): Record<string, CacheEntry> {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

function setCache(key: string, data: any) {
  const cache = getCache();
  cache[key] = { timestamp: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCachedData(key: string): any | null {
  const cache = getCache();
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
}
```

---

## UI Components

### Opening External URLs

```typescript
import { Navigation } from "@decky/ui";

// ✅ CORRECT - Use Navigation for clickable links
<ButtonItem
  layout="below"
  onClick={() => Navigation.NavigateToExternalWeb("https://example.com")}
>
  Open Link
</ButtonItem>

// ❌ WRONG - <a> tags don't work in Decky
<a href="https://example.com">Link</a>
```

### Settings Panel Example

```typescript
import {
  PanelSection,
  PanelSectionRow,
  DropdownItem,
  SliderField,
  ButtonItem,
  ToggleField,
} from "@decky/ui";

function Settings() {
  const { settings, loading, setOption1, setOption2 } = useSettings();

  if (loading) {
    return <Spinner />;
  }

  const options = [
    { data: 0, label: "Option A", value: "a" },
    { data: 1, label: "Option B", value: "b" },
  ];

  return (
    <PanelSection title="Settings">
      <PanelSectionRow>
        <DropdownItem
          label="Choose Option"
          rgOptions={options.map((o) => ({ data: o.data, label: o.label }))}
          selectedOption={options.find((o) => o.value === settings.option1)?.data || 0}
          onChange={(val) => {
            const newValue = options.find((o) => o.data === val.data)?.value || "a";
            setOption1(newValue);
          }}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label="Number Option"
          value={settings.option2}
          min={0}
          max={100}
          step={5}
          onChange={setOption2}
          showValue
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Toggle Option"
          checked={settings.enabled}
          onChange={setEnabled}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={handleAction}>
          Do Something
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}
```

---

## Debugging

### SSH into Steam Deck

```bash
# Enable SSH on Steam Deck (in Desktop Mode > Konsole)
passwd                              # Set password
sudo systemctl enable --now sshd   # Enable SSH

# Connect from PC
ssh deck@STEAMDECK_IP
```

### View Logs

```bash
# Decky main logs
tail -f /home/deck/homebrew/logs/decky.log

# Plugin-specific logs
tail -f /home/deck/homebrew/logs/my-plugin/plugin.log

# Filter for your plugin
grep -i "my-plugin" /home/deck/homebrew/logs/decky.log
```

### CEF Remote Debugging

1. Get Steam Deck IP
2. Open browser on PC: `http://STEAMDECK_IP:8080`
3. View console logs and debug frontend

### Test Python Backend

```bash
cd /home/deck/homebrew/plugins/my-plugin
python3 -c "import main; print('OK')"
python3 -c "import decky; print(dir(decky))"
```

### Add Debug Panel to Plugin

Include a debug panel with:
- Log viewer (fetch from backend)
- Network info display
- SSH enable/disable toggle
- Restart buttons (Steam, Decky, Steam Deck)

---

## Testing on Steam Deck

### Quick Deploy via SCP

```bash
# From your development PC
scp dist/index.js deck@STEAMDECK_IP:/home/deck/homebrew/plugins/my-plugin/dist/
scp main.py deck@STEAMDECK_IP:/home/deck/homebrew/plugins/my-plugin/

# Restart Decky
ssh deck@STEAMDECK_IP "sudo systemctl restart plugin_loader"
```

### Create Deploy Script

```bash
#!/bin/bash
# deploy.sh
DECK_IP="192.168.1.100"
PLUGIN_NAME="my-plugin"

pnpm build
scp dist/index.js deck@$DECK_IP:/home/deck/homebrew/plugins/$PLUGIN_NAME/dist/
scp main.py deck@$DECK_IP:/home/deck/homebrew/plugins/$PLUGIN_NAME/
ssh deck@$DECK_IP "sudo systemctl restart plugin_loader"
echo "✅ Deployed!"
```

---

## Release & CI/CD

### GitHub Actions Workflow

```yaml
name: Build and Release

on:
  push:
    branches: [main]

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Calculate version
        id: version
        run: |
          RUN_NUMBER=${{ github.run_number }}
          MAJOR=$(( RUN_NUMBER / 100 ))
          MINOR=$(( (RUN_NUMBER % 100) / 10 ))
          PATCH=$(( RUN_NUMBER % 10 ))
          echo "version=${MAJOR}.${MINOR}.${PATCH}" >> $GITHUB_OUTPUT

      - name: Update versions
        run: |
          jq --arg v "${{ steps.version.outputs.version }}" '.version = $v' package.json > tmp && mv tmp package.json
          jq --arg v "${{ steps.version.outputs.version }}" '.version = $v' plugin.json > tmp && mv tmp plugin.json

      - run: pnpm install --no-frozen-lockfile
      - run: pnpm build

      - name: Create release zip
        run: |
          mkdir -p release/my-plugin/dist
          cp -r dist/* release/my-plugin/dist/
          cp main.py plugin.json package.json LICENSE README.md release/my-plugin/
          cd release && zip -r ../release.zip my-plugin

      - uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.version.outputs.version }}
          files: release.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Release artifacts
release/
*.zip

# Python
__pycache__/
*.py[cod]
.venv/

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Local testing
user_settings.json
test_settings/
```

---

## Common Pitfalls

### 1. Backend Calls Not Working

**Problem:** `call()` times out or returns undefined.

**Solution:** Pass arguments as positional, not as object:
```typescript
// ❌ Wrong
call("set_settings", { key: "option", value: "val" });

// ✅ Correct
call("set_settings", "option", "val");
```

### 2. Links Not Clickable

**Problem:** `<a href="...">` tags don't work.

**Solution:** Use `Navigation.NavigateToExternalWeb()`:
```typescript
<ButtonItem onClick={() => Navigation.NavigateToExternalWeb(url)}>
  Open Link
</ButtonItem>
```

### 3. Badge/Component Not Appearing

**Problem:** Patched component doesn't show.

**Solution:** Check:
- Route path is correct (`/library/app/:appid`)
- Using correct CSS classes (`appDetailsClasses.InnerContainer`)
- Component key is unique
- No errors in console

### 4. Settings Not Persisting

**Problem:** Settings reset after restart.

**Solution:**
- Use `decky.DECKY_PLUGIN_SETTINGS_DIR` for file path
- Ensure `os.makedirs()` creates directory
- Check file permissions

### 5. Plugin Stuck on "Loading..."

**Problem:** Settings panel shows loading forever.

**Solution:**
- Add timeout to backend calls
- Show UI with defaults on error
- Check backend logs for Python errors

### 6. TypeScript Errors

**Problem:** "Cannot find module '@decky/ui'"

**Solution:** Run `pnpm install` and ensure dependencies are correct.

---

## Reference Links

- [Decky Loader GitHub](https://github.com/SteamDeckHomebrew/decky-loader)
- [Decky Plugin Template](https://github.com/SteamDeckHomebrew/decky-plugin-template)
- [ProtonDB Badges Plugin](https://github.com/OMGDuke/protondb-decky) - Great reference implementation
- [@decky/ui Documentation](https://github.com/SteamDeckHomebrew/decky-frontend-lib)
- [Steam Deck Homebrew Discord](https://discord.gg/ZU74G2NJzk)

---

## Quick Start Checklist

- [ ] Set up project with correct structure
- [ ] Configure `plugin.json` with metadata
- [ ] Create `main.py` with settings load/save
- [ ] Create `index.tsx` with `definePlugin()`
- [ ] Implement route patching for game pages
- [ ] Create settings panel with Decky UI components
- [ ] Add caching for external API calls
- [ ] Test on Steam Deck via SSH
- [ ] Set up GitHub Actions for releases
- [ ] Update README with installation instructions