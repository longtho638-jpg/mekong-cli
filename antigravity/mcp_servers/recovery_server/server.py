"""
Recovery MCP Server
===================
Automatic recovery actions for detected anomalies.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import RecoveryHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("recovery-server")

class RecoveryMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Recovery MCP Server started")

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
