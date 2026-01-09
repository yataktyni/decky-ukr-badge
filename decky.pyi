"""
Type stubs for the decky module provided by Decky Loader.

This module exposes various constants and helpers useful for decky plugins.
"""

import logging
from typing import Any

# Constants - paths and environment info

HOME: str
"""
The home directory of the effective user running the process.
Environment variable: `HOME`.
e.g.: `/home/deck`
"""

USER: str
"""
The effective username running the process.
Environment variable: `USER`.
e.g.: `deck`
"""

DECKY_VERSION: str
"""
The version of the decky loader.
Environment variable: `DECKY_VERSION`.
e.g.: `v2.5.0-pre1`
"""

DECKY_USER: str
"""
The user whose home decky resides in.
Environment variable: `DECKY_USER`.
e.g.: `deck`
"""

DECKY_USER_HOME: str
"""
The home of the user where decky resides in.
Environment variable: `DECKY_USER_HOME`.
e.g.: `/home/deck`
"""

DECKY_HOME: str
"""
The root of the decky folder.
Environment variable: `DECKY_HOME`.
e.g.: `/home/deck/homebrew`
"""

DECKY_PLUGIN_SETTINGS_DIR: str
"""
The recommended path in which to store configuration files (created automatically).
Environment variable: `DECKY_PLUGIN_SETTINGS_DIR`.
e.g.: `/home/deck/homebrew/settings/decky-ukr-badge`
"""

DECKY_PLUGIN_RUNTIME_DIR: str
"""
The recommended path in which to store runtime data (created automatically).
Environment variable: `DECKY_PLUGIN_RUNTIME_DIR`.
e.g.: `/home/deck/homebrew/data/decky-ukr-badge`
"""

DECKY_PLUGIN_LOG_DIR: str
"""
The recommended path in which to store persistent logs (created automatically).
Environment variable: `DECKY_PLUGIN_LOG_DIR`.
e.g.: `/home/deck/homebrew/logs/decky-ukr-badge`
"""

DECKY_PLUGIN_DIR: str
"""
The root of the plugin's directory.
Environment variable: `DECKY_PLUGIN_DIR`.
e.g.: `/home/deck/homebrew/plugins/decky-ukr-badge`
"""

DECKY_PLUGIN_NAME: str
"""
The name of the plugin as specified in the 'plugin.json'.
Environment variable: `DECKY_PLUGIN_NAME`.
e.g.: `decky-ukr-badge`
"""

DECKY_PLUGIN_VERSION: str
"""
The version of the plugin as specified in the 'package.json'.
Environment variable: `DECKY_PLUGIN_VERSION`.
e.g.: `0.6.5`
"""

DECKY_PLUGIN_AUTHOR: str
"""
The author of the plugin as specified in the 'plugin.json'.
Environment variable: `DECKY_PLUGIN_AUTHOR`.
e.g.: `yataktyni`
"""

DECKY_PLUGIN_LOG: str
"""
The path to the plugin's main logfile.
Environment variable: `DECKY_PLUGIN_LOG`.
e.g.: `/home/deck/homebrew/logs/decky-ukr-badge/plugin.log`
"""

# Logging

logger: logging.Logger
"""The main plugin logger writing to `DECKY_PLUGIN_LOG`."""

# Migration helpers

def migrate_any(target_dir: str, *files_or_directories: str) -> dict[str, str]:
    """
    Migrate files and directories to a new location and remove old locations.
    Specified files will be migrated to `target_dir`.
    Specified directories will have their contents recursively migrated to `target_dir`.

    Returns the mapping of old -> new location.
    """
    ...

def migrate_settings(*files_or_directories: str) -> dict[str, str]:
    """
    Migrate files and directories relating to plugin settings to the recommended location.
    Specified files will be migrated to `DECKY_PLUGIN_SETTINGS_DIR`.

    Returns the mapping of old -> new location.
    """
    ...

def migrate_runtime(*files_or_directories: str) -> dict[str, str]:
    """
    Migrate files and directories relating to plugin runtime data to the recommended location.
    Specified files will be migrated to `DECKY_PLUGIN_RUNTIME_DIR`.

    Returns the mapping of old -> new location.
    """
    ...

def migrate_logs(*files_or_directories: str) -> dict[str, str]:
    """
    Migrate files and directories relating to plugin logs to the recommended location.
    Specified files will be migrated to `DECKY_PLUGIN_LOG_DIR`.

    Returns the mapping of old -> new location.
    """
    ...

# Event handling

async def emit(event: str, *args: Any) -> None:
    """
    Send an event to the frontend.
    """
    ...
