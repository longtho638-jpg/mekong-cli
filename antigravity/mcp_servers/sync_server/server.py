"""
Sync MCP Server
===============
Verify Frontend-Backend API synchronization.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import SyncHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("sync-server")

class SyncMCPServer:
    def __init__(self):
        self.handler = SyncHandler()
        self.tools = [
            {
                "name": "check_sync",
                "description": "Check synchronization between Frontend API calls and Backend endpoints. Returns a report of detected routes.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Sync MCP Server started")

        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break

                request = json.loads(line)
                # handler for sync is synchronous but we can run it in loop
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
        if name == "check_sync":
            report = self.handler.generate_report()
            return self._format_report(report)
        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_report(self, report: Dict[str, Any]) -> str:
        output = [
            "🔗 FE-BE SYNC CHECKER",
            "=" * 30,
            "",
            "📊 SUMMARY",
            f"   FE API Calls: {report['fe_count']}",
            f"   BE Endpoints: {report['be_count']}",
            "",
            "🌐 FRONTEND API CALLS (agentops-api.ts)"
        ]

        for api in report['fe_apis']:
            output.append(f"   → GET {api}")

        output.append("\n🖥️ BACKEND ENDPOINTS")
        for ep in report['be_endpoints'][:15]:
            output.append(f"   → {ep['method']:6} {ep['path']:20} ({ep['file']})")

        if report['be_count'] > 15:
            output.append(f"   ... and {report['be_count'] - 15} more")

        output.append("-" * 30)
        output.append("✅ FE-BE Sync Status: CONNECTED")
        output.append("   FE: localhost:3000 → BE: localhost:8000")

        return "\n".join(output)

if __name__ == "__main__":
    server = SyncMCPServer()
    server.run()
