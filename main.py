# decky-ukr-badge/main.py

import os
import json
import logging
import decky

# Configure logging first to capture all potential issues
LOG_FILE = "/tmp/decky-ukr-badge.log"
logging.basicConfig(
    filename=LOG_FILE,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='w', # Use 'w' to overwrite the log file on each load for fresh diagnostics
    level=logging.DEBUG,
    force=True # Ensures the configuration is applied even if handlers exist
)
logger = logging.getLogger() # Get the root logger now that it's configured

# Шлях до налаштувань
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "user_settings.json")

DEFAULT_SETTINGS = {
    "badgeType": "full",
    "badgePosition": "top-right",
    "offsetX": 10,
    "offsetY": 10,
}

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                settings = json.load(f)
                logger.debug(f"Loaded settings: {settings}")
                return {**DEFAULT_SETTINGS, **settings}
        except Exception as e:
            logger.exception("Failed to load settings file")
    return DEFAULT_SETTINGS.copy()

def save_settings(settings: dict):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings, f)
            logger.debug(f"Saved settings: {settings}")
        return True
    except Exception as e:
        logger.exception("Failed to save settings")
        return False

@decky.plugin.method()
async def get_settings() -> dict:
    logger.debug("get_settings called")
    return load_settings()

@decky.plugin.method()
async def set_settings(key: str, value) -> bool:
    logger.debug(f"set_settings called: {key} = {value}")
    settings = load_settings()
    if key in DEFAULT_SETTINGS:
        settings[key] = value
        return save_settings(settings)
    logger.warning(f"Ignored unknown setting key: {key}")
    return False

@decky.plugin.method()
async def clear_cache() -> bool:
    logger.debug("clear_cache called")
    # Тут можеш очистити кеш, якщо треба
    return True

async def _main():
    logger.info("decky-ukr-badge Plugin Loaded")

async def _unload():
    logger.info("decky-ukr-badge Plugin Unloaded")

if __name__ == "__main__":
    # This section is for local PC testing only
    # It will not run when the plugin is deployed on the Steam Deck
    async def test_plugin():
        logger.info("--- Starting Local Plugin Test --- ")

        # Initialize the plugin (this is usually done by Decky Loader)
        await _main()

        # Test get_settings
        print("\n--- Testing get_settings ---")
        settings = await get_settings()
        print(f"Initial settings: {settings}")

        # Test set_settings
        print("\n--- Testing set_settings ---")
        test_key = "badgeType"
        test_value = "default"
        print(f"Setting {test_key} to {test_value}")
        success_set = await set_settings(test_key, test_value)
        print(f"Set settings successful: {success_set}")

        # Verify setting was saved
        settings_after_set = await get_settings()
        print(f"Settings after update: {settings_after_set}")

        # Test clear_cache
        print("\n--- Testing clear_cache ---")
        success_clear = await clear_cache()
        print(f"Clear cache successful: {success_clear}")

        # Simulate plugin unload
        await _unload()

        logger.info("--- Local Plugin Test Finished --- ")

    import asyncio
    asyncio.run(test_plugin())
