# decky-ukr-badge/main.py

import json
import os
import requests
import re
import urllib.parse
from typing import List, Dict, Any, TypedDict

import decky

# ============================================
# Types & Constants
# ============================================

class Settings(TypedDict):
    badgeType: str
    badgePosition: str
    offsetX: int
    offsetY: int
    showOnStore: bool
    storeOffsetX: int
    storeOffsetY: int

SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS: Settings = {
    "badgeType": "full",
    "badgePosition": "top-left",
    "offsetX": 16,
    "offsetY": 16,
    "showOnStore": False,
    "storeOffsetX": 0,
    "storeOffsetY": 20,
}

SETTINGS: Settings = DEFAULT_SETTINGS.copy()

# ============================================
# Settings Management
# ============================================

def load_settings() -> Settings:
    global SETTINGS
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                SETTINGS = {**DEFAULT_SETTINGS, **data}
                return SETTINGS
        except Exception as e:
            decky.logger.error(f"Settings load failed: {e}")
    return SETTINGS

def save_settings() -> bool:
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(SETTINGS, f, indent=2)
        return True
    except Exception as e:
        decky.logger.error(f"Settings save failed: {e}")
        return False

# ============================================
# Backend Methods (Top-level for Decky)
# ============================================

async def get_settings() -> Settings:
    decky.logger.info("UA Badge: get_settings called")
    return load_settings()

async def set_settings(key: str, value: Any) -> bool:
    global SETTINGS
    decky.logger.info(f"UA Badge: set_settings {key}={value}")
    if key in DEFAULT_SETTINGS:
        SETTINGS[key] = value # type: ignore
        return save_settings()
    return False

async def get_system_info() -> Dict[str, str]:
    """Get system details including plugin, OS, and Decky versions."""
    steamos_version = "Unknown"
    plugin_version = "Unknown"
    
    # Get SteamOS version
    try:
        if os.path.exists("/etc/os-release"):
            with open("/etc/os-release", "r") as f:
                for line in f:
                    if line.startswith("VERSION_ID="):
                        steamos_version = line.split("=")[1].strip().strip('"')
                        break
    except Exception:
        pass

    # Get Plugin version from plugin.json
    try:
        plugin_json_path = os.path.join(os.path.dirname(__file__), "plugin.json")
        if os.path.exists(plugin_json_path):
            with open(plugin_json_path, "r") as f:
                data = json.load(f)
                plugin_version = data.get("version", "Unknown")
    except Exception:
        pass

    return {
        "plugin_version": plugin_version,
        "steamos_version": steamos_version,
        "decky_version": getattr(decky, "DECKY_VERSION", "Unknown")
    }

async def reset_settings() -> Settings:
    """Reset all settings to defaults."""
    global SETTINGS
    SETTINGS = DEFAULT_SETTINGS.copy()
    save_settings()
    return SETTINGS

async def get_steam_languages(app_id: str) -> List[str]:
    """Fetch official language support via Steam API (using requests)."""
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=en"
    try:
        resp = requests.get(url, timeout=10.0)
        if resp.status_code != 200:
            return []
        
        data = resp.json()
        app_data = data.get(app_id, {})
        if not app_data.get("success"):
            return []
        
        html_langs = app_data["data"].get("supported_languages", "")
        clean = re.sub(r"<strong>\*</strong>", "", html_langs)
        clean = re.sub(r"<br\s*/?>", ",", clean, flags=re.IGNORECASE)
        clean = re.sub(r"<[^>]*>", "", clean)
        
        return [l.strip().lower() for l in clean.split(",") if l.strip()]
    except Exception as e:
        decky.logger.error(f"Steam API error: {e}")
        return []

async def get_kuli_status(game_name: str) -> Dict[str, str]:
    """Fetch localization status and URL from kuli.com.ua."""
    def urlify(name):
        return re.sub(r"[^a-z0-9]+", "-", re.sub(r"[':']", "", name.lower())).strip("-")

    slug = urlify(game_name)
    url = f"https://kuli.com.ua/{slug}"
    
    try:
        resp = requests.get(url, timeout=10.0, headers={"Accept": "text/html"})
        
        if resp.status_code == 404:
            return await search_kuli(game_name)
        
        if resp.status_code != 200:
            return {"status": "NONE", "url": ""}
        
        html = resp.text
        if "item__instruction-main" in html:
            return {"status": "COMMUNITY", "url": url}
        if any(m in html for m in ["html-product-details-page", "game-page", "item__title"]):
            return {"status": "OFFICIAL", "url": url}
    except Exception as e:
        decky.logger.error(f"Kuli error: {e}")
    return {"status": "NONE", "url": ""}

async def search_kuli(game_name: str) -> Dict[str, str]:
    """Search fallback for kuli.com.ua, returns dict with status and url."""
    search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
    try:
        resp = requests.get(search_url, timeout=10.0)
        if resp.status_code != 200:
            return {"status": "NONE", "url": ""}
        
        # Improved regex to find product link
        match = re.search(r'class="product-item[^"]*".*?href="([^"]+)"', resp.text, re.DOTALL)
        if not match:
            return {"status": "NONE", "url": ""}
        
        href = match.group(1)
        full_url = href if href.startswith("http") else f"https://kuli.com.ua{'' if href.startswith('/') else '/'}{href.lstrip('/')}"
        
        game_resp = requests.get(full_url, timeout=10.0)
        if game_resp.status_code == 200:
            html = game_resp.text
            if "item__instruction-main" in html:
                return {"status": "COMMUNITY", "url": full_url}
            if any(m in html for m in ["html-product-details-page", "game-page", "item__title"]):
                return {"status": "OFFICIAL", "url": full_url}
    except Exception as e:
        decky.logger.error(f"Kuli search error: {e}")
    return {"status": "NONE", "url": ""}

# Lifecycle
async def _main():
    decky.logger.info("UA Badge: _main called")
    load_settings()

async def _unload():
    decky.logger.info("UA Badge: _unload called")

# Initialize settings immediately
load_settings()
