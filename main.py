import os
import json
import decky

PLUGIN_NAME = "decky-ua-localization-badge"
SETTINGS_FILENAME = "settings.json"


class SettingsManager:
    def __init__(self):
        self.plugin_data_path = os.path.join(decky.DECKY_HOME, "plugins", PLUGIN_NAME)
        os.makedirs(self.plugin_data_path, exist_ok=True)
        self.settings_path = os.path.join(self.plugin_data_path, SETTINGS_FILENAME)

    def _load_settings(self):
        if not os.path.exists(self.settings_path):
            return {}
        try:
            with open(self.settings_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except json.JSONDecodeError as e:
            decky.logger.warning(f"Failed to parse settings JSON: {e}")
            return {}

    def _commit_settings(self, settings):
        try:
            with open(self.settings_path, "w", encoding="utf-8") as file:
                json.dump(settings, file, indent=2)
        except Exception as e:
            decky.logger.error(f"Error committing settings: {e}")

    async def get_settings(self):
        return self._load_settings()

    async def set_settings(self, key, value):
        settings = self._load_settings()
        settings[key] = value
        self._commit_settings(settings)
        return settings

    async def clear_cache(self):
        cache_path = os.path.join(self.plugin_data_path, "cache.json")
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
                decky.logger.info("Cache file removed.")
                return True
            else:
                decky.logger.info("No cache file to remove.")
                return False
        except Exception as e:
            decky.logger.error(f"Error clearing cache: {e}")
            return False


class Plugin:
    async def _main(self):
        decky.logger.info(f"{PLUGIN_NAME} loaded.")
        self.settings = SettingsManager()

    async def _unload(self):
        decky.logger.info(f"{PLUGIN_NAME} unloaded.")

    async def _uninstall(self):
        decky.logger.info(f"{PLUGIN_NAME} uninstalled.")

    async def get_settings(self):
        return await self.settings.get_settings()

    async def set_settings(self, key, value):
        return await self.settings.set_settings(key, value)

    async def clear_cache(self):
        return {"success": await self.settings.clear_cache()}
