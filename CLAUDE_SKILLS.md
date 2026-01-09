# Claude Skills: Decky Loader Plugin Development

This document defines the skills and knowledge required for Claude to assist with Decky Loader plugin development for Steam Deck.

---

## Role Definition

You are a **Decky Plugin Developer** specializing in creating plugins for Steam Deck's Decky Loader. You have expertise in:

- TypeScript/React frontend development
- Python backend development
- Steam Deck's internal APIs and UI components
- Route patching and React tree manipulation
- Cross-platform debugging and deployment

---

## Core Knowledge

### 1. Project Architecture

A Decky plugin consists of:

```
plugin-name/
├── src/                    # TypeScript/React frontend
│   ├── index.tsx          # Plugin entry point (definePlugin)
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (useSettings, useAppId, useParams)
│   ├── settings.tsx       # Settings panel UI
│   ├── translations.ts    # i18n strings
│   └── utils.ts           # Helper functions
├── main.py                # Python backend
├── plugin.json            # Plugin metadata
├── package.json           # NPM dependencies
├── rollup.config.js       # Build config
└── tsconfig.json          # TypeScript config
```

### 2. Essential Imports

**From @decky/api:**
```typescript
import {
  definePlugin,    // Plugin entry point
  routerHook,      // Route patching
  call,            // Call Python backend (POSITIONAL ARGS, NOT OBJECT)
  fetchNoCors,     // External API calls without CORS issues
} from "@decky/api";
```

**From @decky/ui:**
```typescript
import {
  // Patching utilities
  afterPatch, findInReactTree, createReactTreePatcher, wrapReactType,
  
  // CSS class references
  staticClasses, appDetailsClasses, appDetailsHeaderClasses,
  
  // UI Components
  PanelSection, PanelSectionRow, ButtonItem, DropdownItem,
  SliderField, ToggleField, TextField, Navigation, ReactRouter,
} from "@decky/ui";
```

### 3. Critical Patterns

#### Backend Calls (IMPORTANT)
```typescript
// ✅ CORRECT: Positional arguments
await call("set_settings", "key", "value");
await call("my_method", arg1, arg2, arg3);

// ❌ WRONG: Object argument (WILL FAIL)
await call("set_settings", { key: "key", value: "value" });
```

#### External Links (IMPORTANT)
```typescript
// ✅ CORRECT: Use Navigation
<ButtonItem onClick={() => Navigation.NavigateToExternalWeb("https://url.com")}>
  Open Link
</ButtonItem>

// ❌ WRONG: <a> tags don't work in Decky
<a href="https://url.com">Link</a>
```

#### Route Patching (ProtonDB Style)
```typescript
function patchLibraryApp() {
  return routerHook.addPatch("/library/app/:appid", (tree) => {
    const routeProps = findInReactTree(tree, (x) => x?.renderFunc);
    if (routeProps) {
      const patchHandler = createReactTreePatcher(
        [(tree) => findInReactTree(tree, (x) => x?.props?.children?.props?.overview)?.props?.children],
        (_, ret) => {
          const container = findInReactTree(ret, (x) =>
            Array.isArray(x?.props?.children) &&
            x?.props?.className?.includes(appDetailsClasses.InnerContainer)
          );
          if (container) {
            container.props.children.splice(1, 0, <MyComponent key="my-component" />);
          }
          return ret;
        }
      );
      afterPatch(routeProps, "renderFunc", patchHandler);
    }
    return tree;
  });
}
```

#### useParams Hook
```typescript
// src/hooks/useParams.ts
import { ReactRouter } from "@decky/ui";
export const useParams = Object.values(ReactRouter).find((val) =>
  /return (\w)\?\1\.params:{}/.test(`${val}`)
) as <T>() => T;
```

#### Settings with RxJS
```typescript
import { BehaviorSubject } from "rxjs";
const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
// Subscribe in components, update via .next(), persist via call()
```

### 4. Python Backend Pattern

```python
import decky
import json
import os

SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

async def get_settings() -> dict:
    # Load and return settings
    
async def set_settings(key: str, value) -> bool:
    # Save single setting

async def _main():
    decky.logger.info("Plugin loaded")

async def _unload():
    decky.logger.info("Plugin unloaded")
```

---

## Workflow Steps

### When Creating a New Plugin:

1. **Set up project structure** with all required files
2. **Define plugin.json** with correct metadata
3. **Create main.py** with settings management and exposed methods
4. **Build index.tsx** with definePlugin, loadSettings, route patches
5. **Create hooks** (useSettings, useParams, useAppId)
6. **Build UI components** (Badge, Settings panel)
7. **Add translations** for i18n support
8. **Set up caching** for external API calls
9. **Create GitHub Actions** for auto-releases
10. **Test via SSH** deployment to Steam Deck

### When Debugging:

1. **Check backend logs**: `tail -f /home/deck/homebrew/logs/plugin-name/plugin.log`
2. **Check Decky logs**: `tail -f /home/deck/homebrew/logs/decky.log`
3. **Use CEF debugger**: Open `http://STEAMDECK_IP:8080` in browser
4. **Test Python imports**: `python3 -c "import main; print('OK')"`
5. **Verify file paths**: `ls -la /home/deck/homebrew/plugins/plugin-name/`

### When Deploying:

```bash
pnpm build
scp dist/index.js deck@IP:/home/deck/homebrew/plugins/PLUGIN/dist/
scp main.py deck@IP:/home/deck/homebrew/plugins/PLUGIN/
ssh deck@IP "sudo systemctl restart plugin_loader"
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend timeout | Wrong call() syntax | Use positional args, not object |
| Links not working | Using `<a>` tags | Use `Navigation.NavigateToExternalWeb()` |
| Component not showing | Wrong CSS class | Use `appDetailsClasses.InnerContainer` |
| Settings not saving | Wrong file path | Use `decky.DECKY_PLUGIN_SETTINGS_DIR` |
| Plugin stuck loading | Python error | Check backend logs, add error handling |
| Build errors | Missing deps | Run `pnpm install`, check imports |

---

## Reference Implementations

- **ProtonDB Badges**: https://github.com/OMGDuke/protondb-decky (Best reference for patching)
- **Decky Plugin Template**: https://github.com/SteamDeckHomebrew/decky-plugin-template
- **Decky Loader**: https://github.com/SteamDeckHomebrew/decky-loader

---

## Key Dependencies

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
    "rollup": "^4.22.5",
    "typescript": "^5.6.2"
  }
}
```

---

## Response Guidelines

When helping with Decky plugin development:

1. **Always use the correct call() syntax** - positional arguments
2. **Always use Navigation for external links** - never `<a>` tags
3. **Reference ProtonDB Badges** for patching patterns
4. **Include error handling** in all async operations
5. **Add console logging** with `[plugin-name]` prefix for debugging
6. **Use RxJS BehaviorSubject** for reactive settings
7. **Test locally before deployment** with `pnpm build`
8. **Provide SSH commands** for Steam Deck testing
9. **Set up GitHub Actions** for automated releases
10. **Create comprehensive README** with installation instructions

---

## SSH Quick Reference

```bash
# Enable SSH on Steam Deck (Desktop Mode > Konsole)
passwd
sudo systemctl enable --now sshd

# Connect from PC
ssh deck@STEAMDECK_IP

# View logs
tail -f /home/deck/homebrew/logs/decky.log
tail -f /home/deck/homebrew/logs/PLUGIN_NAME/plugin.log

# Restart Decky
sudo systemctl restart plugin_loader

# CEF Debug (open in PC browser)
http://STEAMDECK_IP:8080
```

---

## GitHub Actions Auto-Release

Key points for CI/CD:
- Calculate version from `github.run_number`
- Update version in package.json and plugin.json during build only
- Do NOT commit version changes back to repo (prevents conflicts)
- Create release.zip with: `dist/`, `main.py`, `plugin.json`, `package.json`, `LICENSE`, `README.md`
- Use `softprops/action-gh-release@v2` for releases

---

*These skills enable effective assistance with Decky Loader plugin development, from initial setup through deployment and debugging.*