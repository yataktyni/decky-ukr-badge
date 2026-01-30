#!/usr/bin/env python3
"""
CEF Debugger Client for Steam Deck / Decky Loader

Connects to Steam Deck's CEF (Chromium Embedded Framework) debugger
over the network to debug Decky plugins in real-time.

Setup on Steam Deck:
1. Enable "Allow Remote CEF Debugging" in Decky Developer Settings
2. Note your Steam Deck's IP address (Settings > Internet > IP Address)

Usage:
    python cef_debug.py <DECK_IP>
    python cef_debug.py 192.168.1.100
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from typing import Any

CEF_PORT = 8081
TIMEOUT = 5


def get_tabs(deck_ip: str) -> list[dict[str, Any]]:
    """Fetch available CEF tabs from Steam Deck."""
    url = f"http://{deck_ip}:{CEF_PORT}/json"
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"❌ Cannot connect to {deck_ip}:{CEF_PORT}")
        print(f"   Error: {e}")
        print("\n💡 Make sure:")
        print("   1. Steam Deck is on the same network")
        print("   2. 'Allow Remote CEF Debugging' is enabled in Decky Dev Settings")
        sys.exit(1)


def print_tabs(tabs: list[dict[str, Any]]) -> None:
    """Display available CEF tabs."""
    print(f"\n🎮 Found {len(tabs)} CEF targets:\n")
    print(f"{'#':<3} {'Title':<40} {'Type':<12}")
    print("-" * 60)
    
    for i, tab in enumerate(tabs):
        title = tab.get("title", "Untitled")[:38]
        tab_type = tab.get("type", "unknown")
        print(f"{i:<3} {title:<40} {tab_type:<12}")
    
    print()


def get_devtools_url(tab: dict[str, Any], deck_ip: str) -> str:
    """Generate Chrome DevTools URL for a tab."""
    ws_url = tab.get("webSocketDebuggerUrl", "")
    if ws_url:
        # Replace localhost with deck IP
        ws_url = ws_url.replace("127.0.0.1", deck_ip).replace("localhost", deck_ip)
        return f"devtools://devtools/bundled/inspector.html?ws={ws_url.replace('ws://', '')}"
    return ""


def interactive_mode(tabs: list[dict[str, Any]], deck_ip: str) -> None:
    """Interactive tab selection."""
    print_tabs(tabs)
    
    # Find interesting tabs
    interesting = []
    for i, tab in enumerate(tabs):
        title = tab.get("title", "").lower()
        if any(x in title for x in ["sharedjscontext", "big picture", "quickaccess", "mainmenu"]):
            interesting.append((i, tab))
    
    if interesting:
        print("📌 Recommended tabs for plugin debugging:")
        for i, tab in interesting:
            print(f"   [{i}] {tab.get('title', 'Untitled')}")
        print()
    
    print("🔧 Open Chrome/Edge and go to: chrome://inspect")
    print(f"   Configure target: {deck_ip}:{CEF_PORT}")
    print()
    print("📋 Quick commands:")
    print("   tabs     - Refresh tab list")
    print("   url <n>  - Get DevTools URL for tab #n")
    print("   quit     - Exit")
    print()
    
    while True:
        try:
            cmd = input("cef> ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\nBye!")
            break
        
        if cmd == "quit" or cmd == "exit":
            break
        elif cmd == "tabs":
            tabs = get_tabs(deck_ip)
            print_tabs(tabs)
        elif cmd.startswith("url "):
            try:
                idx = int(cmd.split()[1])
                if 0 <= idx < len(tabs):
                    url = get_devtools_url(tabs[idx], deck_ip)
                    if url:
                        print(f"DevTools URL: {url}")
                    else:
                        print("No WebSocket URL available for this tab")
                else:
                    print(f"Invalid tab index. Use 0-{len(tabs)-1}")
            except (ValueError, IndexError):
                print("Usage: url <tab_number>")
        elif cmd:
            print("Unknown command. Use: tabs, url <n>, quit")


def main():
    parser = argparse.ArgumentParser(
        description="CEF Debugger Client for Steam Deck",
        epilog="Example: python cef_debug.py 192.168.1.100"
    )
    parser.add_argument("deck_ip", help="Steam Deck IP address")
    parser.add_argument("--json", action="store_true", help="Output tabs as JSON")
    
    args = parser.parse_args()
    
    print(f"🔌 Connecting to Steam Deck at {args.deck_ip}:{CEF_PORT}...")
    tabs = get_tabs(args.deck_ip)
    
    if args.json:
        print(json.dumps(tabs, indent=2))
    else:
        interactive_mode(tabs, args.deck_ip)


if __name__ == "__main__":
    main()
