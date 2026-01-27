"""
MCP Server Wrapper for Orchestrator Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import OrchestratorHandler

HELP_OUTPUT = """
🏯 **VibeOS Commands**

| Command | Description |
|---------|-------------|
| /money | Generate revenue (leads + content + outreach) |
| /build [feature] | Code + Test + Deploy |
| /client [name] | Full client onboarding |
| /content [topic] | Create SEO article + social posts |
| /win [decision] | WIN-WIN-WIN validation |
| /ship [msg] | Test → Commit → Push → Deploy |
| /help | This help menu |

💡 *Just type the command - AI handles the rest*
"""

class OrchestratorMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("orchestrator-server")
        self.handler = OrchestratorHandler()
        self.tools = [
            {
                "name": "execute_command",
                "description": "Execute a VibeOS command.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Command name (e.g., 'money', 'build')"
                        },
                        "args": {
                            "type": "string",
                            "description": "Optional arguments string"
                        }
                    },
                    "required": ["command"]
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> str:
        """Dispatch tool calls to handler."""
        if name == "execute_command":
            command = args.get("command")
            arg_str = args.get("args", "")
            arg_list = arg_str.split() if arg_str else []

            if command.lower() == "help":
                return HELP_OUTPUT

            result = await self.handler.execute(command, arg_list)
            return self._format_result(result)

        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_result(self, result: Dict[str, Any]) -> str:
        output = [result["message"], ""]
        for detail in result["details"]:
            output.append(f"  {detail}")

        if result.get("next_action"):
            output.append(f"\n📌 Next: {result['next_action']}")

        return "\n".join(output)

if __name__ == "__main__":
    server = OrchestratorMCPServer()
    server.run()
