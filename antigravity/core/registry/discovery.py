"""
Registry Discovery - Command resolution and normalization.
"""
from typing import Optional, Tuple, Dict, Any

from .store import COMMAND_REGISTRY, SHORTCUTS
from .mcp_catalog import mcp_catalog


def resolve_command(cmd_input: str) -> Tuple[Optional[str], Optional[str], Optional[Dict[str, Any]]]:
    """
    Normalizes command input. Supports shortcuts, 'suite:sub' format, or 'mcp:tool'.
    Returns: (suite, subcommand, metadata)
    """
    # 1. Check for MCP prefix
    if cmd_input.startswith("mcp:"):
        tool_name = cmd_input.split(":", 1)[1]
        tool_info = mcp_catalog.find_tool(tool_name)
        if tool_info:
            return "mcp", tool_name, tool_info
        return "mcp", tool_name, None

    # 2. Check if it's a direct shortcut
    if cmd_input in SHORTCUTS:
        resolved = SHORTCUTS[cmd_input]
        if resolved.startswith("mcp:"):
            return resolve_command(resolved)

        suite, sub = resolved.split(":")
        return suite, sub, _get_local_meta(suite, sub)

    # 3. Check if it's suite:sub format
    if ":" in cmd_input:
        parts = cmd_input.split(":")
        suite, sub = parts[0], parts[1]
        return suite, sub, _get_local_meta(suite, sub)

    # 4. Check if it's just a suite
    if cmd_input in COMMAND_REGISTRY:
        return cmd_input, None, None

    # 5. Fallback: Search MCP catalog if not found in local registry
    tool_info = mcp_catalog.find_tool(cmd_input)
    if tool_info:
        return "mcp", cmd_input, tool_info

    return None, None, None

def _get_local_meta(suite: str, sub: str) -> Optional[Dict[str, Any]]:
    """Helper to get metadata from COMMAND_REGISTRY."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if suite_data:
        return suite_data.get("subcommands", {}).get(sub.lower())
    return None
