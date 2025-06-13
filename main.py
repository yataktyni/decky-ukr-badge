import os
import json
import logging
import decky
import shutil
import asyncio

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

class SettingsManager:
    def __init__(self, plugin_name):
        # Using decky.DECKY_USER_HOME for user-specific settings path
        self.plugin_data_path = os.path.join(decky.DECKY_USER_HOME, ".config", "decky-plugins", plugin_name)
        os.makedirs(self.plugin_data_path, exist_ok=True)
        self.file_path = os.path.join(self.plugin_data_path, "settings.json")
        self.settings = self._load_settings()

    def _load_settings(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    loaded_settings = json.load(f)
                    logger.debug(f"Loaded settings: {loaded_settings}")
                    # Merge loaded settings with defaults, giving preference to loaded settings
                    return {**DEFAULT_SETTINGS, **loaded_settings}
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse settings JSON: {e}. Using default settings.")
                return DEFAULT_SETTINGS.copy()
            except Exception as e:
                logger.error(f"Error loading settings file: {e}. Using default settings.")
                return DEFAULT_SETTINGS.copy()
        else:
            logger.debug("Settings file not found, using default settings.")
            return DEFAULT_SETTINGS.copy()

    def commit(self):
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4)
                logger.debug(f"Committed settings: {self.settings}")
        except Exception as e:
            logger.error(f"Error committing settings: {e}")

class Plugin:
    def __init__(self):
        self.settings_manager = SettingsManager("decky-ukr-badge")
        self.settings = self.settings_manager.settings # Expose settings directly

    async def _main(self):
        logger.info("Decky UKR Badge: Plugin loaded.")
        pass

    async def _unload(self):
        logger.info("Decky UKR Badge: Plugin unloaded.")
        pass

    async def _uninstall(self):
        logger.info("Decky UKR Badge: Plugin uninstalled. Cleaning up plugin data.")
        # Remove the plugin's data directory on uninstall for a clean slate
        try:
            if os.path.exists(self.settings_manager.plugin_data_path):
                shutil.rmtree(self.settings_manager.plugin_data_path)
                logger.info(f"Removed plugin data directory: {self.settings_manager.plugin_data_path}")
            else:
                logger.info(f"Plugin data directory not found during uninstall: {self.settings_manager.plugin_data_path}")
        except Exception as e:
            logger.error(f"Error removing plugin data directory on uninstall: {e}")
        pass

    async def _migration(self):
        logger.info("Decky UKR Badge: Migrating plugin data.")
        # Example migrations (uncomment and modify as needed)
        # decky.migrate_logs(os.path.join(decky.DECKY_USER_HOME, ".config", "old-plugin-name", "plugin.log"))
        # decky.migrate_settings(
        #     os.path.join(decky.DECKY_HOME, "settings", "old-plugin-name.json"),
        #     os.path.join(decky.DECKY_USER_HOME, ".config", "old-plugin-name"))
        # decky.migrate_runtime(
        #     os.path.join(decky.DECKY_HOME, "old-plugin-name"),
        #     os.path.join(decky.DECKY_USER_HOME, ".local", "share", "old-plugin-name"))
        pass

    async def get_settings(self):
        # Ensure settings are up-to-date before returning
        self.settings = self.settings_manager._load_settings()
        logger.debug(f"get_settings called, returning: {self.settings}")
        return {"success": True, "result": self.settings}

    async def set_settings(self, key, value):
        logger.debug(f"set_settings called: key={key}, value={value}")
        # Update settings via SettingsManager, which also handles saving
        self.settings_manager.settings[key] = value
        self.settings_manager.commit()
        self.settings = self.settings_manager.settings # Update the plugin's internal settings
        return {"success": True}

    async def clear_cache(self):
        cache_path = os.path.join(self.settings_manager.plugin_data_path, "cache")
        try:
            if os.path.exists(cache_path):
                shutil.rmtree(cache_path) # Recursively remove directory
                logger.info(f"Removed cache directory: {cache_path}")
                return {"success": True, "message": "Cache cleared successfully."}
            else:
                logger.info("No cache directory to remove.")
                return {"success": True, "message": "No cache to clear."}
        except Exception as e:
            logger.error(f"Error clearing cache directory: {e}")
            return {"success": False, "error": str(e)}
