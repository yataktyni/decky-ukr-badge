# decky-ukr-badge/main.py

import json
import os

import decky

# Path to settings file - use Decky's recommended settings directory
SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "badgeType": "full",
    "badgePosition": "top-right",
    "offsetX": 10,
    "offsetY": 10,
}


def load_settings() -> dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)
                decky.logger.debug(f"Loaded settings: {settings}")
                return {**DEFAULT_SETTINGS, **settings}
        except Exception as e:
            decky.logger.exception(f"Failed to load settings file: {e}")
    return DEFAULT_SETTINGS.copy()


def save_settings(settings: dict) -> bool:
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
            decky.logger.debug(f"Saved settings: {settings}")
        return True
    except Exception as e:
        decky.logger.exception(f"Failed to save settings: {e}")
        return False


# Plugin methods exposed to frontend
async def get_settings() -> dict:
    decky.logger.debug("get_settings called")
    return load_settings()


async def set_settings(key: str, value) -> bool:
    decky.logger.debug(f"set_settings called: {key} = {value}")
    settings = load_settings()
    if key in DEFAULT_SETTINGS:
        settings[key] = value
        return save_settings(settings)
    decky.logger.warning(f"Ignored unknown setting key: {key}")
    return False


async def clear_cache() -> bool:
    decky.logger.debug("clear_cache called")
    # Cache is handled in frontend localStorage, this is a stub for potential future use
    return True


# Plugin lifecycle
async def _main():
    decky.logger.info("decky-ukr-badge plugin loaded")


async def _unload():
    decky.logger.info("decky-ukr-badge plugin unloaded")
