#!/usr/bin/env python3
"""
TEMP script: end-to-end update flow simulation (safe to delete later)

What it does:
1) Reads local current version from plugin.json
2) Fetches latest GitHub stable release (same rules as plugin backend)
3) Downloads release.zip from /latest/download/release.zip
4) Extracts to a temporary directory (same root-folder handling logic as plugin)
5) Reads extracted plugin.json version
6) Prints diagnosis info

Usage:
  python3 scripts/temp-test-update-flow.py
"""

import io
import json
import os
import re
import tempfile
import urllib.request
import zipfile
from typing import Any, Dict, List, Tuple


HTTP_USER_AGENT = "decky-ukr-badge-temp-update-test/1.0"


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


def http_get_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": HTTP_USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read().decode("utf-8")


def http_get_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": HTTP_USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def get_current_version_from_plugin_json(path: str = "plugin.json") -> str:
    if not os.path.exists(path):
        return "0.0.0"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return str(data.get("version", "0.0.0"))


def get_latest_release_version() -> Dict[str, Any]:
    url = "https://api.github.com/repos/yataktyni/decky-ukr-badge/releases?per_page=20"
    body = http_get_text(url)
    data = json.loads(body)
    if not isinstance(data, list):
        return {"latest": None, "latest_tag": None}

    best_tuple = (0, 0, 0)
    best_version = None
    best_tag = None

    for rel in data:
        if not isinstance(rel, dict):
            continue
        if rel.get("draft") is True or rel.get("prerelease") is True:
            continue

        tag = str(rel.get("tag_name", "")).strip()
        version = normalize_semver_core(tag)
        tup = parse_version_tuple(version)
        if version != "0.0.0" and tup > best_tuple:
            best_tuple = tup
            best_version = version
            best_tag = tag

    return {"latest": best_version, "latest_tag": best_tag, "latest_tuple": best_tuple}


def extract_like_plugin(zip_data: bytes, target_dir: str) -> int:
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        paths = [i.filename for i in zf.infolist() if not i.is_dir()]
        if not paths:
            return 0

        first_parts = [p.split("/")[0] for p in paths if "/" in p]
        has_root_dir = len(set(first_parts)) == 1 and all("/" in p for p in paths)

        count = 0
        for info in zf.infolist():
            if info.is_dir():
                continue

            target_name = info.filename
            if has_root_dir:
                parts = target_name.split("/", 1)
                target_name = parts[1] if len(parts) > 1 else parts[0]

            if not target_name:
                continue

            out_path = os.path.join(target_dir, target_name)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with zf.open(info) as src, open(out_path, "wb") as dst:
                dst.write(src.read())
            count += 1

        return count


def main() -> int:
    print("=== TEMP update flow test ===")

    current_raw = get_current_version_from_plugin_json("plugin.json")
    current_norm = normalize_semver_core(current_raw)
    current_tuple = parse_version_tuple(current_norm)

    print(f"Local plugin.json version: raw={current_raw}, normalized={current_norm}, tuple={current_tuple}")

    latest_info = get_latest_release_version()
    latest = latest_info.get("latest")
    latest_tag = latest_info.get("latest_tag")
    latest_tuple = latest_info.get("latest_tuple", (0, 0, 0))

    print(f"GitHub selected latest: tag={latest_tag}, version={latest}, tuple={latest_tuple}")
    print(f"Update available by compare: {latest_tuple > current_tuple}")

    release_url = "https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip"
    print(f"Downloading: {release_url}")
    zip_data = http_get_bytes(release_url)
    print(f"Downloaded bytes: {len(zip_data)}")

    with tempfile.TemporaryDirectory(prefix="decky-ukr-badge-update-test-") as td:
        extracted_files = extract_like_plugin(zip_data, td)
        print(f"Extracted files: {extracted_files}")
        extracted_plugin_json = os.path.join(td, "plugin.json")

        if not os.path.exists(extracted_plugin_json):
            print("ERROR: Extracted plugin.json not found at expected root.")
            return 2

        with open(extracted_plugin_json, "r", encoding="utf-8") as f:
            extracted_data = json.load(f)

        extracted_version_raw = str(extracted_data.get("version", "0.0.0"))
        extracted_version_norm = normalize_semver_core(extracted_version_raw)
        extracted_tuple = parse_version_tuple(extracted_version_norm)

        print(
            f"Extracted plugin.json version: raw={extracted_version_raw}, "
            f"normalized={extracted_version_norm}, tuple={extracted_tuple}"
        )

        print("=== Diagnosis ===")
        if extracted_tuple < latest_tuple:
            print("WARNING: latest/download/release.zip contains older plugin.json than latest release tag.")
        elif extracted_tuple == latest_tuple:
            print("OK: release.zip version matches latest selected release.")
        else:
            print("INFO: release.zip appears newer than selected latest semver (unusual).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
