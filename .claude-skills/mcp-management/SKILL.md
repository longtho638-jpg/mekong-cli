# MCP Management

## Description
Manage Model Context Protocol (MCP) servers and tools.

## Implementation
- **Core Logic**: `antigravity/core/mcp_manager.py`
- **Orchestrator**: `antigravity/core/mcp_orchestrator.py`

## Capabilities
- **Discover**: Find available tools from registered servers
- **Call**: Execute tools via standard protocol
- **Manage**: Add/Remove/Update MCP server configurations

## Dependencies
- `mcp` (Python package)
- `.claude/mcp.json` (Configuration)
