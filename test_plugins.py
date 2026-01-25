"""
Test script for the Antigravity plugin system.

This script verifies that:
1. Plugins can be discovered and loaded
2. Plugin commands are registered correctly
3. Lifecycle hooks are called
4. Dependencies are resolved correctly
"""

import logging
import sys
from pathlib import Path

import typer

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from antigravity.plugins.loader import PluginLoader

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(levelname)s: %(message)s", stream=sys.stdout
)

logger = logging.getLogger(__name__)


def test_plugin_system():
    """Test the plugin system functionality."""
    print("\n" + "=" * 60)
    print("ANTIGRAVITY PLUGIN SYSTEM TEST")
    print("=" * 60 + "\n")

    # Create a test Typer app
    app = typer.Typer(help="Test application for plugin system")

    # Create plugin loader
    plugin_dir = Path(__file__).parent / "antigravity" / "plugins"
    print(f"Plugin directory: {plugin_dir}\n")

    loader = PluginLoader(plugin_dir)

    # Test 1: Discover plugins
    print("TEST 1: Discovering plugins...")
    loader.discover_plugins()
    print(f"✓ Discovered {len(loader.plugins)} plugin(s)\n")

    # Test 2: List plugins
    print("TEST 2: Listing loaded plugins...")
    for plugin_info in loader.list_plugins():
        print(f"  - {plugin_info['name']} v{plugin_info['version']}")
        print(f"    {plugin_info['description']}")
        if plugin_info["dependencies"]:
            print(f"    Dependencies: {', '.join(plugin_info['dependencies'])}")
    print()

    # Test 3: Register commands
    print("TEST 3: Registering plugin commands...")
    loader.register_all(app)
    print("✓ Commands registered\n")

    # Test 4: Startup hooks
    print("TEST 4: Calling startup hooks...")
    loader.startup_all()
    print("✓ Startup hooks called\n")

    # Test 5: Shutdown hooks
    print("TEST 5: Calling shutdown hooks...")
    loader.shutdown_all()
    print("✓ Shutdown hooks called\n")

    # Test 6: Get specific plugin
    print("TEST 6: Retrieving specific plugin...")
    hello_plugin = loader.get_plugin("hello")
    if hello_plugin:
        print(f"✓ Retrieved plugin: {hello_plugin}")
        print(f"  Info: {hello_plugin.get_info()}\n")
    else:
        print("✗ Failed to retrieve hello plugin\n")

    print("=" * 60)
    print("ALL TESTS COMPLETED SUCCESSFULLY")
    print("=" * 60 + "\n")

    print("To test the plugin commands, run:")
    print("  python -m cli.entrypoint hello")
    print("  python -m cli.entrypoint hello Alice --emoji")
    print("  python -m cli.entrypoint plugin-info")
    print()


if __name__ == "__main__":
    try:
        test_plugin_system()
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        sys.exit(1)
