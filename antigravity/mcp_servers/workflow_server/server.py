"""
MCP Server Wrapper for Workflow Engine.
Handles JSON-RPC over stdio.
"""
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import WorkflowEngineHandler

# Configure logging to stderr to not interfere with stdout JSON-RPC
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("workflow-server")

class WorkflowMCPServer:
    def __init__(self):
        self.handler = WorkflowEngineHandler()
        self.tools = [
            {
                "name": "list_workflows",
                "description": "List all available workflows",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                }
            },
            {
                "name": "execute_workflow",
                "description": "Execute a specific workflow by ID",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "workflow_id": {"type": "string", "description": "ID of the workflow to execute"},
                        "context": {"type": "object", "description": "Optional execution context data"}
                    },
                    "required": ["workflow_id"]
                }
            },
            {
                "name": "create_workflow",
                "description": "Create a new workflow",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "trigger_type": {
                            "type": "string",
                            "enum": ["manual", "cron", "webhook", "gumroad_sale", "new_lead", "email_received", "newsletter_subscribe", "newsletter_upgrade", "newsletter_limit_hit"]
                        },
                        "trigger_config": {"type": "object"}
                    },
                    "required": ["name", "trigger_type"]
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Workflow MCP Server started")

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
        if name == "list_workflows":
            return self.handler.list_workflows()

        elif name == "execute_workflow":
            workflow_id = args.get("workflow_id")
            context = args.get("context", {})
            return self.handler.execute_workflow(workflow_id, context)

        elif name == "create_workflow":
            name_arg = args.get("name")
            trigger_type = args.get("trigger_type")
            trigger_config = args.get("trigger_config")
            return self.handler.create_workflow(name_arg, trigger_type, trigger_config)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = WorkflowMCPServer()
    server.run()
