# decky-ukr-badge/main.py

import os
import json
import logging
from decky_plugin import logger, plugin

# Логування для діагностики
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler("/tmp/decky-ukr-badge.log", mode="a")
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

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

@plugin.method()
async def get_settings() -> dict:
    logger.debug("get_settings called")
    return load_settings()

@plugin.method()
async def set_settings(key: str, value) -> bool:
    logger.debug(f"set_settings called: {key} = {value}")
    settings = load_settings()
    if key in DEFAULT_SETTINGS:
        settings[key] = value
        return save_settings(settings)
    logger.warning(f"Ignored unknown setting key: {key}")
    return False

@plugin.method()
async def clear_cache() -> bool:
    logger.debug("clear_cache called")
    # Тут можеш очистити кеш, якщо треба
    return True

async def _main():
    logger.info("decky-ukr-badge Plugin Loaded")

async def _unload():
    logger.info("decky-ukr-badge Plugin Unloaded")
