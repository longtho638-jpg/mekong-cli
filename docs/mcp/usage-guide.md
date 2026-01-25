# BaseMCPServer Usage Guide

This guide explains how to use the `BaseMCPServer` class to create robust, standardized Model Context Protocol (MCP) servers in the Antigravity ecosystem.

## Quick Start

The `BaseMCPServer` simplifies MCP server creation by handling the low-level JSON-RPC 2.0 protocol, error management, and logging. You only need to define your tools and their implementation.

### 1. Import the Base Class

```python
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List
```

### 2. Subclass BaseMCPServer

Create a new class that inherits from `BaseMCPServer`. You must implement two abstract methods:
- `get_tools()`: Returns the tool definitions.
- `handle_tool_call()`: Executes the logic for tool calls.

### 3. Implement the Server

```python
import asyncio
from typing import Any, Dict, List
from antigravity.mcp.base import BaseMCPServer

class MyFirstMCPServer(BaseMCPServer):
    def __init__(self):
        # Initialize with a server name
        super().__init__("my-first-server")

    def get_tools(self) -> List[Dict[str, Any]]:
        # Define available tools using JSON Schema
        return [
            {
                "name": "hello_world",
                "description": "Returns a greeting",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name to greet"
                        }
                    },
                    "required": ["name"]
                }
            }
        ]

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        # Route tool execution
        if name == "hello_world":
            user_name = args.get("name")
            return f"Hello, {user_name}!"
        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    # Run the server
    server = MyFirstMCPServer()
    server.run()
```

## Core Concepts

### Tool Definitions
Tools are defined as a list of dictionaries following the MCP schema structure. Each tool must have:
- `name`: Unique identifier for the tool.
- `description`: A clear explanation of what the tool does.
- `inputSchema`: A JSON Schema object defining the expected arguments.

### Request Handling
The base class automatically handles:
- **`initialize`**: Returns server capabilities and version.
- **`ping`**: Returns "pong" for health checks.
- **`tools/list`**: Returns the list of tools defined in `get_tools()`.
- **`tools/call`**: Validates the request and delegates to `handle_tool_call()`.

### Error Handling
Throw standard Python exceptions in your handler. The base class catches them and converts them to standard JSON-RPC error responses with appropriate codes:

- `ValueError` → `INVALID_PARAMS` (-32602)
- Other Exceptions → `INTERNAL_ERROR` (-32603)

### Logging
Use `self.logger` for logging. The base class configures structured logging to `stderr` (since `stdout` is used for protocol communication).

```python
self.logger.info("Processing request...")
self.logger.error("Something went wrong")
```

## Running the Server

The standard way to run an MCP server is via Stdio (Standard Input/Output).

```python
if __name__ == "__main__":
    server = MyServer()
    server.run() # Defaults to transport="stdio"
```

This allows the server to be piped into other tools or run by an MCP client (like Claude Desktop or the `mcp-cli`).

## Best Practices

1.  **Keep Handlers Thin**: Delegate complex logic to separate handler classes or service modules (e.g., `self.handler = MyBusinessLogic()`).
2.  **Type Hinting**: Always use type hints for arguments and return values.
3.  **Validation**: Validate arguments inside your `handle_tool_call` or business logic, raising `ValueError` if invalid.
4.  **Async**: The server is async-native. Use `await` for I/O bound operations.
