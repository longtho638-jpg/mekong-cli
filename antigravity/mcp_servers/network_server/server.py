"""
Network Optimizer MCP Server
============================
Automates WARP/DoH management and latency optimization.
"""

import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import NetworkHandler

class NetworkMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("network-server")
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

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> str:
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
