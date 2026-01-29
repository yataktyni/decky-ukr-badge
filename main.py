# decky-ukr-badge/main.py

import json
import os
import datetime
import requests
import re
import urllib.parse
from typing import List, Dict, Any, TypedDict, Optional, Tuple

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
    "offsetX": 10,
    "offsetY": 10,
    "showOnStore": False,
    "storeOffsetX": 0,
    "storeOffsetY": 0,
}

# In-memory state
SETTINGS: Settings = DEFAULT_SETTINGS.copy()

# ============================================
# Core Utilities
# ============================================

def add_log(message: str, level: str = "INFO"):
    """Log via decky logger."""
    log_method = getattr(decky.logger, level.lower() if level != "WARN" else "warning", decky.logger.info)
    log_method(message)

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
            add_log(f"Settings load failed: {e}", "ERROR")
    return SETTINGS

def save_settings() -> bool:
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(SETTINGS, f, indent=2)
        return True
    except Exception as e:
        add_log(f"Settings save failed: {e}", "ERROR")
        return False

# ============================================
# External Data Services
# ============================================

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
        add_log(f"Steam API error: {e}", "ERROR")
        return []

async def get_kuli_status(game_name: str) -> str:
    """Fetch localization status from kuli.com.ua."""
    def urlify(name):
        return re.sub(r"[^a-z0-9]+", "-", re.sub(r"[':’]", "", name.lower())).strip("-")

    slug = urlify(game_name)
    url = f"https://kuli.com.ua/{slug}"
    
    try:
        resp = requests.get(url, timeout=10.0, headers={"Accept": "text/html"})
        if resp.status_code == 404:
            return await search_kuli(game_name)
        
        if resp.status_code != 200:
            return "NONE"
        
        html = resp.text
        if "item__instruction-main" in html:
            return "COMMUNITY"
        if any(m in html for m in ["html-product-details-page", "game-page", "item__title"]):
            return "OFFICIAL"
    except Exception as e:
        add_log(f"Kuli error: {e}", "ERROR")
    return "NONE"

async def search_kuli(game_name: str) -> str:
    """Search fallback for kuli.com.ua."""
    search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
    try:
        resp = requests.get(search_url, timeout=10.0)
        if resp.status_code != 200:
            return "NONE"
        
        match = re.search(r'class="product-item[^"]*".*?href="([^"]+)"', resp.text, re.DOTALL)
        if not match:
            return "NONE"
        
        href = match.group(1)
        full_url = href if href.startswith("http") else f"https://kuli.com.ua/{href.lstrip('/')}"
        
        game_resp = requests.get(full_url, timeout=10.0)
        if game_resp.status_code == 200:
            html = game_resp.text
            if "item__instruction-main" in html:
                return "COMMUNITY"
            if any(m in html for m in ["html-product-details-page", "game-page", "item__title"]):
                return "OFFICIAL"
    except Exception as e:
        add_log(f"Kuli search error: {e}", "ERROR")
    return "NONE"

# ============================================
# API Implementation
# ============================================

async def get_settings() -> Settings:
    return load_settings()

async def set_settings(key: str, value: Any) -> bool:
    global SETTINGS
    if key in DEFAULT_SETTINGS:
        SETTINGS[key] = value # type: ignore
        return save_settings()
    return False

# ============================================
# Lifecycle
# ============================================

async def _main():
    add_log("UA Badge Backend Initialized", "INFO")
    load_settings()

async def _unload():
    add_log("UA Badge Backend Unloaded", "INFO")

# Init
load_settings()
