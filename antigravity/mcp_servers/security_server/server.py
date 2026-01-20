"""
Security MCP Server
===================
Pre-deploy, runtime, and post-deploy quality gates.
"""

import asyncio
import json
import logging
import sys
import traceback
from typing import Any, Dict

from .handlers import SecurityHandler

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("security-server")

class SecurityMCPServer:
    def __init__(self):
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

    def run(self):
        """Main event loop listening on stdin."""
        logger.info("Security MCP Server started")

        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break

                request = json.loads(line)
                # Since handlers are async, we need to run them
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
