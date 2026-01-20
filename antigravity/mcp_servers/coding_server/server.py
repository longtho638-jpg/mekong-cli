"""
MCP Server Wrapper for Coding Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import CodingHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("coding-server")

class CodingMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Coding MCP Server started")

        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break

                request = json.loads(line)
                response = self.handle_request(request)

                if response:
                    sys.stdout.write(json.dumps(response) + "\n")
                    sys.stdout.flush()

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                continue
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                logger.error(traceback.format_exc())

    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
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

                result = self.call_tool(tool_name, args)
                response["result"] = result

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

    def call_tool(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "build":
            feature = args.get("feature")
            return asyncio.run(self.handler.build(feature))

        elif name == "ship":
            message = args.get("message", "")
            return asyncio.run(self.handler.ship(message))

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = CodingMCPServer()
    server.run()
