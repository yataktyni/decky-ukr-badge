# decky-ukr-badge/main.py

import asyncio
import json
import os
import re
import urllib.parse
import urllib.request
import urllib.error
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

HTTP_TIMEOUT = 10

# ============================================
# HTTP Helper (Non-blocking)
# ============================================

def _sync_http_get(url: str, headers: Dict[str, str] | None = None) -> str:
    """Synchronous HTTP GET - to be called via asyncio.to_thread()."""
    req = urllib.request.Request(url)
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)
    
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as response:
        return response.read().decode("utf-8")

async def http_get(url: str, headers: Dict[str, str] | None = None) -> str | None:
    """Non-blocking HTTP GET using thread pool."""
    try:
        return await asyncio.to_thread(_sync_http_get, url, headers)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        decky.logger.error(f"HTTP error for {url}: {e}")
        return None
    except Exception as e:
        decky.logger.error(f"Unexpected HTTP error for {url}: {e}")
        return None

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

    # Get Decky version
    try:
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
    """Fetch official language support via Steam API (non-blocking)."""
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=en"
    
    html = await http_get(url)
    if not html:
        return []
    
    try:
        data = json.loads(html)
        app_data = data.get(app_id, {})
        if not app_data.get("success"):
            return []
        
        html_langs = app_data["data"].get("supported_languages", "")
        clean = re.sub(r"<strong>\*</strong>", "", html_langs)
        clean = re.sub(r"<br\s*/?>", ",", clean, flags=re.IGNORECASE)
        clean = re.sub(r"<[^>]*>", "", clean)
        
        return [l.strip().lower() for l in clean.split(",") if l.strip()]
    except (json.JSONDecodeError, KeyError) as e:
        decky.logger.error(f"Steam API parse error: {e}")
        return []

async def get_kuli_status(game_name: str) -> Dict[str, str]:
    """Fetch localization status and URL from kuli.com.ua (non-blocking)."""
    def urlify(name: str) -> str:
        if not name:
            return ""
        cleaned = re.sub(r"\s*\((Shortcut|Non-Steam|App|Game)\)$", "", name, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*v\d+(\.\d+)*", "", cleaned, flags=re.IGNORECASE)
        slug = cleaned.lower()
        slug = re.sub(r"[':'']", "", slug)
        slug = re.sub(r"[^a-z0-9]+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")

    headers = {
        "Accept": "text/html",
        "User-Agent": "DeckyLoader/1.0"
    }

    slug = urlify(game_name)
    if not slug:
        return {"status": "NONE", "url": ""}
    
    # Try direct link first
    direct_url = f"https://kuli.com.ua/{slug}"
    html = await http_get(direct_url, headers)
    
    if html:
        markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"]
        if any(m in html for m in markers):
            status = "COMMUNITY" if "item__instruction-main" in html else "OFFICIAL"
            return {"status": status, "url": direct_url}
    
    # Fallback to search
    return await search_kuli(game_name)

async def search_kuli(game_name: str) -> Dict[str, str]:
    """Search fallback for kuli.com.ua (non-blocking)."""
    search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
    headers = {
        "Accept": "text/html",
        "User-Agent": "DeckyLoader/1.0"
    }

    html = await http_get(search_url, headers)
    if not html:
        return {"status": "NONE", "url": ""}
    
    # Regex to capture links and titles
    pattern = r'href="([^"]+)".*?class="(?:item__title|product-title|product-title-wrapper)"[^>]*>(?:[\s\n]*<[^>]*>)*[\s\n]*([^<]+)'
    matches = re.findall(pattern, html, re.DOTALL)
    
    if not matches:
        pattern_simple = r'class="(?:product-item|product-item-full|item-grid)[^"]*".*?href="([^"]+)"'
        match = re.search(pattern_simple, html, re.DOTALL)
        if match:
            matches = [(match.group(1), "Unknown")]

    if not matches:
        return {"status": "NONE", "url": ""}

    # Scoring logic
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
    game_html = await http_get(full_url, headers)
    if game_html:
        markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"]
        if any(m in game_html for m in markers):
            status = "COMMUNITY" if "item__instruction-main" in game_html else "OFFICIAL"
            return {"status": status, "url": full_url}
    
    return {"status": "NONE", "url": ""}

async def update_plugin() -> Dict[str, Any]:
    """Download and install latest release from GitHub."""
    import zipfile
    import io
    import shutil
    
    release_url = "https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip"
    plugin_dir = os.path.dirname(os.path.abspath(__file__))
    
    try:
        decky.logger.info("UA Badge: Starting plugin update...")
        
        # Download the release.zip
        zip_data = await http_get(release_url)
        if not zip_data:
            decky.logger.error("UA Badge: Failed to download release.zip")
            return {"success": False, "error": "Download failed"}
        
        # Extract to plugin directory
        with zipfile.ZipFile(io.BytesIO(zip_data.encode('latin-1'))) as zf:
            # Get list of files to extract
            for info in zf.infolist():
                # Skip directories
                if info.is_dir():
                    continue
                    
                # Extract file
                target_path = os.path.join(plugin_dir, info.filename)
                target_dir = os.path.dirname(target_path)
                
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir, exist_ok=True)
                
                with zf.open(info) as src, open(target_path, 'wb') as dst:
                    dst.write(src.read())
        
        decky.logger.info("UA Badge: Plugin update complete!")
        return {"success": True, "message": "Update complete. Please restart Decky Loader."}
        
    except Exception as e:
        decky.logger.error(f"UA Badge: Update failed: {e}")
        return {"success": False, "error": str(e)}

# Lifecycle
async def _main():
    decky.logger.info("UA Badge: _main called")
    load_settings()

async def _unload():
    decky.logger.info("UA Badge: _unload called")

# Initialize settings immediately
load_settings()
