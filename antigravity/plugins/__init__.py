"""
Plugin system for Antigravity CLI.

Provides a flexible plugin architecture for extending the CLI with custom commands
and functionality. Plugins can register new commands, hook into lifecycle events,
and extend the core system.
"""

from antigravity.plugins.base import CCPlugin
from antigravity.plugins.loader import PluginLoader

__all__ = ["CCPlugin", "PluginLoader"]
