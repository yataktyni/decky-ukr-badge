import os
import json
import logging
import decky

# Setup logger for debug (CEF style debug)
logger = logging.getLogger("decky-ukr-badge")
logger.setLevel(logging.DEBUG)  # Capture all debug and above

# Console handler
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)

# Optional: File logging (uncomment to enable)
# fh = logging.FileHandler("plugin_debug.log")
# fh.setLevel(logging.DEBUG)
# fh.setFormatter(formatter)
# logger.addHandler(fh)

DEFAULT_SETTINGS = {
    "badgeType": "full",
    "badgePosition": "top-right",
    "offsetX": 10,
    "offsetY": 10,
}

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "settings.json")

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.debug(f"Loaded settings: {data}")
                return {**DEFAULT_SETTINGS, **data}
        except Exception as e:
            logger.error(f"Failed to load settings: {e}")
    else:
        logger.debug("Settings file not found, using default settings")
    return DEFAULT_SETTINGS.copy()

def save_settings(settings):
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=4)
            logger.debug(f"Saved settings: {settings}")
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")

current_settings = load_settings()

def main():
    @decky.plugin_api_method("get_settings")
    def get_settings(params):
        logger.debug(f"get_settings called with params: {params}")
        return {
            "success": True,
            "result": current_settings
        }

    @decky.plugin_api_method("set_settings")
    def set_settings(params):
        global current_settings
        new_settings = params.get("settings")
        logger.debug(f"set_settings called with new settings: {new_settings}")
        if not isinstance(new_settings, dict):
            logger.warning(f"Invalid settings received: {new_settings}")
            return {"success": False, "error": "Invalid settings"}

        current_settings.update(new_settings)
        save_settings(current_settings)
        return {"success": True}

    @decky.plugin_api_method("clear_cache")
    def clear_cache(params):
        logger.info("clear_cache called - clearing cache")
        # Add your cache clearing logic here
        return {"success": True}

    logger.info("Starting decky plugin main loop")
    decky.run()

if __name__ == "__main__":
    main()
