"""
MCP Server Wrapper for Coding Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import CodingHandler


class CodingMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("coding-server")
        self.handler = CodingHandler()
        self.tools = [
            {
                "name": "build",
                "description": "Run full build pipeline (Analyze -> Code -> Test -> Lint)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "feature": {
                            "type": "string",
                            "description": "Feature name or description"
                        }
                    },
                    "required": ["feature"]
                }
            },
            {
                "name": "ship",
                "description": "Ship current changes (Lint -> Test -> Commit -> Push -> Deploy)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Commit message"
                        }
                    }
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "build":
            feature = args.get("feature")
            return await self.handler.build(feature)

        elif name == "ship":
            message = args.get("message", "")
            return await self.handler.ship(message)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = CodingMCPServer()
    server.run()
