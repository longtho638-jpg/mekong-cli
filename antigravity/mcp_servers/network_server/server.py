"""
Network Optimizer MCP Server
============================
Automates WARP/DoH management and latency optimization.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import NetworkHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("network-server")

class NetworkMCPServer:
    def __init__(self):
        self.handler = NetworkHandler()
        self.tools = [
            {
                "name": "get_network_status",
                "description": "Get current network status report.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "optimize_network",
                "description": "Auto-optimize network settings: 1. Enable WARP+DoH 2. Find fastest endpoint 3. Apply settings",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "enable_doh",
                "description": "Enable WARP+DoH mode.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "set_endpoint",
                "description": "Set WARP endpoint (e.g., 162.159.193.1:4500).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "endpoint": {
                            "type": "string",
                            "description": "The endpoint to set"
                        }
                    },
                    "required": ["endpoint"]
                }
            }
        ]

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Network MCP Server started")

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
        if name == "get_network_status":
            status = await self.handler.get_status()
            return self._format_report(status)

        elif name == "optimize_network":
            results = await self.handler.optimize()
            return self._format_optimization(results)

        elif name == "enable_doh":
            success = await self.handler.enable_doh()
            return "✅ WARP+DoH mode enabled" if success else "❌ Failed to enable DoH mode"

        elif name == "set_endpoint":
            endpoint = args.get("endpoint")
            success = await self.handler.set_endpoint(endpoint)
            return f"✅ Endpoint set to {endpoint}" if success else "❌ Failed to set endpoint"

        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_report(self, status: Dict[str, Any]) -> str:
        colo = status.get("colo", "unknown")
        latency = status.get("latency_ms", 0) or 0
        connected = status.get("warp_connected", False)
        mode = status.get("warp_mode", "unknown")
        endpoint = status.get("endpoint") or "default"

        colo_emoji = "🟢" if colo in ["SIN", "HKG"] else "🟡"
        latency_emoji = (
            "🟢" if latency < 150 else "🟡" if latency < 250 else "🔴"
        )

        report = f"""
🌐 **Network Status Report**

| Metric | Value | Status |
|--------|-------|--------|
| WARP Connected | {connected} | {"🟢" if connected else "🔴"} |
| WARP Mode | {mode} | {"🟢" if "doh" in mode.lower() else "🟡"} |
| Cloudflare Colo | {colo} | {colo_emoji} |
| API Latency | {latency:.0f}ms | {latency_emoji} |
| Endpoint | {endpoint} | - |
"""

        recommendations = []
        if latency > 200:
            recommendations.append("- ⚠️ High latency detected.")
        if colo not in ["SIN", "HKG"] and colo != "unknown":
            recommendations.append(f"- ⚠️ Routing through {colo}. Singapore (SIN) is optimal.")
        if "doh" not in mode.lower():
            recommendations.append("- 💡 Enable DoH for faster DNS.")

        if recommendations:
            report += "\n**Recommendations:**\n" + "\n".join(recommendations)

        return report

    def _format_optimization(self, results: Dict[str, Any]) -> str:
        output = ["🚀 Optimization complete:"]
        for action in results.get("actions", []):
            output.append(f"  ✓ {action}")

        improvement = results.get("latency_improvement")
        if improvement:
            output.append(f"  📈 Latency improved by {improvement}")

        if not results.get("actions") and not improvement:
            output.append("  ✨ Network already optimized.")

        return "\n".join(output)

if __name__ == "__main__":
    server = NetworkMCPServer()
    server.run()
