import asyncio
import json
import logging
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from antigravity.mcp.base import BaseMCPServer
from antigravity.mcp.types import MCPErrorCodes

class MockMCPServer(BaseMCPServer):
    def get_tools(self) -> List[Dict[str, Any]]:
        return [{"name": "mock_tool", "description": "A mock tool"}]

    async def handle_tool_call(self, name: str, arguments: Dict[str, Any]) -> Any:
        if name == "mock_tool":
            return "success"
        if name == "error_tool":
            raise ValueError("Tool failure")
        raise ValueError(f"Unknown tool: {name}")

@pytest.fixture
def server():
    return MockMCPServer(name="test_server")

@pytest.mark.asyncio
async def test_initialization(server):
    assert server.name == "test_server"
    assert server.version == "0.1.0"
    assert isinstance(server.logger, logging.Logger)

@pytest.mark.asyncio
async def test_handle_request_initialize(server):
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {}
    }
    response = await server.handle_request(request)
    assert response["jsonrpc"] == "2.0"
    assert response["id"] == 1
    assert "result" in response
    assert response["result"]["protocolVersion"] == "0.1.0"
    assert response["result"]["server"]["name"] == "test_server"

@pytest.mark.asyncio
async def test_handle_request_ping(server):
    request = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "ping"
    }
    response = await server.handle_request(request)
    assert response["result"] == "pong"

@pytest.mark.asyncio
async def test_handle_request_tools_list(server):
    request = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/list"
    }
    response = await server.handle_request(request)
    assert response["result"]["tools"] == [{"name": "mock_tool", "description": "A mock tool"}]

@pytest.mark.asyncio
async def test_handle_request_tool_call_success(server):
    request = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "mock_tool",
            "arguments": {}
        }
    }
    response = await server.handle_request(request)
    assert response["result"]["content"][0]["text"] == "success"

@pytest.mark.asyncio
async def test_handle_request_tool_call_unknown(server):
    request = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "tools/call",
        "params": {
            "name": "unknown_tool",
            "arguments": {}
        }
    }
    response = await server.handle_request(request)
    assert "error" in response
    assert response["error"]["code"] == MCPErrorCodes.INTERNAL_ERROR
    assert "Unknown tool" in response["error"]["message"]

@pytest.mark.asyncio
async def test_handle_request_tool_call_error(server):
    request = {
        "jsonrpc": "2.0",
        "id": 6,
        "method": "tools/call",
        "params": {
            "name": "error_tool",
            "arguments": {}
        }
    }
    response = await server.handle_request(request)
    assert "error" in response
    assert response["error"]["code"] == MCPErrorCodes.INTERNAL_ERROR
    assert "Tool failure" in response["error"]["message"]

@pytest.mark.asyncio
async def test_handle_request_method_not_found(server):
    request = {
        "jsonrpc": "2.0",
        "id": 7,
        "method": "non_existent_method"
    }
    response = await server.handle_request(request)
    assert "error" in response
    assert response["error"]["code"] == MCPErrorCodes.METHOD_NOT_FOUND

@pytest.mark.asyncio
async def test_handle_request_missing_tool_name(server):
    request = {
        "jsonrpc": "2.0",
        "id": 8,
        "method": "tools/call",
        "params": {}
    }
    response = await server.handle_request(request)
    assert "error" in response
    assert response["error"]["code"] == MCPErrorCodes.INTERNAL_ERROR
    assert "Tool name is required" in response["error"]["message"]
