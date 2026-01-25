"""
Example 1: Simple Math Server
Demonstrates basic tool definition and handling.
"""
import asyncio
from typing import Any, Dict, List
from antigravity.mcp.base import BaseMCPServer

class MathMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("math-server")

    def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "add",
                "description": "Add two numbers",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "number"},
                        "b": {"type": "number"}
                    },
                    "required": ["a", "b"]
                }
            },
            {
                "name": "multiply",
                "description": "Multiply two numbers",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "number"},
                        "b": {"type": "number"}
                    },
                    "required": ["a", "b"]
                }
            }
        ]

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        if name == "add":
            return args["a"] + args["b"]
        elif name == "multiply":
            return args["a"] * args["b"]
        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = MathMCPServer()
    server.run()
