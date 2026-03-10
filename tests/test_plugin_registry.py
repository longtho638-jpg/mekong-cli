"""Tests for PluginRegistry — discovery, install, validate, lifecycle."""

from __future__ import annotations

from pathlib import Path

import pytest

from src.core.plugin_registry import (
    PluginManifest,
    PluginRegistry,
    PluginStatus,
    PluginType,
    _file_checksum,
)


@pytest.fixture
def tmp_index(tmp_path: Path) -> Path:
    """Temp path for plugin registry index."""
    return tmp_path / "plugin_registry.json"


@pytest.fixture
def tmp_plugin_dir(tmp_path: Path) -> Path:
    """Temp plugin directory with a sample plugin."""
    pdir = tmp_path / "plugins"
    pdir.mkdir()
    sample = pdir / "sample_plugin.py"
    sample.write_text(
        'def register(registry):\n    registry.register("sample", object)\n'
    )
    return pdir


@pytest.fixture
def registry(tmp_index: Path) -> PluginRegistry:
    """Fresh PluginRegistry with temp index."""
    return PluginRegistry(index_path=tmp_index)


class TestPluginManifest:
    """PluginManifest serialization tests."""

    def test_to_dict_roundtrip(self) -> None:
        manifest = PluginManifest(
            name="test-plugin",
            version="1.0.0",
            plugin_type=PluginType.AGENT,
            description="A test plugin",
            author="mekong",
            source="pypi",
        )
        data = manifest.to_dict()
        restored = PluginManifest.from_dict(data)
        assert restored.name == "test-plugin"
        assert restored.version == "1.0.0"
        assert restored.plugin_type == PluginType.AGENT
        assert restored.source == "pypi"

    def test_from_dict_defaults(self) -> None:
        manifest = PluginManifest.from_dict({"name": "minimal"})
        assert manifest.version == "0.0.0"
        assert manifest.plugin_type == PluginType.AGENT
        assert manifest.status == PluginStatus.AVAILABLE


class TestPluginRegistry:
    """PluginRegistry core functionality."""

    def test_empty_registry(self, registry: PluginRegistry) -> None:
        assert registry.count == 0
        assert registry.list_plugins() == []

    def test_discover_local(
        self, tmp_index: Path, tmp_plugin_dir: Path
    ) -> None:
        import src.core.plugin_registry as pr

        original = pr.DEFAULT_PLUGIN_DIR
        pr.DEFAULT_PLUGIN_DIR = tmp_plugin_dir
        try:
            reg = PluginRegistry(index_path=tmp_index)
            found = reg.discover()
            assert len(found) >= 1
            assert any(p.name == "sample_plugin" for p in found)
            assert reg.count >= 1
        finally:
            pr.DEFAULT_PLUGIN_DIR = original

    def test_install_local(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        plugin_file = tmp_path / "my_agent.py"
        plugin_file.write_text("def register(r): pass\n")

        manifest = registry.install_local(plugin_file)
        assert manifest.name == "my_agent"
        assert manifest.status == PluginStatus.INSTALLED
        assert registry.count == 1

    def test_install_local_not_found(self, registry: PluginRegistry) -> None:
        with pytest.raises(FileNotFoundError):
            registry.install_local(Path("/nonexistent/plugin.py"))

    def test_install_local_not_python(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        bad = tmp_path / "plugin.txt"
        bad.write_text("not python")
        with pytest.raises(ValueError, match="must be a .py file"):
            registry.install_local(bad)

    def test_validate_not_found(self, registry: PluginRegistry) -> None:
        valid, msg = registry.validate("nonexistent")
        assert not valid
        assert "not found" in msg

    def test_validate_local_plugin(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        plugin_file = tmp_path / "valid_plugin.py"
        plugin_file.write_text("def register(r): pass\n")
        registry.install_local(plugin_file)

        valid, msg = registry.validate("valid_plugin")
        assert valid
        assert "valid" in msg.lower()

    def test_validate_missing_register(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        plugin_file = tmp_path / "no_register.py"
        plugin_file.write_text("x = 1\n")
        registry.install_local(plugin_file)

        valid, msg = registry.validate("no_register")
        assert not valid
        assert "register" in msg.lower()

    def test_deactivate(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        plugin_file = tmp_path / "deact.py"
        plugin_file.write_text("def register(r): pass\n")
        registry.install_local(plugin_file)

        assert registry.deactivate("deact")
        manifest = registry.get("deact")
        assert manifest is not None
        assert manifest.status == PluginStatus.DISABLED

    def test_uninstall_local(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        plugin_file = tmp_path / "removeme.py"
        plugin_file.write_text("def register(r): pass\n")
        registry.install_local(plugin_file)
        assert registry.count == 1

        assert registry.uninstall("removeme")
        assert registry.count == 0
        assert registry.get("removeme") is None

    def test_list_plugins_filter(
        self, registry: PluginRegistry, tmp_path: Path
    ) -> None:
        for name in ["a", "b", "c"]:
            f = tmp_path / f"{name}.py"
            f.write_text("def register(r): pass\n")
            registry.install_local(f)

        registry.deactivate("b")
        active = registry.list_plugins(status=PluginStatus.INSTALLED)
        assert len(active) == 2
        disabled = registry.list_plugins(status=PluginStatus.DISABLED)
        assert len(disabled) == 1

    def test_persistence(self, tmp_index: Path, tmp_path: Path) -> None:
        reg1 = PluginRegistry(index_path=tmp_index)
        f = tmp_path / "persist.py"
        f.write_text("def register(r): pass\n")
        reg1.install_local(f)

        # Load fresh from same index
        reg2 = PluginRegistry(index_path=tmp_index)
        assert reg2.count == 1
        assert reg2.get("persist") is not None


class TestFileChecksum:
    """Checksum utility tests."""

    def test_deterministic(self, tmp_path: Path) -> None:
        f = tmp_path / "test.py"
        f.write_text("hello world")
        c1 = _file_checksum(f)
        c2 = _file_checksum(f)
        assert c1 == c2
        assert len(c1) == 16

    def test_changes_on_content(self, tmp_path: Path) -> None:
        f = tmp_path / "test.py"
        f.write_text("content A")
        c1 = _file_checksum(f)
        f.write_text("content B")
        c2 = _file_checksum(f)
        assert c1 != c2
