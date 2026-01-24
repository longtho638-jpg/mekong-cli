"""
MCP Orchestrator Engine
=======================
Central management logic for MCP processes, TTL monitoring, and tool routing.
"""
import asyncio
import logging
import time
from antigravity.core.registry.mcp_catalog import mcp_catalog
from typing import Any, Dict, List, Optional

from .process import BaseMCPProcess, SSEMCPProcess, StdioMCPProcess
from .types import MCPCallResult, MCPToolDefinition

logger = logging.getLogger(__name__)


class MCPOrchestrator:
    """
    Central manager for all active MCP processes.
    Enforces TTL and resource limits.
    """
    def __init__(self, ttl_seconds: int = 300, max_concurrent: int = 10):
        self.processes: Dict[str, BaseMCPProcess] = {}
        self.ttl = ttl_seconds
        self.max_concurrent = max_concurrent
        self._monitor_task: Optional[asyncio.Task] = None

    async def get_process(self, server_name: str) -> Optional[BaseMCPProcess]:
        """Retrieves or creates a process for the given server."""
        if server_name not in self.processes:
            config = mcp_catalog.get_server_config(server_name)
            if not config:
                logger.error(f"Unknown MCP server: {server_name}")
                return None

            # Factory logic
            if config.get("type") == "sse":
                self.processes[server_name] = SSEMCPProcess(server_name, config)
            else:
                self.processes[server_name] = StdioMCPProcess(server_name, config)

        proc = self.processes[server_name]

        if not proc.is_alive():
            # Enforce max concurrency limit (LRU eviction) before starting
            active_processes = [p for p in self.processes.values() if p.is_alive()]
            while len(active_processes) >= self.max_concurrent:
                # Sort by last_used and stop the oldest one
                oldest = sorted(active_processes, key=lambda p: p.last_used)[0]
                logger.info(f"♻️ Max concurrent servers reached ({self.max_concurrent}). Evicting {oldest.name}")
                await oldest.stop()
                active_processes = [p for p in self.processes.values() if p.is_alive()]

            await proc.start()

        return proc

    async def probe_server(self, server_name: str) -> List[MCPToolDefinition]:
        """Starts a server briefly to list its tools."""
        proc = await self.get_process(server_name)
        if not proc:
            return []

        try:
            tools = await proc.list_tools()
            mcp_catalog.mark_probed(server_name, tools)
            return tools
        except Exception as e:
            logger.error(f"Failed to probe server {server_name}: {e}")
            return []

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> MCPCallResult:
        """Resolves tool to server and executes it."""
        tool_info = mcp_catalog.find_tool(tool_name)
        if not tool_info:
            return {"success": False, "error": f"Tool {tool_name} not found in catalog"}

        server_name = tool_info["server"]
        proc = await self.get_process(server_name)
        if not proc:
            return {"success": False, "error": f"Failed to start server {server_name}"}

        return await proc.call_tool(tool_name, arguments)

    async def cleanup_idle(self) -> None:
        """Reaps processes that have been idle past the TTL."""
        now = time.time()
        for _, proc in self.processes.items():
            if proc.is_alive() and (now - proc.last_used) > self.ttl:
                await proc.stop()

    def start_monitoring(self) -> None:
        """Starts the background TTL monitor."""
        if self._monitor_task is None:
            self._monitor_task = asyncio.create_task(self._monitor_loop())

    async def _monitor_loop(self) -> None:
        while True:
            await asyncio.sleep(60) # Check every minute
            await self.cleanup_idle()
