import io
import json
import os
import sys
import types
import zipfile
from pathlib import Path

sys.path.insert(0, os.getcwd())

import pytest


# ---- Stub decky before importing main ----
class _DummyLogger:
    def info(self, *args, **kwargs):
        pass

    def error(self, *args, **kwargs):
        pass

    def warn(self, *args, **kwargs):
        pass


decky_stub = types.SimpleNamespace(
    logger=_DummyLogger(),
    DECKY_PLUGIN_SETTINGS_DIR="/tmp"
)
sys.modules["decky"] = decky_stub

import main  # noqa: E402


@pytest.mark.asyncio
async def test_get_current_version_reads_plugin_json(tmp_path, monkeypatch):
    plugin_json = tmp_path / "plugin.json"
    plugin_json.write_text(json.dumps({"version": "1.6.5"}), encoding="utf-8")

    monkeypatch.setattr(main.os.path, "abspath", lambda _: str(tmp_path / "main.py"))

    plugin = main.Plugin()
    version = await plugin.get_current_version()
    assert version == "1.6.5"


@pytest.mark.asyncio
async def test_get_latest_version_update_available(monkeypatch):
    plugin = main.Plugin()

    async def fake_current():
        return "1.0.0"

    async def fake_http_get(url, headers=None):
        return json.dumps({"tag_name": "v1.2.0"})

    monkeypatch.setattr(plugin, "get_current_version", fake_current)
    monkeypatch.setattr(main, "http_get", fake_http_get)

    info = await plugin.get_latest_version()
    assert info["current"] == "1.0.0"
    assert info["latest"] == "1.2.0"
    assert info["latest_tag"] == "v1.2.0"
    assert info["update_available"] is True


@pytest.mark.asyncio
async def test_get_latest_version_http_failure(monkeypatch):
    plugin = main.Plugin()

    async def fake_current():
        return "1.0.0"

    async def fake_http_get(url, headers=None):
        return None

    monkeypatch.setattr(plugin, "get_current_version", fake_current)
    monkeypatch.setattr(main, "http_get", fake_http_get)

    info = await plugin.get_latest_version()
    assert info["current"] == "1.0.0"
    assert info["latest"] is None
    assert info["update_available"] is False


@pytest.mark.asyncio
async def test_update_plugin_already_current(monkeypatch):
    plugin = main.Plugin()

    async def fake_latest():
        return {"update_available": False, "current": "1.0.0", "latest": "1.0.0"}

    monkeypatch.setattr(plugin, "get_latest_version", fake_latest)

    result = await plugin.update_plugin()
    assert result["success"] is True
    assert result.get("already_current") is True


def _make_release_zip(with_root=True):
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w", zipfile.ZIP_DEFLATED) as z:
        files = {
            "plugin.json": json.dumps({"version": "9.9.9"}),
            "main.py": "# updated backend\n",
            "dist/index.js": "// updated frontend\n",
        }
        for rel, content in files.items():
            name = f"decky-ukr-badge/{rel}" if with_root else rel
            z.writestr(name, content)
    return bio.getvalue()


@pytest.mark.asyncio
@pytest.mark.parametrize("with_root", [True, False])
async def test_update_plugin_extracts_release_zip(tmp_path, monkeypatch, with_root):
    plugin = main.Plugin()

    async def fake_latest():
        return {"update_available": True, "current": "1.0.0", "latest": "9.9.9"}

    async def fake_binary(url, headers=None):
        return _make_release_zip(with_root=with_root)

    monkeypatch.setattr(plugin, "get_latest_version", fake_latest)
    monkeypatch.setattr(main, "http_get_binary", fake_binary)
    monkeypatch.setattr(main.os.path, "abspath", lambda _: str(tmp_path / "main.py"))

    # seed existing files to ensure overwrite
    (tmp_path / "plugin.json").write_text(json.dumps({"version": "1.0.0"}), encoding="utf-8")
    (tmp_path / "main.py").write_text("# old backend\n", encoding="utf-8")
    (tmp_path / "dist").mkdir(parents=True, exist_ok=True)
    (tmp_path / "dist" / "index.js").write_text("// old frontend\n", encoding="utf-8")

    result = await plugin.update_plugin()
    assert result["success"] is True
    assert result.get("needs_restart") is True

    new_ver = json.loads((tmp_path / "plugin.json").read_text(encoding="utf-8"))["version"]
    assert new_ver == "9.9.9"
    assert (tmp_path / "main.py").read_text(encoding="utf-8") == "# updated backend\n"
    assert (tmp_path / "dist" / "index.js").read_text(encoding="utf-8") == "// updated frontend\n"


@pytest.mark.asyncio
async def test_update_plugin_invalid_zip(tmp_path, monkeypatch):
    plugin = main.Plugin()

    async def fake_latest():
        return {"update_available": True, "current": "1.0.0", "latest": "9.9.9"}

    async def fake_binary(url, headers=None):
        return b"not-a-valid-zip"

    monkeypatch.setattr(plugin, "get_latest_version", fake_latest)
    monkeypatch.setattr(main, "http_get_binary", fake_binary)
    monkeypatch.setattr(main.os.path, "abspath", lambda _: str(tmp_path / "main.py"))

    result = await plugin.update_plugin()
    assert result["success"] is False
    assert result["error"] == "Invalid zip file"


def test_settings_load_save_merge_defaults(tmp_path, monkeypatch):
    decky_stub.DECKY_PLUGIN_SETTINGS_DIR = str(tmp_path)

    plugin = main.Plugin()
    plugin.settings_file = str(tmp_path / "settings.json")

    # Write partial settings and ensure defaults merge
    partial = {"badgeType": "icon-only", "offsetX": 42}
    Path(plugin.settings_file).write_text(json.dumps(partial), encoding="utf-8")

    loaded = plugin._load_settings()
    assert loaded["badgeType"] == "icon-only"
    assert loaded["offsetX"] == 42
    # default still present
    assert loaded["offsetY"] == main.DEFAULT_SETTINGS["offsetY"]

    # Save flow
    plugin.settings["offsetY"] = 123
    assert plugin._save_settings() is True

    reloaded = json.loads(Path(plugin.settings_file).read_text(encoding="utf-8"))
    assert reloaded["offsetY"] == 123
