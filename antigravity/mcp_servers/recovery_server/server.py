"""
Recovery MCP Server
===================
Automatic recovery actions for detected anomalies.
"""

import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import RecoveryHandler

class RecoveryMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("recovery-server")
        self.handler = RecoveryHandler()
        self.tools = [
            {
                "name": "auto_recover",
                "description": "Check system health and attempt auto-recovery for any failures.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "recover_system",
                "description": "Attempt to recover a specific system manually.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system": {
                            "type": "string",
                            "description": "System to recover (e.g., proxy, github)"
                        }
                    },
                    "required": ["system"]
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> str:
        """Dispatch tool calls to handler."""
        if name == "auto_recover":
            result = await self.handler.auto_recover_all()
            return self._format_auto_recover(result)

        elif name == "recover_system":
            system = args.get("system")
            success = await self.handler.run_recovery(system)
            return f"✅ Recovery action for {system} initiated" if success else f"❌ Recovery action for {system} failed or not available"

        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_auto_recover(self, result: Dict[str, Any]) -> str:
        output = [result["message"]]

        if result.get("recovered"):
            output.append("\nActions taken:")
            for system, action in result.get("actions", {}).items():
                icon = "✅" if action == "Recovered" else "❌"
                output.append(f"  {icon} {system}: {action}")

        if result.get("details"):
            output.append("\nIssues detected:")
            for detail in result.get("details", []):
                output.append(f"  - {detail}")

        return "\n".join(output)

if __name__ == "__main__":
    server = RecoveryMCPServer()
    server.run()
