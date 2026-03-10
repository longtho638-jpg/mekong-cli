"""Mekong CLI v3.1 - Plugin Registry Service.

Central registry for plugin ecosystem: discovery, install, validate, lifecycle.
Builds on PluginLoader for actual module loading.

Plugin types: agent, provider, hook, recipe
Plugin sources: pypi (entry_points), local (~/.mekong/plugins), git
"""

from __future__ import annotations

import hashlib
import json
import logging
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from .plugin_loader import DEFAULT_PLUGIN_DIR, PluginLoader

logger = logging.getLogger(__name__)

REGISTRY_INDEX_PATH = Path.home() / ".mekong" / "plugin_registry.json"


class PluginType(str, Enum):
    """Supported plugin types."""

    AGENT = "agent"
    PROVIDER = "provider"
    HOOK = "hook"
    RECIPE = "recipe"


class PluginStatus(str, Enum):
    """Plugin lifecycle status."""

    AVAILABLE = "available"
    INSTALLED = "installed"
    ACTIVE = "active"
    DISABLED = "disabled"
    ERROR = "error"


@dataclass
class PluginManifest:
    """Plugin metadata manifest."""

    name: str
    version: str
    plugin_type: PluginType
    description: str = ""
    author: str = ""
    source: str = "local"  # pypi | local | git
    entry_point: str = ""
    dependencies: list[str] = field(default_factory=list)
    checksum: str = ""
    status: PluginStatus = PluginStatus.AVAILABLE
    installed_at: str = ""
    error_message: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict for JSON storage."""
        return {
            "name": self.name,
            "version": self.version,
            "plugin_type": self.plugin_type.value,
            "description": self.description,
            "author": self.author,
            "source": self.source,
            "entry_point": self.entry_point,
            "dependencies": self.dependencies,
            "checksum": self.checksum,
            "status": self.status.value,
            "installed_at": self.installed_at,
            "error_message": self.error_message,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PluginManifest:
        """Deserialize from dict."""
        return cls(
            name=data["name"],
            version=data.get("version", "0.0.0"),
            plugin_type=PluginType(data.get("plugin_type", "agent")),
            description=data.get("description", ""),
            author=data.get("author", ""),
            source=data.get("source", "local"),
            entry_point=data.get("entry_point", ""),
            dependencies=data.get("dependencies", []),
            checksum=data.get("checksum", ""),
            status=PluginStatus(data.get("status", "available")),
            installed_at=data.get("installed_at", ""),
            error_message=data.get("error_message", ""),
        )


class PluginRegistry:
    """Central plugin registry with discovery, install, validate lifecycle.

    Usage:
        registry = PluginRegistry()
        registry.discover()                          # scan all sources
        registry.install("mekong-plugin-seo")        # install from pypi
        registry.validate("mekong-plugin-seo")       # verify integrity
        registry.activate("mekong-plugin-seo", loader)  # load into runtime
    """

    def __init__(self, index_path: Path | None = None) -> None:
        self._index_path = index_path or REGISTRY_INDEX_PATH
        self._plugins: dict[str, PluginManifest] = {}
        self._load_index()

    def _load_index(self) -> None:
        """Load persisted plugin index from disk."""
        if not self._index_path.exists():
            return
        try:
            data = json.loads(self._index_path.read_text())
            for name, pdata in data.get("plugins", {}).items():
                self._plugins[name] = PluginManifest.from_dict(pdata)
        except Exception as e:
            logger.warning("Failed to load plugin index: %s", e)

    def _save_index(self) -> None:
        """Persist plugin index to disk."""
        self._index_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "version": "1.0",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "plugins": {n: p.to_dict() for n, p in self._plugins.items()},
        }
        self._index_path.write_text(json.dumps(data, indent=2))

    # --- Discovery ---

    def discover(self) -> list[PluginManifest]:
        """Discover plugins from all sources (local dir + entry_points)."""
        discovered: list[PluginManifest] = []
        discovered.extend(self._discover_local())
        discovered.extend(self._discover_entrypoints())
        self._save_index()
        return discovered

    def _discover_local(self) -> list[PluginManifest]:
        """Scan ~/.mekong/plugins/ for plugin files."""
        found: list[PluginManifest] = []
        if not DEFAULT_PLUGIN_DIR.exists():
            return found
        for fpath in sorted(DEFAULT_PLUGIN_DIR.glob("*.py")):
            if fpath.name.startswith("_"):
                continue
            name = fpath.stem
            if name not in self._plugins:
                manifest = PluginManifest(
                    name=name,
                    version="0.0.0",
                    plugin_type=PluginType.AGENT,
                    source="local",
                    entry_point=str(fpath),
                    checksum=_file_checksum(fpath),
                    status=PluginStatus.INSTALLED,
                )
                self._plugins[name] = manifest
            found.append(self._plugins[name])
        return found

    def _discover_entrypoints(self) -> list[PluginManifest]:
        """Scan installed packages for mekong entry_points."""
        import importlib.metadata

        found: list[PluginManifest] = []
        for group, ptype in [
            ("mekong.agents", PluginType.AGENT),
            ("mekong.providers", PluginType.PROVIDER),
            ("mekong.hooks", PluginType.HOOK),
        ]:
            try:
                try:
                    eps = importlib.metadata.entry_points(group=group)
                except TypeError:
                    eps = importlib.metadata.entry_points().get(group, [])
                for ep in eps:
                    if ep.name not in self._plugins:
                        manifest = PluginManifest(
                            name=ep.name,
                            version="0.0.0",
                            plugin_type=ptype,
                            source="pypi",
                            entry_point=str(ep.value),
                            status=PluginStatus.INSTALLED,
                        )
                        self._plugins[ep.name] = manifest
                    found.append(self._plugins[ep.name])
            except Exception as e:
                logger.debug("Entry point scan for %s: %s", group, e)
        return found

    # --- Install ---

    def install(self, package_name: str) -> PluginManifest:
        """Install a plugin package via pip.

        Args:
            package_name: PyPI package name (e.g. mekong-plugin-seo)

        Returns:
            PluginManifest of installed plugin

        Raises:
            RuntimeError: If pip install fails
        """
        logger.info("Installing plugin: %s", package_name)
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", package_name],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            error_msg = result.stderr.strip()
            logger.error("pip install failed: %s", error_msg)
            manifest = PluginManifest(
                name=package_name,
                version="0.0.0",
                plugin_type=PluginType.AGENT,
                source="pypi",
                status=PluginStatus.ERROR,
                error_message=error_msg[:200],
            )
            self._plugins[package_name] = manifest
            self._save_index()
            raise RuntimeError(f"Failed to install {package_name}: {error_msg[:200]}")

        manifest = PluginManifest(
            name=package_name,
            version="0.0.0",
            plugin_type=PluginType.AGENT,
            source="pypi",
            status=PluginStatus.INSTALLED,
            installed_at=datetime.now(timezone.utc).isoformat(),
        )
        self._plugins[package_name] = manifest
        self._save_index()
        logger.info("Plugin installed: %s", package_name)
        return manifest

    def install_local(self, file_path: Path) -> PluginManifest:
        """Install a local .py plugin file to ~/.mekong/plugins/.

        Args:
            file_path: Path to .py plugin file

        Returns:
            PluginManifest of installed plugin
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Plugin file not found: {file_path}")
        if not file_path.suffix == ".py":
            raise ValueError("Plugin file must be a .py file")

        DEFAULT_PLUGIN_DIR.mkdir(parents=True, exist_ok=True)
        dest = DEFAULT_PLUGIN_DIR / file_path.name
        shutil.copy2(file_path, dest)

        manifest = PluginManifest(
            name=file_path.stem,
            version="0.0.0",
            plugin_type=PluginType.AGENT,
            source="local",
            entry_point=str(dest),
            checksum=_file_checksum(dest),
            status=PluginStatus.INSTALLED,
            installed_at=datetime.now(timezone.utc).isoformat(),
        )
        self._plugins[file_path.stem] = manifest
        self._save_index()
        return manifest

    # --- Validate ---

    def validate(self, plugin_name: str) -> tuple[bool, str]:
        """Validate plugin integrity and loadability.

        Returns:
            (is_valid, message) tuple
        """
        if plugin_name not in self._plugins:
            return False, f"Plugin '{plugin_name}' not found in registry"

        manifest = self._plugins[plugin_name]

        # Check local file integrity
        if manifest.source == "local" and manifest.entry_point:
            fpath = Path(manifest.entry_point)
            if not fpath.exists():
                manifest.status = PluginStatus.ERROR
                manifest.error_message = "Plugin file missing"
                self._save_index()
                return False, "Plugin file missing"
            if manifest.checksum and _file_checksum(fpath) != manifest.checksum:
                manifest.status = PluginStatus.ERROR
                manifest.error_message = "Checksum mismatch — file modified"
                self._save_index()
                return False, "Checksum mismatch"

        # Try import
        try:
            if manifest.source == "local" and manifest.entry_point:
                import importlib.util

                spec = importlib.util.spec_from_file_location(
                    manifest.name, manifest.entry_point
                )
                if spec is None or spec.loader is None:
                    return False, "Cannot create module spec"
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if not hasattr(mod, "register"):
                    return False, "Missing register() function"
        except Exception as e:
            manifest.status = PluginStatus.ERROR
            manifest.error_message = str(e)[:200]
            self._save_index()
            return False, f"Import failed: {e}"

        manifest.status = PluginStatus.INSTALLED
        manifest.error_message = ""
        self._save_index()
        return True, "Plugin valid"

    # --- Activate / Deactivate ---

    def activate(self, plugin_name: str, loader: PluginLoader) -> bool:
        """Activate plugin — load it into runtime via PluginLoader.

        Args:
            plugin_name: Name of plugin to activate
            loader: PluginLoader instance to load plugin into

        Returns:
            True if activation succeeded
        """
        if plugin_name not in self._plugins:
            logger.error("Plugin '%s' not in registry", plugin_name)
            return False

        manifest = self._plugins[plugin_name]
        is_valid, msg = self.validate(plugin_name)
        if not is_valid:
            logger.error("Plugin '%s' validation failed: %s", plugin_name, msg)
            return False

        # Delegate actual loading to PluginLoader
        if manifest.source == "local":
            plugin_dir = Path(manifest.entry_point).parent if manifest.entry_point else None
            loader.discover_local(plugin_dir)
        else:
            loader.discover_entrypoints()

        manifest.status = PluginStatus.ACTIVE
        self._save_index()
        logger.info("Plugin activated: %s", plugin_name)
        return True

    def deactivate(self, plugin_name: str) -> bool:
        """Mark plugin as disabled (runtime unload requires restart)."""
        if plugin_name not in self._plugins:
            return False
        self._plugins[plugin_name].status = PluginStatus.DISABLED
        self._save_index()
        return True

    # --- Uninstall ---

    def uninstall(self, plugin_name: str) -> bool:
        """Uninstall a plugin.

        Local plugins: delete file. PyPI plugins: pip uninstall.
        """
        if plugin_name not in self._plugins:
            return False

        manifest = self._plugins[plugin_name]
        if manifest.source == "local" and manifest.entry_point:
            fpath = Path(manifest.entry_point)
            if fpath.exists():
                fpath.unlink()
        elif manifest.source == "pypi":
            subprocess.run(
                [sys.executable, "-m", "pip", "uninstall", "-y", plugin_name],
                capture_output=True,
                timeout=60,
            )

        del self._plugins[plugin_name]
        self._save_index()
        logger.info("Plugin uninstalled: %s", plugin_name)
        return True

    # --- Query ---

    def list_plugins(
        self, plugin_type: PluginType | None = None, status: PluginStatus | None = None
    ) -> list[PluginManifest]:
        """List plugins with optional filters."""
        results = list(self._plugins.values())
        if plugin_type:
            results = [p for p in results if p.plugin_type == plugin_type]
        if status:
            results = [p for p in results if p.status == status]
        return results

    def get(self, name: str) -> PluginManifest | None:
        """Get plugin manifest by name."""
        return self._plugins.get(name)

    @property
    def count(self) -> int:
        """Total registered plugins."""
        return len(self._plugins)


def _file_checksum(path: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()[:16]


__all__ = [
    "PluginManifest",
    "PluginRegistry",
    "PluginStatus",
    "PluginType",
]
