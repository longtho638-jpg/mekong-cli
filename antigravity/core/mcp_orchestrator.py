"""
MCP Orchestrator - Lifecycle management for MCP servers.
Handles lazy-loading, process monitoring, and TTL-based termination.
Supports both Stdio and SSE transports.
"""
import asyncio
import json
import logging
import os
import subprocess
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import aiohttp
from typing_extensions import TypedDict, Union

from .registry.mcp_catalog import mcp_catalog

logger = logging.getLogger(__name__)


class MCPToolDefinition(TypedDict):
    """MCP tool metadata"""
    name: str
    description: str
    inputSchema: Dict[str, Any]


class MCPCallResult(TypedDict, total=False):
    """Result of an MCP tool call"""
    success: bool
    result: Any
    error: str


class MCPServerConfig(TypedDict, total=False):
    """Configuration for an MCP server"""
    type: str  # stdio, sse
    command: str
    args: List[str]
    env: Dict[str, str]
    url: str
    headers: Dict[str, str]


class BaseMCPProcess(ABC):
    """Abstract base class for MCP server processes."""
    def __init__(self, name: str, config: Union[MCPServerConfig, Dict[str, Any]]):
        self.name = name
        self.config = config
        self.last_used = time.time()
        self.lock = asyncio.Lock()

    @abstractmethod
    def is_alive(self) -> bool:
        pass

    @abstractmethod
    async def start(self) -> None:
        pass

    @abstractmethod
    async def stop(self) -> None:
        pass

    @abstractmethod
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> MCPCallResult:
        pass

    @abstractmethod
    async def list_tools(self) -> List[MCPToolDefinition]:
        pass


class StdioMCPProcess(BaseMCPProcess):
    """Manages a single MCP server process using Stdio transport."""
    def __init__(self, name: str, config: Union[MCPServerConfig, Dict[str, Any]]):
        super().__init__(name, config)
        self.process: Optional[subprocess.Popen] = None

    def is_alive(self) -> bool:
        return self.process is not None and self.process.poll() is None

    async def start(self) -> None:
        """Starts the MCP server process."""
        if self.is_alive():
            return

        command = self.config.get("command")
        if not command:
            logger.error(f"Missing command for stdio server {self.name}")
            return

        args = self.config.get("args", [])
        cmd = [command] + args
        env = os.environ.copy()
        env.update(self.config.get("env", {}))

        logger.info(f"🚀 Starting MCP Server (Stdio): {self.name} ({' '.join(cmd)})")
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

    async def stop(self) -> None:
        """Stops the MCP server process."""
        if self.process:
            logger.info(f"🛑 Stopping MCP Server: {self.name}")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None

    async def _send_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.is_alive():
            await self.start()

        request: Dict[str, Any] = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": method,
            "params": params or {}
        }

        try:
            if self.process and self.process.stdin:
                self.process.stdin.write(json.dumps(request) + "\n")
                self.process.stdin.flush()

                # Read response (assuming one line per JSON-RPC message)
                line = self.process.stdout.readline() if self.process.stdout else None
                if not line:
                    raise Exception(f"MCP Server {self.name} closed stdout unexpectedly")

                return json.loads(line)
            else:
                raise Exception(f"MCP Server {self.name} process or stdin not available")
        except Exception as e:
            logger.error(f"❌ Error sending request to {self.name}: {e}")
            raise

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> MCPCallResult:
        """Calls a tool using the stdio MCP protocol."""
        self.last_used = time.time()
        try:
            response = await self._send_request("tools/call", {
                "name": tool_name,
                "arguments": arguments
            })
            if "error" in response:
                logger.error(f"Tool call error from {self.name}.{tool_name}: {response['error']}")
                return {"success": False, "error": response["error"]}
            return {"success": True, "result": response.get("result")}
        except Exception as e:
            logger.error(f"Exception during call_tool {tool_name} on {self.name}: {e}")
            return {"success": False, "error": str(e)}

    async def list_tools(self) -> List[MCPToolDefinition]:
        try:
            response = await self._send_request("tools/list")
            return response.get("result", {}).get("tools", [])
        except Exception as e:
            logger.error(f"Failed to list tools for {self.name}: {e}")
            return []


class SSEMCPProcess(BaseMCPProcess):
    """Manages an MCP server connection using SSE transport."""
    def __init__(self, name: str, config: Union[MCPServerConfig, Dict[str, Any]]):
        super().__init__(name, config)
        self.session: Optional[aiohttp.ClientSession] = None
        self.post_url: Optional[str] = None
        self.sse_task: Optional[asyncio.Task] = None
        self._connected = False
        self._initialized = False

    def is_alive(self) -> bool:
        return self._connected and self.session is not None and not self.session.closed

    async def start(self) -> None:
        """Starts the SSE connection."""
        if self.is_alive():
            return

        url = self.config.get("url")
        headers = self.config.get("headers", {})

        logger.info(f"🚀 Connecting to MCP Server (SSE): {self.name} ({url})")
        self.session = aiohttp.ClientSession(headers=headers)

        # Start SSE listener in background to get the endpoint
        self.sse_task = asyncio.create_task(self._connect_sse(url))
        self.last_used = time.time()

        # Wait for endpoint to be resolved (timeout 5s)
        for _ in range(50):
            if self.post_url:
                break
            await asyncio.sleep(0.1)

        if self.post_url and not self._initialized:
            await self._initialize()

    async def _initialize(self) -> None:
        """Sends JSON-RPC initialize request."""
        try:
            request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "antigravity-orchestrator", "version": "1.0"}
                }
            }
            async with self.session.post(self.post_url, json=request) as resp:
                if resp.status < 400:
                    await self.session.post(self.post_url, json={
                        "jsonrpc": "2.0",
                        "method": "notifications/initialized"
                    })
                    self._initialized = True
                    logger.info(f"✅ Initialized SSE MCP Server: {self.name}")
        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")

    async def _connect_sse(self, url: str) -> None:
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.error(f"SSE connection failed for {self.name}: {response.status}")
                    return

                self._connected = True

                current_event = None
                current_data = []

                async for line in response.content:
                    line_str = line.decode('utf-8').strip()
                    if not line_str:
                        if current_event == "endpoint" and current_data:
                            endpoint = "\n".join(current_data)
                            self._resolve_endpoint(url, endpoint)
                        current_event = None
                        current_data = []
                        continue

                    if line_str.startswith("event:"):
                        current_event = line_str[6:].strip()
                    elif line_str.startswith("data:"):
                        current_data.append(line_str[5:].strip())

        except Exception as e:
            logger.error(f"SSE Error for {self.name}: {e}")
            self._connected = False

    def _resolve_endpoint(self, base_url: str, endpoint: str) -> None:
        if endpoint.startswith("http"):
            self.post_url = endpoint
        elif endpoint.startswith("/"):
            parsed = urlparse(base_url)
            base = f"{parsed.scheme}://{parsed.netloc}"
            self.post_url = base + endpoint
        else:
            # Handle relative path properly
            if base_url.endswith("/sse"):
                base_url = base_url[:-4]
            self.post_url = f"{base_url}/{endpoint}" if not base_url.endswith("/") else f"{base_url}{endpoint}"
        logger.info(f"✅ Resolved MCP endpoint for {self.name}: {self.post_url}")

    async def stop(self) -> None:
        """Stops the MCP server connection."""
        logger.info(f"🛑 Stopping MCP Server (SSE): {self.name}")
        if self.sse_task:
            self.sse_task.cancel()
        if self.session:
            await self.session.close()
        self._connected = False
        self.session = None
        self._initialized = False

    async def _send_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self.last_used = time.time()
        if not self.is_alive():
            await self.start()

        if not self.post_url:
             raise Exception("SSE endpoint not resolved")

        request = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000),
            "method": method,
            "params": params or {}
        }

        async with self.session.post(self.post_url, json=request) as resp:
            if resp.status >= 400:
                 text = await resp.text()
                 raise Exception(f"HTTP {resp.status}: {text}")
            return await resp.json()

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> MCPCallResult:
        try:
            response = await self._send_request("tools/call", {
                "name": tool_name,
                "arguments": arguments
            })
            if "error" in response:
                return {"success": False, "error": response["error"]}
            return {"success": True, "result": response.get("result")}
        except Exception as e:
            logger.error(f"Error calling tool {tool_name} on {self.name}: {e}")
            return {"success": False, "error": str(e)}

    async def list_tools(self) -> List[MCPToolDefinition]:
        try:
            response = await self._send_request("tools/list")
            return response.get("result", {}).get("tools", [])
        except Exception as e:
            logger.error(f"Failed to list tools for {self.name}: {e}")
            return []


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

# Global orchestrator
mcp_orchestrator = MCPOrchestrator()
