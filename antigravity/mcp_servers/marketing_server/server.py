"""
MCP Server Wrapper for Marketing Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import MarketingHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("marketing-server")

class MarketingMCPServer:
    def __init__(self):
        self.handler = MarketingHandler()
        self.tools = [
            {
                "name": "content_pipeline",
                "description": "Run full content production pipeline (Topic -> Research -> Content -> SEO -> Social)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Content topic or keyword"
                        }
                    },
                    "required": ["topic"]
                }
            },
            {
                "name": "lead_pipeline",
                "description": "Run lead generation and qualification pipeline",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "generate_ideas",
                "description": "Generate content ideas",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "count": {
                            "type": "integer",
                            "description": "Number of ideas to generate",
                            "default": 3
                        }
                    }
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Marketing MCP Server started")

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
        if name == "content_pipeline":
            topic = args.get("topic")
            return asyncio.run(self.handler.content_pipeline(topic))

        elif name == "lead_pipeline":
            return asyncio.run(self.handler.lead_pipeline())

        elif name == "generate_ideas":
            count = args.get("count", 3)
            return asyncio.run(self.handler.generate_ideas(count))

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = MarketingMCPServer()
    server.run()
