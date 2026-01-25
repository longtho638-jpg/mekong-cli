"""
MCP Server Wrapper for Revenue Agent.
Handles JSON-RPC over stdio.
"""
import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import RevenueAgentHandler

class RevenueMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("revenue-server")
        self.handler = RevenueAgentHandler()
        self.tools = [
            {
                "name": "check_sales",
                "description": "Check Gumroad for new sales and update revenue stats",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "nurture_leads",
                "description": "Process leads and send follow-ups if needed",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "generate_content",
                "description": "Generate marketing content ideas",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer", "description": "Number of ideas to generate", "default": 3}
                    }
                }
            },
            {
                "name": "get_report",
                "description": "Get current revenue and performance report",
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
        if name == "check_sales":
            return self.handler.check_sales()

        elif name == "nurture_leads":
            return self.handler.nurture_leads()

        elif name == "generate_content":
            count = args.get("count", 3)
            return self.handler.generate_content(count)

        elif name == "get_report":
            return self.handler.get_report()

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = RevenueMCPServer()
    server.run()
