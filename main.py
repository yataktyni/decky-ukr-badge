from settings import SettingsManager

class Plugin:
    def __init__(self):
        self.settings = SettingsManager(name="settings")

    async def get_settings(self):
        return self.settings.read()

    async def set_settings(self, settings):
        self.settings.settings = settings
        self.settings.commit()
        return True

    async def clear_cache(self):
        import os
        cache_path = os.path.expanduser("~/.local/share/SteamDeckHomebrew/decky-ukr-badge-cache")
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
            return True
        except Exception:
            return False 