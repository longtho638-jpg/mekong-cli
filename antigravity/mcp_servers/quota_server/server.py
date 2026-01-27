"""
MCP Server Wrapper for Quota Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import QuotaHandler


class QuotaMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("quota-server")
        self.handler = QuotaHandler()
        self.tools = [
            {
                "name": "get_status",
                "description": "Get current comprehensive quota status",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_cli_report",
                "description": "Get formatted CLI report of quota status",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "format_type": {
                            "type": "string",
                            "description": "Format type: full, compact, table, or json",
                            "enum": ["full", "compact", "table", "json"],
                            "default": "full"
                        }
                    }
                }
            },
            {
                "name": "get_optimal_model",
                "description": "Get the recommended model to use based on quota",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "task_type": {
                            "type": "string",
                            "description": "Type of task (general, code, vision)",
                            "default": "general"
                        }
                    }
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "get_status":
            return self.handler.get_status()

        elif name == "get_cli_report":
            format_type = args.get("format_type", "full")
            return self.handler.get_cli_report(format_type)

        elif name == "get_optimal_model":
            task_type = args.get("task_type", "general")
            return self.handler.get_optimal_model(task_type)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = QuotaMCPServer()
    server.run()
