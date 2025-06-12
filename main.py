import json
import os
import decky

class SettingsManager:
    def __init__(self, name):
        self.plugin_data_path = os.path.join(decky.DECKY_HOME, "plugins_data", "decky-ukr-badge")
        self.file_path = os.path.join(self.plugin_data_path, f"{name}.json")
        self.settings = self._load_settings()

    def _load_settings(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return {}
        return {}

    def commit(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, 'w') as f:
            json.dump(self.settings, f, indent=4)

    async def clear_cache(self):
        cache_path = os.path.join(decky.DECKY_HOME, "plugins_data", "decky-ukr-badge", "cache")
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
            return True
        except Exception:
            return False

class Plugin:
    def __init__(self):
        self.settings = SettingsManager(name="settings")

    async def get_settings(self):
        return {"success": True, "result": self.settings.settings}

    async def set_settings(self, settings):
        self.settings.settings = settings
        try:
            self.settings.commit()
            return {"success": True}
        except Exception as e:
            print(f"Error committing settings: {e}")
            return {"success": False, "error": str(e)}

    async def clear_cache(self):
        cache_path = os.path.expanduser("~/.local/share/SteamDeckHomebrew/decky-ukr-badge-cache")
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
            return {"success": True}
        except Exception as e:
            print(f"Error clearing cache: {e}")
            return {"success": False, "error": str(e)} 