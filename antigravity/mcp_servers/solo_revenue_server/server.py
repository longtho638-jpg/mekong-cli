"""
MCP Server Wrapper for Solo Revenue Daemon.
Handles JSON-RPC over stdio.
"""
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import SoloRevenueHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("solo-revenue-server")

class SoloRevenueMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Solo Revenue MCP Server started")

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
