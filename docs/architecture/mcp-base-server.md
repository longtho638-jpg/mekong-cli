# Base MCP Server Architecture

**Version**: 1.0.0
**Date**: 2026-01-25
**Package**: `antigravity.mcp`

## Overview

The `BaseMCPServer` provides a robust, production-ready foundation for all Antigravity Model Context Protocol (MCP) servers. It standardizes connection handling, message routing, error management, and logging across the 14+ MCP servers in the AgencyOS ecosystem.

## Key Components

### 1. Base Class (`antigravity/mcp/base.py`)

The `BaseMCPServer` abstract base class enforces a consistent structure for all server implementations.

```python
from antigravity.mcp.base import BaseMCPServer

class MyServer(BaseMCPServer):
    def get_tools(self):
        return [...]

    async def handle_tool_call(self, name, args):
        # Implementation
        pass
```

### 2. Type Definitions (`antigravity/mcp/types.py`)

Standardized JSON-RPC 2.0 data models and error codes.

- `JSONRPCRequest`: Typed request structure
- `JSONRPCResponse`: Typed response structure
- `JSONRPCError`: Standard error format
- `MCPErrorCodes`: Standardized error codes (e.g., `METHOD_NOT_FOUND`, `INTERNAL_ERROR`)

## Features

### Connection Handling
- **Stdio**: Native support for standard input/output communication (default for MCP).
- **Extensible**: Architecture supports adding HTTP/WebSocket transports in the future.

### Message Routing
- Automatic routing of JSON-RPC 2.0 messages.
- Built-in handlers for:
  - `initialize`: Protocol handshake
  - `ping`: Health check
  - `tools/list`: Discovery
  - `tools/call`: Execution

### Error Handling
- Graceful exception catching and formatting.
- Detailed traceback logging (debug level).
- Standardized JSON-RPC error responses.

### Logging
- Structured logging to `stderr` (keeping `stdout` clean for protocol messages).
- Context-aware loggers using server names.

## Usage Guide

To create a new MCP server:

1. **Inherit** from `BaseMCPServer`.
2. **Implement** `get_tools()` to define capabilities.
3. **Implement** `handle_tool_call()` to execute logic.
4. **Run** using `server.run()`.

### Example

```python
from antigravity.mcp.base import BaseMCPServer

class EchoServer(BaseMCPServer):
    def get_tools(self):
        return [{
            "name": "echo",
            "description": "Echoes input back",
            "inputSchema": {
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"]
            }
        }]

    async def handle_tool_call(self, name, arguments):
        if name == "echo":
            return arguments["text"]
        raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = EchoServer("echo-server")
    server.run()
```

## Testing

The base server includes comprehensive unit tests covering:
- Initialization
- Request routing
- Tool execution
- Error scenarios
- Protocol compliance

Run tests with:
```bash
pytest antigravity/mcp/tests/
```
