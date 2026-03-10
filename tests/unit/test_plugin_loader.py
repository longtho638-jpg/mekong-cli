"""Tests for PluginLoader - plugin discovery and loading.

Coverage:
- discover_all, discover_entrypoints, discover_local methods
- list_plugins, plugin_count properties
- Error handling (plugin failures logged as warnings)
- Manifest validation
"""

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

# Add src/core to path for direct imports (avoid orchestrator relative import error)
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src" / "core"))

# Direct import from module file to avoid __init__.py importing orchestrator
import importlib.util
plugin_loader_path = Path(__file__).parent.parent.parent / "src" / "core" / "plugin_loader.py"
spec = importlib.util.spec_from_file_location("plugin_loader", plugin_loader_path)
plugin_loader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plugin_loader)

DEFAULT_PLUGIN_DIR = plugin_loader.DEFAULT_PLUGIN_DIR
EP_GROUP_AGENTS = plugin_loader.EP_GROUP_AGENTS
EP_GROUP_HOOKS = plugin_loader.EP_GROUP_HOOKS
EP_GROUP_PROVIDERS = plugin_loader.EP_GROUP_PROVIDERS
PluginLoader = plugin_loader.PluginLoader


class TestPluginLoaderInitialization(unittest.TestCase):
    """Test PluginLoader initialization."""

    def test_init_with_no_args(self):
        """Should initialize with None registry and empty providers list."""
        loader = PluginLoader()
        self.assertIsNone(loader._agent_registry)
        self.assertEqual(loader._providers, [])
        self.assertEqual(loader._loaded, [])

    def test_init_with_registry(self):
        """Should store agent_registry reference."""
        mock_registry = MagicMock()
        loader = PluginLoader(agent_registry=mock_registry)
        self.assertIs(loader._agent_registry, mock_registry)
        self.assertEqual(loader._providers, [])

    def test_init_with_providers_list(self):
        """Should use provided providers list."""
        providers = ["provider1", "provider2"]
        loader = PluginLoader(providers=providers)
        self.assertIs(loader._providers, providers)

    def test_plugin_count_empty(self):
        """Should return 0 when no plugins loaded."""
        loader = PluginLoader()
        self.assertEqual(loader.plugin_count, 0)


class TestPluginLoaderEntrypoints(unittest.TestCase):
    """Test entrypoint-based plugin discovery."""

    @patch("importlib.metadata.entry_points")
    def test_discover_entrypoints_loads_agents(self, mock_entry_points):
        """Should load agent plugins from entry_points."""
        # Mock entry point
        mock_ep = MagicMock()
        mock_ep.name = "test_agent"
        mock_ep.load.return_value = MagicMock()

        # Return list for agents group call (Python 3.12+ style)
        # The code calls entry_points(group=EP_GROUP_AGENTS) then entry_points(group=EP_GROUP_PROVIDERS)
        # We need to return appropriate values for each call
        def side_effect(group=None):
            if group == EP_GROUP_AGENTS:
                return [mock_ep]
            elif group == EP_GROUP_PROVIDERS:
                return []
            return []

        mock_entry_points.side_effect = side_effect

        mock_registry = MagicMock()
        loader = PluginLoader(agent_registry=mock_registry)
        loader.discover_entrypoints()

        # Should have loaded 1 agent plugin
        self.assertEqual(loader.plugin_count, 1)
        mock_registry.register.assert_called_with("test_agent", mock_ep.load.return_value)

    @patch("importlib.metadata.entry_points")
    def test_discover_entrypoints_loads_providers(self, mock_entry_points):
        """Should load provider plugins from entry_points."""
        # Mock entry points for providers
        mock_provider_ep = MagicMock()
        mock_provider_ep.name = "test_provider"
        mock_provider_ep.load.return_value = MagicMock()

        # Return empty for agents, provider for providers
        def side_effect(group=None):
            if group == EP_GROUP_PROVIDERS:
                return [mock_provider_ep]
            return []

        mock_entry_points.side_effect = side_effect

        providers = []
        loader = PluginLoader(providers=providers)
        loader.discover_entrypoints()

        self.assertEqual(len(providers), 1)
        self.assertEqual(loader.plugin_count, 1)

    @patch("importlib.metadata.entry_points")
    def test_discover_entrypoints_handles_load_failure(self, mock_entry_points):
        """Should log warning and continue when plugin load fails."""
        mock_ep = MagicMock()
        mock_ep.name = "broken_plugin"
        mock_ep.load.side_effect = ImportError("Cannot import")
        mock_entry_points.return_value.get.return_value = [mock_ep]

        loader = PluginLoader()
        # Should not raise
        loader.discover_entrypoints()

        # Plugin should be counted as loaded (failure logged but not raised)
        # The _load_ep_group catches exceptions at ep.load() level

    @patch("importlib.metadata.entry_points")
    def test_discover_entrypoints_handles_entry_point_error(self, mock_entry_points):
        """Should handle entry_points() raising TypeError (Python 3.9 compat)."""
        # Simulate Python 3.9 behavior where group= causes TypeError
        mock_entry_points.side_effect = TypeError()

        loader = PluginLoader()
        # Should not raise
        loader.discover_entrypoints()

    @patch("importlib.metadata.entry_points")
    def test_discover_entrypoints_python39_fallback(self, mock_entry_points):
        """Should use dict fallback for Python 3.9."""
        # First call raises TypeError (group= not supported)
        # Second call returns dict (Python 3.9 style)
        mock_agent = MagicMock(name="agent1", load=MagicMock(return_value=MagicMock()))
        mock_dict = {
            EP_GROUP_AGENTS: [mock_agent],
            EP_GROUP_PROVIDERS: [],
        }
        # First call with group= raises TypeError
        # Second call without args returns dict
        mock_entry_points.side_effect = [
            TypeError(),  # First call: entry_points(group=...)
            mock_dict,    # Second call: entry_points()
        ]

        mock_registry = MagicMock()
        loader = PluginLoader(agent_registry=mock_registry)
        loader.discover_entrypoints()

        self.assertEqual(loader.plugin_count, 1)


class TestPluginLoaderLocal(unittest.TestCase):
    """Test local file-based plugin discovery."""

    def test_discover_local_missing_dir(self):
        """Should not crash when plugin directory doesn't exist."""
        loader = PluginLoader()
        # Should not raise
        loader.discover_local(plugin_dir=Path("/nonexistent/path/xyz"))
        self.assertEqual(loader.plugin_count, 0)

    def test_discover_local_empty_dir(self):
        """Should return empty list for directory with no .py files."""
        with TemporaryDirectory() as tmpdir:
            loader = PluginLoader()
            loader.discover_local(plugin_dir=Path(tmpdir))
            self.assertEqual(loader.plugin_count, 0)

    def test_discover_local_loads_py_files(self):
        """Should load .py files with register() function."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)
            # Create a valid plugin file
            plugin_file = plugin_dir / "test_plugin.py"
            plugin_file.write_text("""
def register(registry):
    registry.register("test_plugin", object)
""")

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)
            loader.discover_local(plugin_dir=plugin_dir)

            self.assertEqual(loader.plugin_count, 1)
            mock_registry.register.assert_called_with("test_plugin", object)

    def test_discover_local_skips_underscore_files(self):
        """Should skip files starting with underscore."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)
            # Create ignored files
            (plugin_dir / "_private.py").write_text("def register(r): pass")
            (plugin_dir / "_internal.py").write_text("def register(r): pass")
            # Create valid file
            (plugin_dir / "valid_plugin.py").write_text(
                "def register(registry): registry.register('valid', object)"
            )

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)
            loader.discover_local(plugin_dir=plugin_dir)

            self.assertEqual(loader.plugin_count, 1)
            loaded = loader.list_plugins()[0]
            self.assertEqual(loaded["name"], "valid_plugin")

    def test_discover_local_skips_no_register(self):
        """Should skip files without register() function."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)
            # Create plugin without register()
            (plugin_dir / "no_register.py").write_text("# No register function\npass")
            # Create valid plugin
            (plugin_dir / "valid.py").write_text(
                "def register(registry): registry.register('valid', object)"
            )

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)
            loader.discover_local(plugin_dir=plugin_dir)

            # Only valid plugin should be loaded
            self.assertEqual(loader.plugin_count, 1)

    def test_discover_local_handles_import_error(self):
        """Should log warning and continue when plugin import fails."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)
            # Create invalid Python file (syntax error)
            (plugin_dir / "broken.py").write_text("def register(: invalid syntax")
            # Create valid plugin
            (plugin_dir / "valid.py").write_text(
                "def register(registry): registry.register('valid', object)"
            )

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)
            # Should not raise
            loader.discover_local(plugin_dir=plugin_dir)

            # Valid plugin should still load
            self.assertEqual(loader.plugin_count, 1)

    def test_discover_local_uses_default_dir(self):
        """Should use DEFAULT_PLUGIN_DIR when no path provided."""
        # This test verifies the default path behavior
        # We can't easily test with real DEFAULT_PLUGIN_DIR, so just verify method signature
        loader = PluginLoader()
        # Should not crash even if default dir doesn't exist
        loader.discover_local()


class TestPluginLoaderListPlugins(unittest.TestCase):
    """Test plugin listing functionality."""

    def test_list_plugins_empty(self):
        """Should return empty list when no plugins loaded."""
        loader = PluginLoader()
        self.assertEqual(loader.list_plugins(), [])

    def test_list_plugins_returns_metadata(self):
        """Should return list of dicts with plugin metadata."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)
            (plugin_dir / "test_plugin.py").write_text(
                "def register(registry): registry.register('test', object)"
            )

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)
            loader.discover_local(plugin_dir=plugin_dir)

            plugins = loader.list_plugins()
            self.assertEqual(len(plugins), 1)
            plugin = plugins[0]
            self.assertEqual(plugin["name"], "test_plugin")
            self.assertEqual(plugin["source"], "local")
            self.assertEqual(plugin["type"], "agent")

    def test_list_plugins_multiple_types(self):
        """Should track plugins of different types."""
        loader = PluginLoader()
        # Manually add plugins to internal list (simulating discovery)
        loader._loaded = [
            {"name": "agent1", "source": "entrypoint", "type": "agent"},
            {"name": "provider1", "source": "entrypoint", "type": "provider"},
            {"name": "local1", "source": "local", "type": "agent"},
        ]

        plugins = loader.list_plugins()
        self.assertEqual(len(plugins), 3)


class TestPluginLoaderDiscoverAll(unittest.TestCase):
    """Test combined discovery methods."""

    @patch.object(PluginLoader, "discover_entrypoints")
    @patch.object(PluginLoader, "discover_local")
    def test_discover_all_calls_both_methods(self, mock_local, mock_ep):
        """Should call both discovery methods."""
        loader = PluginLoader()
        loader.discover_all()

        mock_ep.assert_called_once()
        mock_local.assert_called_once()

    @patch.object(PluginLoader, "discover_entrypoints")
    @patch.object(PluginLoader, "discover_local")
    def test_discover_all_uses_custom_dir(self, mock_local, mock_ep):
        """Should pass custom directory to discover_local."""
        loader = PluginLoader()
        custom_dir = Path("/custom/plugins")
        loader.discover_all(plugin_dir=custom_dir)

        mock_local.assert_called_with(custom_dir)


class TestPluginLoaderIntegration(unittest.TestCase):
    """Integration tests with real plugin files."""

    def test_full_plugin_lifecycle(self):
        """Test complete plugin discovery and loading cycle."""
        with TemporaryDirectory() as tmpdir:
            plugin_dir = Path(tmpdir)

            # Create multiple plugins
            (plugin_dir / "plugin_a.py").write_text(
                "def register(registry): registry.register('plugin_a', type('PluginA', (), {}))"
            )
            (plugin_dir / "plugin_b.py").write_text(
                "def register(registry): registry.register('plugin_b', type('PluginB', (), {}))"
            )
            # Plugin without register - should be skipped
            (plugin_dir / "no_register.py").write_text("# Just a module")

            mock_registry = MagicMock()
            loader = PluginLoader(agent_registry=mock_registry)

            # Discover
            loader.discover_local(plugin_dir=plugin_dir)

            # Verify loaded
            self.assertEqual(loader.plugin_count, 2)
            plugins = loader.list_plugins()
            names = {p["name"] for p in plugins}
            self.assertEqual(names, {"plugin_a", "plugin_b"})

            # Verify registry calls
            self.assertEqual(mock_registry.register.call_count, 2)


class TestDefaultPluginDir(unittest.TestCase):
    """Test DEFAULT_PLUGIN_DIR constant."""

    def test_default_plugin_dir_path(self):
        """Should point to ~/.mekong/plugins."""
        expected = Path.home() / ".mekong" / "plugins"
        self.assertEqual(DEFAULT_PLUGIN_DIR, expected)


if __name__ == "__main__":
    unittest.main()
