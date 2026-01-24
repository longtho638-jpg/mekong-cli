"""
MCP Orchestrator Types
======================
Data definitions for MCP tools and server configurations.
"""
from typing import Any, Dict, List
from typing_extensions import TypedDict


class MCPToolDefinition(TypedDict):
    """MCP tool metadata"""
    name: str
    description: str
    inputSchema: Dict[str, Any]


class MCPCallResult(TypedDict, total=False):
    """Result of an MCP tool call"""
    success: bool
    result: Any
    error: str


class MCPServerConfig(TypedDict, total=False):
    """Configuration for an MCP server"""
    type: str  # stdio, sse
    command: str
    args: List[str]
    env: Dict[str, str]
    url: str
    headers: Dict[str, str]
