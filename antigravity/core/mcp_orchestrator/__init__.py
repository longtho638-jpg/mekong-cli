"""
MCP Orchestrator
================
Lifecycle management for MCP servers with lazy-loading and TTL monitoring.
"""
from .engine import MCPOrchestrator
from .types import MCPCallResult, MCPServerConfig, MCPToolDefinition

# Global orchestrator instance
mcp_orchestrator = MCPOrchestrator()

__all__ = [
    "MCPOrchestrator",
    "mcp_orchestrator",
    "MCPCallResult",
    "MCPServerConfig",
    "MCPToolDefinition",
]
