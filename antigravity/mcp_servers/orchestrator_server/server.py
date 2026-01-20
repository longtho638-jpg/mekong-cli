"""
Orchestrator MCP Server
=======================
Central command router for all Vibe Engines.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import OrchestratorHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("orchestrator-server")

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

class OrchestratorMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Orchestrator MCP Server started")

        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break

                request = json.loads(line)
                response = asyncio.run(self.handle_request(request))

                if response:
                    sys.stdout.write(json.dumps(response) + "\n")
                    sys.stdout.flush()

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                continue
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                logger.error(traceback.format_exc())

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle JSON-RPC request."""
        msg_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        response = {
            "jsonrpc": "2.0",
            "id": msg_id
        }

        try:
            if method == "tools/list":
                response["result"] = {
                    "tools": self.tools
                }

            elif method == "tools/call":
                tool_name = params.get("name")
                args = params.get("arguments", {})

                result = await self.call_tool(tool_name, args)
                response["result"] = {
                    "content": [
                        {
                            "type": "text",
                            "text": str(result)
                        }
                    ]
                }

            else:
                response["error"] = {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }

        except Exception as e:
            logger.error(f"Error handling request {method}: {e}")
            logger.error(traceback.format_exc())
            response["error"] = {
                "code": -32603,
                "message": str(e)
            }

        return response

    async def call_tool(self, name: str, args: Dict[str, Any]) -> str:
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
