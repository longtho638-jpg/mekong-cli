"""
MCP Server Wrapper for Solo Revenue Daemon.
Handles JSON-RPC over stdio.
"""
import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import SoloRevenueHandler

class SoloRevenueMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("solo-revenue-server")
        self.handler = SoloRevenueHandler()
        self.tools = [
            {
                "name": "get_status",
                "description": "Get status of the revenue daemon and its tasks",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "execute_task",
                "description": "Execute a specific revenue task by ID",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "string",
                            "description": "ID of the task to execute"
                        },
                        "override_config": {
                            "type": "object",
                            "description": "Optional configuration overrides"
                        }
                    },
                    "required": ["task_id"]
                }
            },
            {
                "name": "run_all_tasks",
                "description": "Run all enabled tasks sequentially",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "list_tasks",
                "description": "List all available task IDs",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "get_status":
            return self.handler.get_status()

        elif name == "execute_task":
            task_id = args.get("task_id")
            override_config = args.get("override_config")
            return self.handler.execute_task(task_id, override_config)

        elif name == "run_all_tasks":
            return self.handler.run_all_tasks()

        elif name == "list_tasks":
            return self.handler.list_tasks()

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = SoloRevenueMCPServer()
    server.run()
