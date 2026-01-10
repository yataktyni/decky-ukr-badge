# decky-ukr-badge/main.py

import json
import os
import subprocess
from typing import List

import decky

# Path to settings file - use Decky's recommended settings directory
SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "badgeType": "full",
    "badgePosition": "top-left",
    "offsetX": 10,
    "offsetY": 10,
    "showOnStore": False,
    "storeOffsetX": 0,
    "storeOffsetY": 0,
}

# In-memory log buffer for frontend display
LOG_BUFFER: List[str] = []
MAX_LOG_ENTRIES = 100


def add_log(message: str, level: str = "INFO"):
    """Add a log entry to the buffer and also log via decky logger."""
    import datetime

    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    entry = f"[{timestamp}] [{level}] {message}"
    LOG_BUFFER.append(entry)

    # Keep buffer size limited
    while len(LOG_BUFFER) > MAX_LOG_ENTRIES:
        LOG_BUFFER.pop(0)

    # Also log to decky logger
    if level == "ERROR":
        decky.logger.error(message)
    elif level == "WARN":
        decky.logger.warning(message)
    elif level == "DEBUG":
        decky.logger.debug(message)
    else:
        decky.logger.info(message)


def load_settings() -> dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)
                add_log(f"Loaded settings: {settings}", "DEBUG")
                return {**DEFAULT_SETTINGS, **settings}
        except Exception as e:
            add_log(f"Failed to load settings: {e}", "ERROR")
    return DEFAULT_SETTINGS.copy()


def save_settings(settings: dict) -> bool:
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
            add_log(f"Saved settings: {settings}", "DEBUG")
        return True
    except Exception as e:
        add_log(f"Failed to save settings: {e}", "ERROR")
        return False


def run_command(cmd: List[str], timeout: int = 10) -> tuple:
    """Run a shell command and return (success, output)."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return (result.returncode == 0, result.stdout + result.stderr)
    except subprocess.TimeoutExpired:
        return (False, "Command timed out")
    except Exception as e:
        return (False, str(e))


# ============================================
# Plugin methods exposed to frontend
# ============================================


async def get_settings() -> dict:
    add_log("get_settings called")
    return load_settings()


async def set_settings(key: str, value) -> bool:
    add_log(f"set_settings: {key} = {value}")
    settings = load_settings()
    if key in DEFAULT_SETTINGS:
        settings[key] = value
        return save_settings(settings)
    add_log(f"Unknown setting key: {key}", "WARN")
    return False


async def clear_cache() -> bool:
    add_log("clear_cache called")
    return True


# ============================================
# Debug/Developer methods
# ============================================


async def get_logs() -> List[str]:
    """Get the log buffer for frontend display."""
    return LOG_BUFFER.copy()


async def clear_logs() -> bool:
    """Clear the log buffer."""
    global LOG_BUFFER
    LOG_BUFFER = []
    add_log("Logs cleared")
    return True


    async def get_network_info() -> dict:
    """Get network information for remote debugging."""
    info = {
        "ip": "unknown",
        "ssh_status": "unknown",
        "ssh_port": 22,
        "cef_debug_port": 8080,
        "cef_debug_url": "unknown",
    }

    try:
        # Get IP address - try multiple methods
        success, output = run_command(["hostname", "-I"])
        if success and output.strip():
            # Get first IP (usually the main one)
            ips = output.strip().split()
            if ips:
                info["ip"] = ips[0]
                info["cef_debug_url"] = f"http://{ips[0]}:8080"
        
        if info["ip"] == "unknown":
             # Fallback: ip route get 1
             success, output = run_command(["ip", "route", "get", "1"])
             if success and "src" in output:
                 try:
                     # Extract IP after 'src'
                     parts = output.split()
                     src_idx = parts.index("src")
                     if src_idx + 1 < len(parts):
                         info["ip"] = parts[src_idx + 1]
                         info["cef_debug_url"] = f"http://{info['ip']}:8080"
                 except Exception:
                     pass

        # Check SSH status
        success, output = run_command(["systemctl", "is-active", "sshd"])
        info["ssh_status"] = "active" if success and "active" in output else "inactive"

    except Exception as e:
        add_log(f"Failed to get network info: {e}", "ERROR")

    add_log(f"Network info: {info}", "DEBUG")
    return info


async def enable_ssh() -> dict:
    """Enable and start SSH service."""
    add_log("Enabling SSH...")

    result = {"success": False, "message": ""}

    try:
        # Enable sshd
        success, output = run_command(["sudo", "systemctl", "enable", "sshd"])
        if not success:
            result["message"] = f"Failed to enable sshd: {output}"
            add_log(result["message"], "ERROR")
            return result

        # Start sshd
        success, output = run_command(["sudo", "systemctl", "start", "sshd"])
        if not success:
            result["message"] = f"Failed to start sshd: {output}"
            add_log(result["message"], "ERROR")
            return result

        result["success"] = True
        result["message"] = "SSH enabled and started"
        add_log(result["message"])

    except Exception as e:
        result["message"] = str(e)
        add_log(f"SSH enable failed: {e}", "ERROR")

    return result


async def disable_ssh() -> dict:
    """Disable and stop SSH service."""
    add_log("Disabling SSH...")

    result = {"success": False, "message": ""}

    try:
        # Stop sshd
        success, output = run_command(["sudo", "systemctl", "stop", "sshd"])
        if not success:
            result["message"] = f"Failed to stop sshd: {output}"
            add_log(result["message"], "ERROR")
            return result

        # Disable sshd
        success, output = run_command(["sudo", "systemctl", "disable", "sshd"])
        if not success:
            result["message"] = f"Failed to disable sshd: {output}"
            add_log(result["message"], "ERROR")
            return result

        result["success"] = True
        result["message"] = "SSH disabled and stopped"
        add_log(result["message"])

    except Exception as e:
        result["message"] = str(e)
        add_log(f"SSH disable failed: {e}", "ERROR")

    return result


async def restart_steam() -> dict:
    """Restart Steam client."""
    add_log("Restarting Steam...")

    result = {"success": False, "message": ""}

    try:
        success, output = run_command(
            ["systemctl", "--user", "restart", "gamescope-session"]
        )
        if success:
            result["success"] = True
            result["message"] = "Steam restart initiated"
            add_log(result["message"])
        else:
            # Try alternative method
            success, output = run_command(["killall", "-9", "steam"])
            result["success"] = success
            result["message"] = (
                "Steam killed (will auto-restart)" if success else f"Failed: {output}"
            )
            add_log(result["message"], "INFO" if success else "ERROR")

    except Exception as e:
        result["message"] = str(e)
        add_log(f"Steam restart failed: {e}", "ERROR")

    return result


async def restart_deck() -> dict:
    """Restart the Steam Deck."""
    add_log("Restarting Steam Deck...")

    result = {"success": False, "message": ""}

    try:
        success, output = run_command(["sudo", "systemctl", "reboot"])
        result["success"] = success
        result["message"] = "Reboot initiated" if success else f"Failed: {output}"
        add_log(result["message"], "INFO" if success else "ERROR")

    except Exception as e:
        result["message"] = str(e)
        add_log(f"Reboot failed: {e}", "ERROR")

    return result


async def disable_decky_temporarily() -> dict:
    """Disable Decky until next boot."""
    add_log("Disabling Decky until next boot...")

    result = {"success": False, "message": ""}

    try:
        success, output = run_command(["sudo", "systemctl", "stop", "plugin_loader"])
        result["success"] = success
        result["message"] = (
            "Decky stopped (will restart on reboot)" if success else f"Failed: {output}"
        )
        add_log(result["message"], "INFO" if success else "ERROR")

    except Exception as e:
        result["message"] = str(e)
        add_log(f"Decky disable failed: {e}", "ERROR")

    return result


async def restart_decky() -> dict:
    """Restart Decky plugin loader."""
    add_log("Restarting Decky...")

    result = {"success": False, "message": ""}

    try:
        success, output = run_command(["sudo", "systemctl", "restart", "plugin_loader"])
        result["success"] = success
        result["message"] = (
            "Decky restart initiated" if success else f"Failed: {output}"
        )
        add_log(result["message"], "INFO" if success else "ERROR")

    except Exception as e:
        result["message"] = str(e)
        add_log(f"Decky restart failed: {e}", "ERROR")

    return result


# ============================================
# Plugin lifecycle
# ============================================


async def _main():
    add_log("decky-ukr-badge plugin loaded")
    decky.logger.info("decky-ukr-badge plugin loaded")


async def _unload():
    add_log("decky-ukr-badge plugin unloaded")
    decky.logger.info("decky-ukr-badge plugin unloaded")
