"""
Security MCP Server
===================
Pre-deploy, runtime, and post-deploy quality gates.
"""

import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import SecurityHandler


class SecurityMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("security-server")
        self.handler = SecurityHandler()
        self.tools = [
            {
                "name": "run_security_gates",
                "description": "Run all security and quality gates (Ruff, TypeScript, Pytest). Returns a formatted report.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "dry_run": {
                            "type": "boolean",
                            "description": "Run in dry-run mode (no actual execution)",
                            "default": False
                        }
                    }
                }
            },
            {
                "name": "check_lint",
                "description": "Check code linting status.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "check_types",
                "description": "Check TypeScript type safety.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "check_tests",
                "description": "Run unit tests.",
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
        if name == "run_security_gates":
            dry_run = args.get("dry_run", False)
            results = await self.handler.run_all_gates(dry_run)
            return self._format_report(results)

        elif name == "check_lint":
            res = await self.handler.check_ruff()
            return f"{res.name}: {res.status} - {res.message}\n{res.details or ''}"

        elif name == "check_types":
            res = await self.handler.check_typescript()
            return f"{res.name}: {res.status} - {res.message}\n{res.details or ''}"

        elif name == "check_tests":
            res = await self.handler.check_pytest()
            return f"{res.name}: {res.status} - {res.message}\n{res.details or ''}"

        else:
            raise ValueError(f"Unknown tool: {name}")

    def _format_report(self, results) -> str:
        report = ["🛡️ SECURITY ARMOR REPORT", "=" * 30, ""]
        passed_count = 0
        failed_count = 0

        for res in results:
            icon = {
                "pass": "✅",
                "fail": "❌",
                "warn": "⚠️",
                "skip": "⏭️"
            }.get(res["status"], "❓")

            report.append(f"{icon} {res['name']}: {res['message']} ({res['duration_ms']}ms)")
            if res["details"]:
                report.append(f"   Details: {res['details'][:100]}...")

            if res["status"] == "pass":
                passed_count += 1
            elif res["status"] == "fail":
                failed_count += 1

        report.append("-" * 30)
        if failed_count > 0:
            report.append(f"❌ BLOCKED: {failed_count} gate(s) failed")
        else:
            report.append(f"✅ ALL GATES PASSED ({passed_count}/{len(results)})")

        return "\n".join(report)

if __name__ == "__main__":
    server = SecurityMCPServer()
    server.run()
