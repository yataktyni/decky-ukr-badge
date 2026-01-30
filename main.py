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

def _sync_http_get_binary(url: str, headers: Dict[str, str] | None = None) -> bytes:
    """Synchronous HTTP GET returning raw bytes for binary files."""
    req = urllib.request.Request(url)
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)
    
    with urllib.request.urlopen(req, timeout=30) as response:  # Longer timeout for downloads
        return response.read()

async def http_get_binary(url: str, headers: Dict[str, str] | None = None) -> bytes | None:
    """Non-blocking HTTP GET for binary data (e.g., zip files)."""
    try:
        return await asyncio.to_thread(_sync_http_get_binary, url, headers)
    except Exception as e:
        decky.logger.error(f"Binary download error for {url}: {e}")
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
    decky.logger.info("get_settings called")
    return load_settings()

async def set_settings(key: str, value: Any) -> bool:
    global SETTINGS
    decky.logger.info(f"set_settings {key}={value}")
    if key in DEFAULT_SETTINGS:
        SETTINGS[key] = value # type: ignore
        return save_settings()
    return False



async def get_latest_version() -> Dict[str, Any]:
    """Check GitHub for latest version and compare with current."""
    try:
        # Get current version from plugin.json
        current_dir = os.path.dirname(os.path.abspath(__file__))
        plugin_json_path = os.path.join(current_dir, "plugin.json")
        
        current_version = "0.0.0"
        decky.logger.info(f"Looking for plugin.json at: {plugin_json_path}")
        if os.path.exists(plugin_json_path):
            with open(plugin_json_path, "r", encoding="utf-8") as f:
                plugin_data = json.load(f)
                current_version = plugin_data.get("version", "0.0.0")
        
        decky.logger.info(f"Current version from plugin.json: {current_version}")
        
        # Fetch latest release from GitHub
        github_api = "https://api.github.com/repos/yataktyni/decky-ukr-badge/releases/latest"
        response = await http_get(github_api)
        
        if not response:
            decky.logger.error("No response from GitHub API")
            return {"current": current_version, "latest": None, "update_available": False}
        
        release_data = json.loads(response)
        latest_tag = release_data.get("tag_name", "")
        latest_version = latest_tag.lstrip("v")
        
        decky.logger.info(f"Latest version from GitHub: tag={latest_tag}, version={latest_version}")
        
        # Compare versions
        def parse_version(v):
            try:
                return tuple(int(x) for x in v.split("."))
            except Exception as parse_error:
                decky.logger.error(f"Version parse error for '{v}': {parse_error}")
                return (0, 0, 0)
        
        current_tuple = parse_version(current_version)
        latest_tuple = parse_version(latest_version)
        
        decky.logger.info(f"Parsed versions - current: {current_tuple}, latest: {latest_tuple}")
        
        update_available = latest_tuple > current_tuple
        
        decky.logger.info(f"Update available: {update_available}")
        
        return {
            "current": current_version,
            "latest": latest_version,
            "latest_tag": latest_tag,
            "update_available": update_available
        }
    except Exception as e:
        decky.logger.error(f"Version check failed: {e}")
        return {"current": "unknown", "latest": None, "update_available": False}

async def update_plugin() -> Dict[str, Any]:
    """Download and install latest release from GitHub."""
    import zipfile
    import io
    import shutil
    
    release_url = "https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip"
    plugin_dir = os.path.dirname(os.path.abspath(__file__))
    
    try:
        decky.logger.info("Starting plugin update...")
        
        # Download the release.zip as binary
        zip_data = await http_get_binary(release_url)
        if not zip_data:
            decky.logger.error("Failed to download release.zip")
            return {"success": False, "error": "Download failed - release.zip not found"}
        
        decky.logger.info(f"Downloaded {len(zip_data)} bytes")
        
        # Extract to plugin directory
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            # Get list of files to extract
            file_count = 0
            for info in zf.infolist():
                # Skip directories
                if info.is_dir():
                    continue
                
                # Remove the top-level folder from path (e.g., "decky-ukr-badge/main.py" -> "main.py")
                parts = info.filename.split("/", 1)
                if len(parts) > 1:
                    target_name = parts[1]
                else:
                    target_name = parts[0]
                
                if not target_name:
                    continue
                    
                # Extract file
                target_path = os.path.join(plugin_dir, target_name)
                target_dir = os.path.dirname(target_path)
                
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir, exist_ok=True)
                
                try:
                    with zf.open(info) as src, open(target_path, 'wb') as dst:
                        dst.write(src.read())
                    file_count += 1
                except Exception as file_error:
                    decky.logger.error(f"Failed to extract {target_name}: {file_error}")
                    return {"success": False, "error": f"Failed to extract {target_name}: {str(file_error)}"}
        
        decky.logger.info(f"Plugin update complete! Extracted {file_count} files.")
        return {"success": True, "message": "Update complete. Please restart Decky Loader."}
        
    except zipfile.BadZipFile as e:
        decky.logger.error(f"Invalid zip file: {e}")
        return {"success": False, "error": "Invalid release.zip file"}
    except Exception as e:
        decky.logger.error(f"Update failed: {e}")
        return {"success": False, "error": str(e)}

# Lifecycle
async def _main():
    decky.logger.info("_main called")
    load_settings()

async def _unload():
    decky.logger.info("_unload called")

# Initialize settings immediately
load_settings()
