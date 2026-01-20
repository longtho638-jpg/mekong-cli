"""
MCP Orchestrator - Lifecycle management for MCP servers.
Handles lazy-loading, process monitoring, and TTL-based termination.
"""
import asyncio
import json
import logging
import subprocess
import time
from typing import Any, Dict, List, Optional
from pathlib import Path

from .registry.mcp_catalog import mcp_catalog

logger = logging.getLogger(__name__)

class MCPProcess:
    """Manages a single MCP server process."""
    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.process: Optional[subprocess.Popen] = None
        self.last_used = time.time()
        self.lock = asyncio.Lock()

    def is_alive(self) -> bool:
        return self.process is not None and self.process.poll() is None

    async def start(self):
        """Starts the MCP server process."""
        if self.is_alive():
            return

        cmd = [self.config["command"]] + self.config["args"]
        env = self.config.get("env", {})

        logger.info(f"🚀 Starting MCP Server: {self.name} ({' '.join(cmd)})")
        self.process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            bufsize=1
        )
        self.last_used = time.time()

    async def stop(self):
        """Stops the MCP server process."""
        if self.process:
            logger.info(f"🛑 Stopping MCP Server: {self.name}")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Calls a tool using the stdio MCP protocol."""
        self.last_used = time.time()
        if not self.is_alive():
            await self.start()

        # Simple JSON-RPC over stdio for MCP
        request = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }

        try:
            self.process.stdin.write(json.dumps(request) + "\n")
            self.process.stdin.flush()

            # Read response (assuming one line per JSON-RPC message)
            line = self.process.stdout.readline()
            if not line:
                raise Exception(f"MCP Server {self.name} closed stdout unexpectedly")

            response = json.loads(line)
            if "error" in response:
                return {"success": False, "error": response["error"]}
            return {"success": True, "result": response.get("result")}

        except Exception as e:
            logger.error(f"❌ Error calling tool {tool_name} on {self.name}: {e}")
            return {"success": False, "error": str(e)}

class MCPOrchestrator:
    """
    Central manager for all active MCP processes.
    Enforces TTL and resource limits.
    """
    def __init__(self, ttl_seconds: int = 300):
        self.processes: Dict[str, MCPProcess] = {}
        self.ttl = ttl_seconds
        self._monitor_task = None

    async def get_process(self, server_name: str) -> Optional[MCPProcess]:
        """Retrieves or creates a process for the given server."""
        if server_name in self.processes:
            return self.processes[server_name]

        config = mcp_catalog.get_server_config(server_name)
        if not config:
            logger.error(f"Unknown MCP server: {server_name}")
            return None

        proc = MCPProcess(server_name, config)
        self.processes[server_name] = proc
        return proc

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Resolves tool to server and executes it."""
        tool_info = mcp_catalog.find_tool(tool_name)
        if not tool_info:
            return {"success": False, "error": f"Tool {tool_name} not found in catalog"}

        server_name = tool_info["server"]
        proc = await self.get_process(server_name)
        if not proc:
            return {"success": False, "error": f"Failed to start server {server_name}"}

        return await proc.call_tool(tool_name, arguments)

    async def cleanup_idle(self):
        """Reaps processes that have been idle past the TTL."""
        now = time.time()
        to_remove = []
        for name, proc in self.processes.items():
            if proc.is_alive() and (now - proc.last_used) > self.ttl:
                await proc.stop()
                to_remove.append(name)

        for name in to_remove:
            # We keep the object in registry but it's stopped
            pass

    def start_monitoring(self):
        """Starts the background TTL monitor."""
        if self._monitor_task is None:
            self._monitor_task = asyncio.create_task(self._monitor_loop())

    async def _monitor_loop(self):
        while True:
            await asyncio.sleep(60) # Check every minute
            await self.cleanup_idle()

# Global orchestrator
mcp_orchestrator = MCPOrchestrator()
