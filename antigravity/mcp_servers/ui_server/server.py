"""
UI Checker MCP Server
=====================
Check UI package versions and sync status.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import UIHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("ui-server")

class UIMCPServer:
    def __init__(self):
        self.handler = UIHandler()
        self.tools = [
            {
                "name": "check_ui",
                "description": "Check @agencyos/ui package version, components, and integration status.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("UI MCP Server started")

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
        if name == "check_ui":
            status = await self.handler.check_status()
            return self._format_status(status)
        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_status(self, status: Dict[str, Any]) -> str:
        output = [
            "🎨 UI VERSION CHECKER",
            "=" * 30,
            "",
            "📦 @agencyos/ui",
            f"   Version: {status['ui_version'] or 'Not found'}",
            f"   Components: {status['component_count']}",
        ]

        for comp in status['components'][:10]:
            output.append(f"      → {comp}")
        if len(status['components']) > 10:
            output.append(f"      ... and {len(status['components']) - 10} more")

        output.append("\n📊 Dashboard Integration")
        if status['dashboard_version']:
            output.append(f"   ✅ @agencyos/ui: {status['dashboard_version']}")
        else:
            output.append("   ⚠️ @agencyos/ui not installed in dashboard")

        output.append("\n📝 Last UI Commits")
        if status['git_log']:
            for line in status['git_log']:
                output.append(f"   {line}")
        else:
            output.append("   No commits found")

        return "\n".join(output)

if __name__ == "__main__":
    server = UIMCPServer()
    server.run()
