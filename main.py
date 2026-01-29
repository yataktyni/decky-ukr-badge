# decky-ukr-badge/main.py

import json
import os
import asyncio
import datetime
import httpx
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

class NetworkInfo(TypedDict):
    ip: str
    ssh_status: str
    ssh_port: int
    cef_debug_port: int
    cef_debug_url: str

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
LOG_BUFFER: List[str] = []
MAX_LOG_ENTRIES = 100

# ============================================
# Core Utilities
# ============================================

def add_log(message: str, level: str = "INFO"):
    """Add a log entry to the buffer and system logger."""
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    entry = f"[{timestamp}] [{level}] {message}"
    LOG_BUFFER.append(entry)

    if len(LOG_BUFFER) > MAX_LOG_ENTRIES:
        LOG_BUFFER.pop(0)

    log_method = getattr(decky.logger, level.lower() if level != "WARN" else "warning", decky.logger.info)
    log_method(message)

async def run_command(cmd: List[str], timeout: int = 10) -> Tuple[bool, str]:
    """Non-blocking execution of shell commands."""
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            output = (stdout.decode() + stderr.decode()).strip()
            return proc.returncode == 0, output
        except asyncio.TimeoutError:
            proc.kill()
            return False, "Command timed out"
    except Exception as e:
        return False, str(e)

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
    """Fetch official language support via Steam API."""
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=en"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
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
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
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
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(search_url)
            if resp.status_code != 200:
                return "NONE"
            
            match = re.search(r'class="product-item[^"]*".*?href="([^"]+)"', resp.text, re.DOTALL)
            if not match:
                return "NONE"
            
            href = match.group(1)
            full_url = href if href.startswith("http") else f"https://kuli.com.ua/{href.lstrip('/')}"
            
            game_resp = await client.get(full_url)
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

async def get_logs() -> List[str]:
    return LOG_BUFFER.copy()

async def clear_logs() -> bool:
    global LOG_BUFFER
    LOG_BUFFER = []
    add_log("Logs cleared")
    return True

async def get_network_info() -> NetworkInfo:
    info: NetworkInfo = {
        "ip": "unknown",
        "ssh_status": "unknown",
        "ssh_port": 22,
        "cef_debug_port": 8080,
        "cef_debug_url": "unknown",
    }
    
    # IP Detection
    success, output = await run_command(["hostname", "-I"])
    if success and output:
        info["ip"] = output.split()[0]
    else:
        success, output = await run_command(["ip", "route", "get", "1"])
        if success and "src" in output:
            parts = output.split()
            if "src" in parts:
                info["ip"] = parts[parts.index("src") + 1]

    if info["ip"] != "unknown":
        info["cef_debug_url"] = f"http://{info['ip']}:8080"

    # SSH Status
    success, output = await run_command(["systemctl", "is-active", "sshd"])
    info["ssh_status"] = "active" if success and "active" in output else "inactive"
    
    return info

# ============================================
# System Controls
# ============================================

async def enable_ssh() -> Dict[str, Any]:
    await run_command(["sudo", "systemctl", "enable", "sshd"])
    success, output = await run_command(["sudo", "systemctl", "start", "sshd"])
    return {"success": success, "message": "SSH started" if success else output}

async def disable_ssh() -> Dict[str, Any]:
    await run_command(["sudo", "systemctl", "stop", "sshd"])
    success, output = await run_command(["sudo", "systemctl", "disable", "sshd"])
    return {"success": success, "message": "SSH stopped" if success else output}

async def restart_steam() -> Dict[str, Any]:
    success, output = await run_command(["systemctl", "--user", "restart", "gamescope-session"])
    if not success:
        success, output = await run_command(["killall", "-9", "steam"])
    return {"success": success, "message": "Steam restart initiated" if success else output}

async def restart_deck() -> Dict[str, Any]:
    success, output = await run_command(["sudo", "systemctl", "reboot"])
    return {"success": success, "message": "Rebooting" if success else output}

async def restart_decky() -> Dict[str, Any]:
    success, output = await run_command(["sudo", "systemctl", "restart", "plugin_loader"])
    return {"success": success, "message": "Decky restart initiated" if success else output}

# ============================================
# Lifecycle
# ============================================

async def _main():
    add_log("UA Badge Backend Protocol Active", "INFO")
    load_settings()

async def _unload():
    add_log("UA Badge Backend Protocol Unloaded", "INFO")

# Init
load_settings()
