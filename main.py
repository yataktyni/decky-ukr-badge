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
    "badgePosition": "top-right",
    "offsetX": 20,
    "offsetY": 90,
    "showOnStore": True,
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
    decky_version = "Unknown"
    
    # Robust path resolution
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get SteamOS version
    try:
        os_release_path = "/etc/os-release"
        if os.path.exists(os_release_path):
            with open(os_release_path, "r") as f:
                for line in f:
                    if line.startswith("VERSION_ID="):
                        steamos_version = line.split("=")[1].strip().strip('"')
                        break
    except Exception as e:
        decky.logger.error(f"UA Badge: OS-release error: {e}")

    # Get Plugin version from plugin.json
    try:
        plugin_json_path = os.path.join(current_dir, "plugin.json")
        if os.path.exists(plugin_json_path):
            with open(plugin_json_path, "r") as f:
                data = json.load(f)
                plugin_version = data.get("version", "Unknown")
    except Exception as e:
        decky.logger.error(f"UA Badge: Plugin version error: {e}")

    # Get Decky version (Standard Decky Loader attribute)
    try:
        # Check current decky module first
        decky_version = getattr(decky, "DECKY_VERSION", "Unknown")
    except:
        pass

    info = {
        "plugin_version": plugin_version,
        "steamos_version": steamos_version,
        "decky_version": str(decky_version)
    }
    decky.logger.info(f"UA Badge: System info retrieved: {info}")
    return info

async def reset_settings() -> Settings:
    """Reset all settings to defaults."""
    global SETTINGS
    decky.logger.info("UA Badge: Resetting settings to defaults")
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
        if not name:
            return ""
        # Clean shortcut tags and versions
        cleaned = re.sub(r"\s*\((Shortcut|Non-Steam|App|Game)\)$", "", name, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*v\d+(\.\d+)*", "", cleaned, flags=re.IGNORECASE)
        # URL-friendly slug
        slug = cleaned.lower()
        slug = re.sub(r"[':’]", "", slug)
        slug = re.sub(r"[^a-z0-9]+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    headers = {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    slug = urlify(game_name)
    if not slug:
        return {"status": "NONE", "url": ""}
    
    # 1. Try DIRECT LINK first
    direct_url = f"https://kuli.com.ua/{slug}"
    try:
        resp = requests.get(direct_url, timeout=10.0, headers=headers)
        if resp.status_code == 200:
            html = resp.text
            markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"]
            if any(m in html for m in markers):
                status = "COMMUNITY" if "item__instruction-main" in html else "OFFICIAL"
                return {"status": status, "url": direct_url}
    except Exception as e:
        decky.logger.error(f"Kuli direct check error: {e}")

    # 2. Fallback to SEARCH
    return await search_kuli(game_name)

async def search_kuli(game_name: str) -> Dict[str, str]:
    """Search fallback for kuli.com.ua, returns dict with status and url."""
    search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
    headers = {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        resp = requests.get(search_url, timeout=10.0, headers=headers)
        if resp.status_code != 200:
            return {"status": "NONE", "url": ""}
        
        html = resp.text
        # Robust regex to capture links and titles even with nested tags
        pattern = r'href="([^"]+)".*?class="(?:item__title|product-title|product-title-wrapper)"[^>]*>(?:[\s\n]*<[^>]*>)*[\s\n]*([^<]+)'
        matches = re.findall(pattern, html, re.DOTALL)
        
        if not matches:
             # Absolute fallback for very basic grid items
             pattern_simple = r'class="(?:product-item|product-item-full|item-grid)[^"]*".*?href="([^"]+)"'
             match = re.search(pattern_simple, html, re.DOTALL)
             if match:
                  matches = [(match.group(1), "Unknown")]

        if not matches:
            return {"status": "NONE", "url": ""}

        # Strict scoring logic matching frontend
        best_match = None
        min_score = 999
        
        gn_low = game_name.lower()
        for href, title in matches:
            t_low = title.strip().lower()
            
            score = 999
            if t_low == gn_low:
                score = 0
            elif t_low.startswith(gn_low):
                score = 1
            else:
                # Basic distance heuristic for others
                score = abs(len(t_low) - len(gn_low)) + 5
            
            if score < min_score:
                min_score = score
                best_match = href
            
            if min_score == 0:
                break
        
        if not best_match or min_score > 15:
            return {"status": "NONE", "url": ""}
        
        full_url = best_match if best_match.startswith("http") else urllib.parse.urljoin("https://kuli.com.ua", best_match)
        
        # Verify the game page exists
        game_resp = requests.get(full_url, timeout=10.0, headers=headers)
        if game_resp.status_code == 200:
            gh = game_resp.text
            markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"]
            if any(m in gh for m in markers):
                status = "COMMUNITY" if "item__instruction-main" in gh else "OFFICIAL"
                return {"status": status, "url": full_url}
                
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
