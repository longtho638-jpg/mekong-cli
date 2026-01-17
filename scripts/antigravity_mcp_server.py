#!/usr/bin/env python3
"""
🚀 Antigravity MCP Server
========================

SSE-based MCP server that routes ALL OpenCode operations
through the Antigravity API at localhost:8000.

This REPLACES OpenCode Zen with local Antigravity processing.

Usage:
    python3 scripts/antigravity_mcp_server.py

Then configure OpenCode to use:
    http://localhost:3333/sse
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

import aiohttp_sse
from aiohttp import ClientSession, web

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("antigravity-mcp")

# Antigravity API base
API_BASE = "http://localhost:8000"


class AntigravityMCPServer:
    """
    MCP Server that routes to Antigravity API.

    Implements the Model Context Protocol for OpenCode integration.
    """

    def __init__(self, port: int = 3333):
        self.port = port
        self.app = web.Application()
        self.session: Optional[ClientSession] = None
        self.tools = self._define_tools()

    def _define_tools(self) -> List[Dict]:
        """Define available MCP tools."""
        return [
            {
                "name": "antigravity_analyze",
                "description": "Analyze codebase using Antigravity API",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Path to analyze"},
                        "depth": {"type": "integer", "default": 3},
                    },
                },
            },
            {
                "name": "antigravity_execute",
                "description": "Execute code operation via Antigravity",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string"},
                        "params": {"type": "object"},
                    },
                    "required": ["action"],
                },
            },
            {
                "name": "antigravity_create_file",
                "description": "Create file using Antigravity (not Claude)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"},
                    },
                    "required": ["path", "content"],
                },
            },
            {
                "name": "antigravity_run_tests",
                "description": "Run tests via Antigravity",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "default": "backend/tests/"}
                    },
                },
            },
            {
                "name": "antigravity_status",
                "description": "Get Antigravity system status",
                "inputSchema": {"type": "object", "properties": {}},
            },
        ]

    async def call_antigravity(
        self, endpoint: str, method: str = "GET", data: Dict = None
    ) -> Dict:
        """Call Antigravity API."""
        if not self.session:
            self.session = ClientSession()

        url = f"{API_BASE}{endpoint}"

        try:
            if method == "GET":
                async with self.session.get(url) as resp:
                    return await resp.json()
            else:
                async with self.session.post(url, json=data or {}) as resp:
                    return await resp.json()
        except Exception as e:
            logger.error(f"Antigravity API error: {e}")
            return {"error": str(e)}

    async def handle_tool_call(self, tool_name: str, arguments: Dict) -> Dict:
        """Handle MCP tool call by routing to Antigravity."""
        logger.info(f"🔧 Tool call: {tool_name}")

        if tool_name == "antigravity_analyze":
            return await self.call_antigravity(
                "/api/code/analyze",
                "POST",
                {
                    "path": arguments.get("path", "."),
                    "depth": arguments.get("depth", 3),
                },
            )

        elif tool_name == "antigravity_execute":
            return await self.call_antigravity("/api/code/execute", "POST", arguments)

        elif tool_name == "antigravity_create_file":
            # Direct file creation without Claude
            import os

            path = arguments["path"]
            content = arguments["content"]

            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as f:
                f.write(content)

            logger.info(f"✅ Created file: {path}")
            return {"success": True, "path": path, "bytes": len(content)}

        elif tool_name == "antigravity_run_tests":
            import subprocess

            path = arguments.get("path", "backend/tests/")
            result = subprocess.run(
                [".venv/bin/python3", "-m", "pytest", path, "-v", "--tb=short"],
                capture_output=True,
                text=True,
                cwd="/Users/macbookprom1/mekong-cli",
            )
            return {
                "passed": result.returncode == 0,
                "output": result.stdout[-2000:]
                if result.stdout
                else result.stderr[-2000:],
            }

        elif tool_name == "antigravity_status":
            return await self.call_antigravity("/api/code/health")

        return {"error": f"Unknown tool: {tool_name}"}

    async def sse_handler(self, request):
        """Handle SSE connection from OpenCode."""
        logger.info("🔌 OpenCode connected via SSE")

        async with aiohttp_sse.sse_response(request) as resp:
            # Send initial tools list
            await resp.send(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "method": "tools/list",
                        "result": {"tools": self.tools},
                    }
                )
            )

            # Keep connection alive
            while True:
                await asyncio.sleep(30)
                await resp.send(
                    json.dumps(
                        {"type": "ping", "timestamp": datetime.now().isoformat()}
                    )
                )

    async def rpc_handler(self, request):
        """Handle JSON-RPC requests from OpenCode."""
        try:
            data = await request.json()
            method = data.get("method", "")
            params = data.get("params", {})

            logger.info(f"📨 RPC: {method}")

            if method == "tools/list":
                return web.json_response(
                    {
                        "jsonrpc": "2.0",
                        "id": data.get("id"),
                        "result": {"tools": self.tools},
                    }
                )

            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                result = await self.handle_tool_call(tool_name, arguments)

                return web.json_response(
                    {
                        "jsonrpc": "2.0",
                        "id": data.get("id"),
                        "result": {
                            "content": [
                                {"type": "text", "text": json.dumps(result, indent=2)}
                            ]
                        },
                    }
                )

            return web.json_response(
                {
                    "jsonrpc": "2.0",
                    "id": data.get("id"),
                    "error": {"code": -32601, "message": f"Unknown method: {method}"},
                }
            )

        except Exception as e:
            logger.error(f"RPC error: {e}")
            return web.json_response(
                {"jsonrpc": "2.0", "error": {"code": -32603, "message": str(e)}}
            )

    async def health_handler(self, request):
        """Health check endpoint."""
        return web.json_response(
            {
                "status": "healthy",
                "service": "antigravity-mcp",
                "port": self.port,
                "api_base": API_BASE,
            }
        )

    def setup_routes(self):
        """Setup HTTP routes."""
        self.app.router.add_get("/sse", self.sse_handler)
        self.app.router.add_post("/rpc", self.rpc_handler)
        self.app.router.add_get("/health", self.health_handler)

    async def cleanup(self, app):
        """Cleanup on shutdown."""
        if self.session:
            await self.session.close()

    def run(self):
        """Run the MCP server."""
        self.setup_routes()
        self.app.on_cleanup.append(self.cleanup)

        logger.info(f"🚀 Antigravity MCP Server starting on port {self.port}")
        logger.info(f"   SSE endpoint: http://localhost:{self.port}/sse")
        logger.info(f"   RPC endpoint: http://localhost:{self.port}/rpc")
        logger.info(f"   Routing to:   {API_BASE}")

        web.run_app(self.app, port=self.port, print=lambda x: None)


def main():
    server = AntigravityMCPServer(port=3333)
    server.run()


if __name__ == "__main__":
    main()
