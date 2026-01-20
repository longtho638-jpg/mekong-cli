"""
MCP Server Wrapper for Revenue Agent.
Handles JSON-RPC over stdio.
"""
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import RevenueAgentHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("revenue-server")

class RevenueMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Revenue MCP Server started")

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
