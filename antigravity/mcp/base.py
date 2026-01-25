"""
Base MCP Server Implementation.
Provides foundation for all Antigravity MCP servers.
"""
import asyncio
import json
import logging
import sys
import traceback
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union

from .types import JSONRPCError, MCPErrorCodes


class BaseMCPServer(ABC):
    """
    Base class for Model Context Protocol (MCP) servers.
    Handles connection, routing, error handling, and logging.
    """

    def __init__(self, name: str, version: str = "0.1.0"):
        self.name = name
        self.version = version
        self.logger = logging.getLogger(name)
        self._setup_logging()
        self._tools: List[Dict[str, Any]] = []

    def _setup_logging(self) -> None:
        """Configure structured logging to stderr (std interface compliance)."""
        handler = logging.StreamHandler(sys.stderr)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    @abstractmethod
    def get_tools(self) -> List[Dict[str, Any]]:
        """Return list of available tools. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def handle_tool_call(self, name: str, arguments: Dict[str, Any]) -> Any:
        """Execute a tool. Must be implemented by subclasses."""
        pass

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Route and handle JSON-RPC 2.0 requests."""
        msg_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        response = {"jsonrpc": "2.0", "id": msg_id}

        try:
            if method == "tools/list":
                response["result"] = {"tools": self.get_tools()}

            elif method == "tools/call":
                tool_name = params.get("name")
                args = params.get("arguments", {})
                if not tool_name:
                    raise ValueError("Tool name is required")

                result = await self.handle_tool_call(tool_name, args)
                response["result"] = {"content": [{"type": "text", "text": str(result)}]}

            elif method == "ping":
                response["result"] = "pong"

            elif method == "initialize":
                 response["result"] = {
                    "protocolVersion": "0.1.0",
                    "server": {"name": self.name, "version": self.version},
                    "capabilities": {"tools": {}}
                }

            else:
                response["error"] = JSONRPCError(
                    code=MCPErrorCodes.METHOD_NOT_FOUND,
                    message=f"Method not found: {method}"
                ).to_dict()

        except Exception as e:
            self.logger.error(f"Error processing {method}: {e}")
            self.logger.debug(traceback.format_exc())
            response["error"] = JSONRPCError(
                code=MCPErrorCodes.INTERNAL_ERROR,
                message=str(e),
                data={"traceback": traceback.format_exc()}
            ).to_dict()

        return response

    async def run_stdio(self) -> None:
        """Run the server using Standard I/O (default for MCP)."""
        self.logger.info(f"{self.name} v{self.version} started (stdio)")

        loop = asyncio.get_event_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        while True:
            try:
                line = await reader.readline()
                if not line:
                    break

                request = json.loads(line)
                response = await self.handle_request(request)

                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()

            except json.JSONDecodeError:
                error_resp = {
                    "jsonrpc": "2.0",
                    "error": JSONRPCError(
                        code=MCPErrorCodes.PARSE_ERROR,
                        message="Invalid JSON"
                    ).to_dict(),
                    "id": None
                }
                sys.stdout.write(json.dumps(error_resp) + "\n")
                sys.stdout.flush()
            except Exception as e:
                self.logger.critical(f"Fatal error in loop: {e}")
                break

    def run(self, transport: str = "stdio") -> None:
        """Entry point to run the server."""
        if transport == "stdio":
            asyncio.run(self.run_stdio())
        elif transport == "http":
            raise NotImplementedError("HTTP transport not yet implemented")
        elif transport == "websocket":
            raise NotImplementedError("WebSocket transport not yet implemented")
        else:
            raise ValueError(f"Unknown transport: {transport}")
