#!/usr/bin/env python3
"""
TEMP DEBUG SCRIPT (safe to remove later)

Purpose:
- Mimic plugin update version selection logic from main.py
- Show why update check may return "Already up to date"
- Compare local installed version (plugin.json) vs selected latest stable release

Usage:
  python3 scripts/debug-release-version.py
  python3 scripts/debug-release-version.py --repo yataktyni/decky-ukr-badge --per-page 50
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from typing import Any, Dict, List, Tuple


def normalize_semver_core(value: str) -> str:
    raw = (value or "").strip().lstrip("v")
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)", raw)
    if not m:
        return "0.0.0"
    return f"{m.group(1)}.{m.group(2)}.{m.group(3)}"


def parse_version_tuple(value: str) -> Tuple[int, int, int]:
    core = normalize_semver_core(value)
    try:
        major, minor, patch = core.split(".")
        return (int(major), int(minor), int(patch))
    except Exception:
        return (0, 0, 0)


def read_local_version(plugin_json_path: str) -> str:
    if not os.path.exists(plugin_json_path):
        return "0.0.0"
    with open(plugin_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return str(data.get("version", "0.0.0"))


def fetch_releases(repo: str, per_page: int) -> List[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{repo}/releases?per_page={per_page}"
    req = urllib.request.Request(url, headers={"User-Agent": "decky-ukr-badge-debug/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
    data = json.loads(body)
    if not isinstance(data, list):
        return []
    return data


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="yataktyni/decky-ukr-badge")
    parser.add_argument("--per-page", type=int, default=20)
    parser.add_argument("--plugin-json", default="plugin.json")
    parser.add_argument(
        "--installed-version",
        default=None,
        help="Override local installed version for simulation (e.g. 1.6.7)",
    )
    args = parser.parse_args()

    local_raw = args.installed_version if args.installed_version else read_local_version(args.plugin_json)
    local_norm = normalize_semver_core(local_raw)
    local_tuple = parse_version_tuple(local_norm)

    print("=== Local Version ===")
    print(f"plugin.json path : {args.plugin_json}")
    print(f"local raw        : {local_raw}")
    print(f"local normalized : {local_norm}")
    print(f"local tuple      : {local_tuple}")
    print()

    releases = fetch_releases(args.repo, args.per_page)
    print(f"=== GitHub Releases (repo={args.repo}, count={len(releases)}) ===")

    best_tag = ""
    best_norm = "0.0.0"
    best_tuple = (0, 0, 0)

    for idx, rel in enumerate(releases, start=1):
        tag = str(rel.get("tag_name", "")).strip()
        draft = bool(rel.get("draft", False))
        prerelease = bool(rel.get("prerelease", False))
        norm = normalize_semver_core(tag)
        tup = parse_version_tuple(norm)

        eligible = (not draft) and (not prerelease) and (norm != "0.0.0")

        print(
            f"{idx:02d}. tag={tag!r} draft={draft} prerelease={prerelease} "
            f"norm={norm} tuple={tup} eligible={eligible}"
        )

        if eligible and tup > best_tuple:
            best_tuple = tup
            best_norm = norm
            best_tag = tag

    print()
    print("=== Selected Latest (same rules as plugin) ===")
    if best_tag:
        print(f"selected tag     : {best_tag}")
        print(f"selected norm    : {best_norm}")
        print(f"selected tuple   : {best_tuple}")
        print(f"update_available : {best_tuple > local_tuple}")
    else:
        print("No eligible stable release selected")
        print("update_available : False")

    print()
    print("=== Quick diagnosis ===")
    if not best_tag:
        print("- No stable non-draft/non-prerelease tags parseable as semver were found.")
    elif best_tuple <= local_tuple:
        print("- Selected latest is <= local version. Plugin will show 'Already up to date'.")
        print("- Check if v1.6.8 release is draft/prerelease or missing semver-like tag.")
    else:
        print("- Update should be available according to version logic.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
