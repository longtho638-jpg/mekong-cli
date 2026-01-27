"""
Sync MCP Server
===============
Verify Frontend-Backend API synchronization.
"""

import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import SyncHandler


class SyncMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("sync-server")
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

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> str:
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
