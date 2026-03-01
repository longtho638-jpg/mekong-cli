"""
Mekong CLI - Plugin Loader

Discovers and loads community agents, providers, and hooks via:
1. Python entry_points (pip install mekong-plugin-X)
2. Local plugin directory (~/.mekong/plugins/*.py)

Plugin failures are logged as warnings — never crash the CLI.
"""

import importlib
import importlib.metadata
import importlib.util
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Entry point group names
EP_GROUP_AGENTS = "mekong.agents"
EP_GROUP_PROVIDERS = "mekong.providers"
EP_GROUP_HOOKS = "mekong.hooks"

DEFAULT_PLUGIN_DIR = Path.home() / ".mekong" / "plugins"


class PluginLoader:
    """
    Discovers and loads Mekong plugins from entry_points and local directories.

    Args:
        agent_registry: AgentRegistry instance for agent plugin registration
        providers: Optional list to append provider plugins to
    """

    def __init__(self, agent_registry: Any = None, providers: Optional[list] = None) -> None:
        self._agent_registry = agent_registry
        self._providers = providers if providers is not None else []
        self._loaded: List[Dict[str, str]] = []

    def discover_all(self, plugin_dir: Optional[Path] = None) -> None:
        """Run all discovery methods. Safe — never raises."""
        self.discover_entrypoints()
        self.discover_local(plugin_dir)

    def discover_entrypoints(self) -> None:
        """Load plugins registered via setuptools entry_points."""
        self._load_ep_group(EP_GROUP_AGENTS, "agent")
        self._load_ep_group(EP_GROUP_PROVIDERS, "provider")

    def _load_ep_group(self, group: str, plugin_type: str) -> None:
        """Load all entry points in a group."""
        try:
            # Python 3.9 compat: entry_points() returns dict
            # Python 3.12+: entry_points(group=...) returns SelectableGroups
            try:
                eps = importlib.metadata.entry_points(group=group)
            except TypeError:
                eps = importlib.metadata.entry_points().get(group, [])

            for ep in eps:
                try:
                    cls = ep.load()
                    if plugin_type == "agent" and self._agent_registry is not None:
                        self._agent_registry.register(ep.name, cls)
                    elif plugin_type == "provider":
                        self._providers.append(cls)
                    self._loaded.append({
                        "name": ep.name,
                        "source": "entrypoint",
                        "type": plugin_type,
                    })
                    logger.info("Loaded %s plugin: %s", plugin_type, ep.name)
                except Exception as e:
                    logger.warning("Failed to load %s plugin '%s': %s", plugin_type, ep.name, e)
        except Exception as e:
            logger.debug("No %s entry points found: %s", group, e)

    def discover_local(self, plugin_dir: Optional[Path] = None) -> None:
        """
        Load .py files from plugin directory.

        Convention: each plugin module must have a register(registry) function.
        """
        pdir = plugin_dir or DEFAULT_PLUGIN_DIR
        if not pdir.exists():
            return

        for fpath in sorted(pdir.glob("*.py")):
            if fpath.name.startswith("_"):
                continue
            try:
                spec = importlib.util.spec_from_file_location(fpath.stem, fpath)
                if spec is None or spec.loader is None:
                    continue
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)

                if hasattr(mod, "register") and self._agent_registry is not None:
                    mod.register(self._agent_registry)
                    self._loaded.append({
                        "name": fpath.stem,
                        "source": "local",
                        "type": "agent",
                    })
                    logger.info("Loaded local plugin: %s", fpath.stem)
                else:
                    logger.debug("Plugin %s has no register() function, skipped", fpath.stem)
            except Exception as e:
                logger.warning("Failed to load local plugin '%s': %s", fpath.name, e)

    def list_plugins(self) -> List[Dict[str, str]]:
        """Return list of loaded plugins with metadata."""
        return list(self._loaded)

    @property
    def plugin_count(self) -> int:
        """Number of loaded plugins."""
        return len(self._loaded)


__all__ = ["PluginLoader", "DEFAULT_PLUGIN_DIR"]
