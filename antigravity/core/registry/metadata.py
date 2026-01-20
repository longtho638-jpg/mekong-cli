"""
Registry Metadata - Command information and agent mapping.
"""
from typing import Any, Dict, List, Optional

from .store import COMMAND_REGISTRY
from .mcp_catalog import mcp_catalog


def get_command_metadata(suite: str, sub: str) -> Optional[Dict[str, Any]]:
    """Retrieves all configuration data for a specific command."""
    if suite == "mcp":
        tool_info = mcp_catalog.find_tool(sub)
        return tool_info if tool_info else None

    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return None
    return suite_data.get("subcommands", {}).get(sub.lower())

def get_agent_for_command(suite: str, sub: str) -> str:
    """Identifies the best agent to lead a specific command."""
    meta = get_command_metadata(suite, sub)
    if meta:
        if "agent" in meta:
            return meta["agent"]
        if suite == "mcp":
            return "mcp-developer"

    # Default fallback agents by suite
    fallbacks = {
        "dev": "fullstack-developer",
        "revenue": "money-maker",
        "strategy": "binh-phap-strategist",
        "crm": "client-magnet",
        "content": "content-factory",
    }
    return fallbacks.get(suite, "assistant")

def list_suites() -> List[str]:
    """Returns all available top-level command categories."""
    return sorted(list(COMMAND_REGISTRY.keys()))

def list_subcommands(suite: str) -> List[str]:
    """Returns all available subcommands for a specific category."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return []
    return sorted(list(suite_data.get("subcommands", {}).keys()))
