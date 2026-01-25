"""
Plugin loader for Antigravity CLI plugin system.

Automatically discovers, loads, and manages plugins from a specified directory.
Handles plugin dependencies, validation, and lifecycle management.
"""

import importlib.util
import inspect
import logging
from antigravity.plugins.base import CCPlugin
from pathlib import Path
from typing import Optional

import typer

logger = logging.getLogger(__name__)


class PluginLoadError(Exception):
    """Raised when a plugin fails to load."""

    pass


class PluginDependencyError(Exception):
    """Raised when plugin dependencies cannot be satisfied."""

    pass


class PluginLoader:
    """
    Discovers and loads plugins from a directory.

    The loader will:
    1. Scan the plugin directory for Python files
    2. Import each file and look for CCPlugin subclasses
    3. Instantiate and validate each plugin
    4. Resolve plugin dependencies
    5. Register plugin commands with the Typer app
    6. Call lifecycle hooks

    Attributes:
        plugins: Dictionary mapping plugin names to plugin instances
        plugin_dir: Path to the directory containing plugins

    Example:
        >>> loader = PluginLoader("antigravity/plugins")
        >>> loader.discover_plugins()
        >>> loader.register_all(app)
        >>> loader.startup_all()
    """

    def __init__(self, plugin_dir: str | Path):
        """
        Initialize the plugin loader.

        Args:
            plugin_dir: Path to directory containing plugin files
        """
        self.plugin_dir = Path(plugin_dir)
        self.plugins: dict[str, CCPlugin] = {}
        self._load_order: list[str] = []

    def discover_plugins(self) -> None:
        """
        Discover and load all plugins from the plugin directory.

        Scans the plugin directory for Python files, imports them, and
        instantiates any CCPlugin subclasses found.

        Raises:
            PluginLoadError: If a plugin fails to load
        """
        if not self.plugin_dir.exists():
            logger.warning(f"Plugin directory does not exist: {self.plugin_dir}")
            return

        # Find all Python files in the plugin directory
        plugin_files = list(self.plugin_dir.glob("*.py"))

        # Filter out __init__.py and base.py
        plugin_files = [
            f
            for f in plugin_files
            if f.name not in ("__init__.py", "base.py", "loader.py")
        ]

        logger.info(f"Discovering plugins in {self.plugin_dir}")
        logger.info(f"Found {len(plugin_files)} potential plugin files")

        for plugin_file in plugin_files:
            try:
                self._load_plugin_from_file(plugin_file)
            except Exception as e:
                logger.error(f"Failed to load plugin from {plugin_file}: {e}")
                # Continue loading other plugins even if one fails
                continue

    def _load_plugin_from_file(self, plugin_file: Path) -> None:
        """
        Load a plugin from a Python file.

        Args:
            plugin_file: Path to the plugin file

        Raises:
            PluginLoadError: If the plugin cannot be loaded
        """
        module_name = f"antigravity.plugins.{plugin_file.stem}"

        # Import the module dynamically
        spec = importlib.util.spec_from_file_location(module_name, plugin_file)
        if spec is None or spec.loader is None:
            raise PluginLoadError(f"Cannot load module spec from {plugin_file}")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Find all CCPlugin subclasses in the module
        plugin_classes = [
            obj
            for name, obj in inspect.getmembers(module, inspect.isclass)
            if issubclass(obj, CCPlugin) and obj is not CCPlugin
        ]

        if not plugin_classes:
            logger.warning(f"No CCPlugin subclasses found in {plugin_file}")
            return

        # Instantiate each plugin class
        for plugin_class in plugin_classes:
            try:
                plugin = plugin_class()

                # Validate plugin
                if not plugin.validate():
                    logger.warning(
                        f"Plugin {plugin.name} failed validation, skipping"
                    )
                    continue

                # Check for duplicate plugin names
                if plugin.name in self.plugins:
                    logger.warning(
                        f"Plugin {plugin.name} already loaded, skipping duplicate"
                    )
                    continue

                self.plugins[plugin.name] = plugin
                logger.info(f"Loaded plugin: {plugin.name} v{plugin.version}")

            except Exception as e:
                logger.error(f"Failed to instantiate plugin {plugin_class}: {e}")
                continue

    def _resolve_dependencies(self) -> list[str]:
        """
        Resolve plugin dependencies and determine load order.

        Uses topological sort to determine the correct order to load plugins
        based on their dependencies.

        Returns:
            List of plugin names in dependency order

        Raises:
            PluginDependencyError: If dependencies cannot be satisfied
        """
        # Simple dependency resolution using Kahn's algorithm
        in_degree = {name: 0 for name in self.plugins}
        adj_list = {name: [] for name in self.plugins}

        # Build dependency graph
        for name, plugin in self.plugins.items():
            for dep in plugin.dependencies:
                if dep not in self.plugins:
                    raise PluginDependencyError(
                        f"Plugin {name} depends on {dep}, which is not loaded"
                    )
                adj_list[dep].append(name)
                in_degree[name] += 1

        # Kahn's algorithm for topological sort
        queue = [name for name, degree in in_degree.items() if degree == 0]
        load_order = []

        while queue:
            current = queue.pop(0)
            load_order.append(current)

            for neighbor in adj_list[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Check for circular dependencies
        if len(load_order) != len(self.plugins):
            raise PluginDependencyError("Circular dependency detected in plugins")

        return load_order

    def register_all(self, app: typer.Typer) -> None:
        """
        Register all plugin commands with the Typer application.

        Resolves dependencies and registers plugins in the correct order.

        Args:
            app: The Typer application instance

        Raises:
            PluginDependencyError: If dependencies cannot be satisfied
        """
        if not self.plugins:
            logger.info("No plugins to register")
            return

        # Resolve dependencies and get load order
        self._load_order = self._resolve_dependencies()

        logger.info(f"Registering {len(self.plugins)} plugins")
        logger.info(f"Load order: {', '.join(self._load_order)}")

        for plugin_name in self._load_order:
            plugin = self.plugins[plugin_name]
            try:
                logger.info(f"Registering commands for plugin: {plugin_name}")
                plugin.register_commands(app)
            except Exception as e:
                logger.error(f"Failed to register plugin {plugin_name}: {e}")
                continue

    def startup_all(self) -> None:
        """
        Call on_startup() for all loaded plugins in dependency order.

        Should be called after all plugins are registered but before
        any commands are executed.
        """
        for plugin_name in self._load_order:
            plugin = self.plugins[plugin_name]
            try:
                logger.info(f"Starting plugin: {plugin_name}")
                plugin.on_startup()
            except Exception as e:
                logger.error(f"Error starting plugin {plugin_name}: {e}")
                continue

    def shutdown_all(self) -> None:
        """
        Call on_shutdown() for all loaded plugins in reverse dependency order.

        Should be called when the application is shutting down.
        """
        # Shutdown in reverse order
        for plugin_name in reversed(self._load_order):
            plugin = self.plugins[plugin_name]
            try:
                logger.info(f"Shutting down plugin: {plugin_name}")
                plugin.on_shutdown()
            except Exception as e:
                logger.error(f"Error shutting down plugin {plugin_name}: {e}")
                continue

    def get_plugin(self, name: str) -> Optional[CCPlugin]:
        """
        Get a loaded plugin by name.

        Args:
            name: Plugin name

        Returns:
            Plugin instance or None if not found
        """
        return self.plugins.get(name)

    def list_plugins(self) -> list[dict]:
        """
        Get information about all loaded plugins.

        Returns:
            List of plugin info dictionaries
        """
        return [plugin.get_info() for plugin in self.plugins.values()]
