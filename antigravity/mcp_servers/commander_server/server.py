"""
MCP Server Wrapper for Commander Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import CommanderHandler

class CommanderMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("commander-server")
        self.handler = CommanderHandler()
        self.tools = [
            {
                "name": "get_dashboard",
                "description": "Get full system status dashboard and anomalies",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "check_system",
                "description": "Check health of a specific system",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system_name": {
                            "type": "string",
                            "description": "Name of system (vercel, supabase, github, jules, proxy, taskmaster)"
                        }
                    },
                    "required": ["system_name"]
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "get_dashboard":
            return await self.handler.get_dashboard()

        elif name == "check_system":
            system_name = args.get("system_name")
            return await self.handler.check_system(system_name)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = CommanderMCPServer()
    server.run()
