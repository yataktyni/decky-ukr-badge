# decky-ukr-badge/main.py

import asyncio
import json
import os
import urllib.parse
import urllib.request
import urllib.error
from typing import Dict, Any, TypedDict

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


DEFAULT_SETTINGS: Settings = {
    "badgeType": "full",
    "badgePosition": "top-right",
    "offsetX": 20,
    "offsetY": 90,
    "showOnStore": True,
    "storeOffsetX": 0,
    "storeOffsetY": 20,
}

HTTP_TIMEOUT = 10
HTTP_USER_AGENT = "decky-ukr-badge/1.0"


# ============================================
# HTTP Helpers
# ============================================

def _sync_http_get(url: str, headers: Dict[str, str] | None = None) -> str:
    """Synchronous HTTP GET - to be called via asyncio.to_thread()."""
    headers = headers or {}
    if "User-Agent" not in headers:
        headers["User-Agent"] = HTTP_USER_AGENT
    req = urllib.request.Request(url)
    for key, value in headers.items():
        req.add_header(key, value)
    
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as response:
        return response.read().decode("utf-8")


async def http_get(url: str, headers: Dict[str, str] | None = None) -> str | None:
    """Non-blocking HTTP GET using thread pool."""
    try:
        return await asyncio.to_thread(_sync_http_get, url, headers)
    except Exception as e:
        decky.logger.error(f"HTTP error for {url}: {e}")
        return None


def _sync_http_get_binary(url: str, headers: Dict[str, str] | None = None) -> bytes:
    """Synchronous HTTP GET returning raw bytes."""
    headers = headers or {}
    if "User-Agent" not in headers:
        headers["User-Agent"] = HTTP_USER_AGENT
    req = urllib.request.Request(url)
    for key, value in headers.items():
        req.add_header(key, value)
    
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


async def http_get_binary(url: str, headers: Dict[str, str] | None = None) -> bytes | None:
    """Non-blocking HTTP GET for binary data."""
    try:
        return await asyncio.to_thread(_sync_http_get_binary, url, headers)
    except Exception as e:
        decky.logger.error(f"Binary download error for {url}: {e}")
        return None


# ============================================
# Plugin Class (Required by Decky)
# ============================================

class Plugin:
    settings: Settings = DEFAULT_SETTINGS.copy()
    settings_file: str = ""
    
    # Lifecycle Methods
    async def _main(self):
        """Called when plugin loads."""
        decky.logger.info("decky-ukr-badge: _main called")
        self.settings_file = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
        self._load_settings()
    
    async def _unload(self):
        """Called when plugin unloads."""
        decky.logger.info("decky-ukr-badge: _unload called")
    
    # Settings Management
    def _load_settings(self) -> Settings:
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.settings = {**DEFAULT_SETTINGS, **data}
                    decky.logger.info(f"Settings loaded: {self.settings}")
                    return self.settings
            except Exception as e:
                decky.logger.error(f"Settings load failed: {e}")
        return self.settings
    
    def _save_settings(self) -> bool:
        try:
            os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, indent=2)
            return True
        except Exception as e:
            decky.logger.error(f"Settings save failed: {e}")
            return False
    
    # Public API Methods (called from frontend)
    async def get_settings(self) -> Settings:
        decky.logger.info("get_settings called")
        return self._load_settings()
    
    async def set_settings(self, key: str, value: Any) -> bool:
        decky.logger.info(f"set_settings: {key}={value}")
        if key in DEFAULT_SETTINGS:
            self.settings[key] = value  # type: ignore
            return self._save_settings()
        return False
    
    async def get_current_version(self) -> str:
        """Get current plugin version from plugin.json."""
        try:
            plugin_dir = os.path.dirname(os.path.abspath(__file__))
            plugin_json_path = os.path.join(plugin_dir, "plugin.json")
            decky.logger.info(f"[VERSION] Looking for: {plugin_json_path}")
            
            if os.path.exists(plugin_json_path):
                with open(plugin_json_path, "r", encoding="utf-8") as f:
                    plugin_data = json.load(f)
                    version = plugin_data.get("version", "0.0.0")
                    decky.logger.info(f"[VERSION] Read: {version}")
                    return version
            else:
                decky.logger.error("[VERSION] plugin.json not found!")
            return "0.0.0"
        except Exception as e:
            decky.logger.error(f"get_current_version failed: {e}")
            return "unknown"
    
    async def get_latest_version(self) -> Dict[str, Any]:
        """Check GitHub for latest version."""
        try:
            current_version = await self.get_current_version()
            
            github_api = "https://api.github.com/repos/yataktyni/decky-ukr-badge/releases/latest"
            response = await http_get(github_api)
            
            if not response:
                return {"current": current_version, "latest": None, "update_available": False}
            
            release_data = json.loads(response)
            latest_tag = release_data.get("tag_name", "")
            latest_version = latest_tag.lstrip("v")
            
            def parse_version(v):
                try:
                    return tuple(int(x) for x in v.split("."))
                except:
                    return (0, 0, 0)
            
            current_tuple = parse_version(current_version)
            latest_tuple = parse_version(latest_version)
            update_available = latest_tuple > current_tuple
            
            decky.logger.info(f"Version check: current={current_version}, latest={latest_version}, update={update_available}")
            
            return {
                "current": current_version,
                "latest": latest_version,
                "latest_tag": latest_tag,
                "update_available": update_available
            }
        except Exception as e:
            decky.logger.error(f"Version check failed: {e}")
            return {"current": "unknown", "latest": None, "update_available": False}
    
    async def update_plugin(self) -> Dict[str, Any]:
        """Download and install latest release from GitHub."""
        import zipfile
        import io
        
        # Check if update is needed
        decky.logger.info("[UPDATE] Checking if update is needed...")
        version_info = await self.get_latest_version()
        
        if not version_info.get("update_available"):
            decky.logger.info("[UPDATE] Already up to date")
            return {"success": True, "message": "Already up to date", "already_current": True}
        
        release_url = "https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip"
        plugin_dir = os.path.dirname(os.path.abspath(__file__))
        
        try:
            decky.logger.info("[UPDATE] Downloading release.zip...")
            zip_data = await http_get_binary(release_url)
            if not zip_data:
                return {"success": False, "error": "Download failed"}
            
            decky.logger.info(f"[UPDATE] Downloaded {len(zip_data)} bytes")
            
            def extract_zip(data: bytes, target_dir: str) -> int:
                with zipfile.ZipFile(io.BytesIO(data)) as zf:
                    count = 0
                    for info in zf.infolist():
                        if info.is_dir():
                            continue
                        parts = info.filename.split("/", 1)
                        target_name = parts[1] if len(parts) > 1 else parts[0]
                        if not target_name:
                            continue
                        target_path = os.path.join(target_dir, target_name)
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        with zf.open(info) as src, open(target_path, 'wb') as dst:
                            dst.write(src.read())
                        count += 1
                    return count
            
            decky.logger.info("[UPDATE] Extracting...")
            file_count = await asyncio.to_thread(extract_zip, zip_data, plugin_dir)
            
            decky.logger.info(f"[UPDATE] Complete! Extracted {file_count} files")
            return {"success": True, "message": "Update complete. Restart Decky.", "needs_restart": True}
            
        except zipfile.BadZipFile:
            return {"success": False, "error": "Invalid zip file"}
        except Exception as e:
            decky.logger.error(f"Update failed: {e}")
            return {"success": False, "error": str(e)}
