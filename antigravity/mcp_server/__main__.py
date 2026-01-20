"""
MCP Server Entry Point.
"""
import asyncio
import json
from dataclasses import asdict

from .server import AntigravityMCPServer

# Try to import MCP SDK
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import TextContent, Tool
    HAS_MCP_SDK = True
except ImportError:
    HAS_MCP_SDK = False

async def main():
    """Run the Antigravity MCP Server."""
    if not HAS_MCP_SDK:
        print("❌ Cannot start server: MCP SDK not installed")
        print("   Run: pip install mcp")
        return

    server = Server("antigravity")
    antigravity = AntigravityMCPServer()

    @server.list_tools()
    async def list_tools():
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in antigravity.get_tools()
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        result = await antigravity.handle_tool(name, arguments)
        return [TextContent(type="text", text=json.dumps(asdict(result), indent=2))]

    print("🏯 Starting Antigravity MCP Server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
