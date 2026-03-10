from .lead_hunter import LeadHunter
from .content_writer import ContentWriter
from .recipe_crawler import RecipeCrawler
from .git_agent import GitAgent
from .file_agent import FileAgent
from .shell_agent import ShellAgent
from .database_agent import DatabaseAgent
from .workspace_agent import WorkspaceAgent
from .monitor_agent import MonitorAgent
from .network_agent import NetworkAgent
from src.core.agent_registry import AgentRegistry

# Global registry instance — single source of truth for agent lookup
registry = AgentRegistry()
registry.register("git", GitAgent)
registry.register("file", FileAgent)
registry.register("shell", ShellAgent)
registry.register("database", DatabaseAgent)
registry.register("db", DatabaseAgent)  # Alias for convenience
registry.register("lead", LeadHunter)
registry.register("content", ContentWriter)
registry.register("crawler", RecipeCrawler)
registry.register("workspace", WorkspaceAgent)
registry.register("google", WorkspaceAgent)  # Alias
registry.register("monitor", MonitorAgent)
registry.register("network", NetworkAgent)

# Backward-compatibility alias — keeps existing code working without changes
AGENT_REGISTRY = registry._agents

# Auto-discover community plugins (never crashes CLI)
try:
    from src.core.plugin_loader import PluginLoader
    _plugin_loader = PluginLoader(agent_registry=registry)
    _plugin_loader.discover_all()
except Exception:
    _plugin_loader = None

__all__ = [
    "LeadHunter",
    "ContentWriter",
    "RecipeCrawler",
    "GitAgent",
    "FileAgent",
    "ShellAgent",
    "DatabaseAgent",
    "WorkspaceAgent",
    "MonitorAgent",
    "NetworkAgent",
    "registry",
    "AGENT_REGISTRY",
]
