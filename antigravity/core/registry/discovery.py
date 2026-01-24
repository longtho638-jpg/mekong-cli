"""
Registry Discovery - Command resolution and normalization.
"""
from typing import Any, Dict, List, Optional, Tuple

from typing_extensions import TypedDict

from .mcp_catalog import MCPToolLookupResult, mcp_catalog
from .store import COMMAND_REGISTRY, SHORTCUTS, SubcommandMetadataDict


class SearchResultItemDict(TypedDict):
    type: str
    name: str
    description: str


class SearchCapabilitiesResponse(TypedDict):
    """Aggregated search results for platform capabilities"""
    local: List[SearchResultItemDict]
    mcp: List[MCPToolLookupResult]


def resolve_command(cmd_input: str) -> Tuple[Optional[str], Optional[str], Optional[SubcommandMetadataDict]]:
    """
    Normalizes command input. Supports shortcuts, 'suite:sub' format, or 'mcp:tool'.
    Returns: (suite, subcommand, metadata)
    """
    # 1. Check for MCP prefix
    if cmd_input.startswith("mcp:"):
        tool_name = cmd_input.split(":", 1)[1]
        tool_info = mcp_catalog.find_tool(tool_name)
        if tool_info:
            # Map tool info to a metadata compatible format
            meta: SubcommandMetadataDict = {"agent": "mcp-developer"}
            return "mcp", tool_name, meta
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
        meta: SubcommandMetadataDict = {"agent": "mcp-developer"}
        return "mcp", cmd_input, meta

    return None, None, None


def search_capabilities(query: str) -> SearchCapabilitiesResponse:
    """
    Search for capabilities across both local registry and MCP tools.
    """
    results: SearchCapabilitiesResponse = {
        "local": [],
        "mcp": []
    }

    # Search Local Registry
    query_lower = query.lower()
    for suite_name, suite_data in COMMAND_REGISTRY.items():
        # Search suite description
        if query_lower in suite_data.get("description", "").lower():
            results["local"].append({
                "type": "suite",
                "name": suite_name,
                "description": suite_data.get("description")
            })

        # Search subcommands
        for sub_name, sub_meta in suite_data.get("subcommands", {}).items():
            # In a real app, we'd check subcommand description if available in metadata
            # For now, we check the name and inferred description
            if query_lower in sub_name.lower():
                results["local"].append({
                    "type": "command",
                    "name": f"{suite_name}:{sub_name}",
                    "description": f"Command in {suite_name}"
                })

    # Search MCP Catalog
    mcp_results = mcp_catalog.search_tools(query)
    results["mcp"] = mcp_results

    return results


def _get_local_meta(suite: str, sub: str) -> Optional[SubcommandMetadataDict]:
    """Helper to get metadata from COMMAND_REGISTRY."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if suite_data:
        return suite_data.get("subcommands", {}).get(sub.lower())
    return None
