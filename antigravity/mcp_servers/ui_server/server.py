"""
UI Checker MCP Server
=====================
Check UI package versions and sync status.
"""

import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import UIHandler

class UIMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("ui-server")
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

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> str:
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
