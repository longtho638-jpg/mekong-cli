"""
🔌 Antigravity MCP Server (Facade)
==================================

Redirects to new modular implementation in antigravity.mcp_server package.
Preserves backward compatibility for imports and execution.
"""
import asyncio
from antigravity.mcp_server import AntigravityMCPServer, MCPResponse
from antigravity.mcp_server.__main__ import main

if __name__ == "__main__":
    asyncio.run(main())
