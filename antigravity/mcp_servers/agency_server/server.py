"""
MCP Server Wrapper for Agency Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import AgencyHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("agency-server")

class AgencyMCPServer:
    def __init__(self):
        self.handler = AgencyHandler()
        self.tools = [
            {
                "name": "onboard_client",
                "description": "Run client onboarding pipeline (Contract -> Invoice -> Portal -> Welcome)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Client/company name"
                        },
                        "vertical": {
                            "type": "string",
                            "description": "Optional vertical name (healthcare, fintech, saas)"
                        }
                    },
                    "required": ["name"]
                }
            },
            {
                "name": "validate_win",
                "description": "Validate decision against WIN-WIN-WIN framework",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "decision": {
                            "type": "string",
                            "description": "Decision or opportunity to evaluate"
                        }
                    },
                    "required": ["decision"]
                }
            },
            {
                "name": "audit_client",
                "description": "Run a vertical-specific audit for a client (Healthcare, Fintech, SaaS)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "client_name": {
                            "type": "string",
                            "description": "Client/company name"
                        },
                        "vertical": {
                            "type": "string",
                            "description": "Vertical name (healthcare, fintech, saas)"
                        },
                        "system_config": {
                            "type": "object",
                            "description": "Optional system configuration to audit"
                        }
                    },
                    "required": ["client_name", "vertical"]
                }
            },
            {
                "name": "outreach_pipeline",
                "description": "Run urgent outreach campaign",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Agency MCP Server started")

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
        if name == "onboard_client":
            client_name = args.get("name")
            vertical = args.get("vertical")
            return asyncio.run(self.handler.onboard_client(client_name, vertical))

        elif name == "validate_win":
            decision = args.get("decision")
            return asyncio.run(self.handler.validate_win(decision))

        elif name == "audit_client":
            client_name = args.get("client_name")
            vertical = args.get("vertical")
            system_config = args.get("system_config")
            return asyncio.run(self.handler.audit_client(client_name, vertical, system_config))

        elif name == "outreach_pipeline":
            return asyncio.run(self.handler.outreach_pipeline())

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = AgencyMCPServer()
    server.run()
