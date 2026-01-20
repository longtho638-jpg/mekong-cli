"""
MCP Server Wrapper for Quota Engine.
Handles JSON-RPC over stdio.
"""
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import QuotaHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("quota-server")

class QuotaMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Quota MCP Server started")

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
