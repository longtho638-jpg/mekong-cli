# BaseMCPServer Migration Guide

This guide describes how to migrate existing functional MCP servers to the new `BaseMCPServer` class architecture.

## Why Migrate?

- **Standardization**: All servers behave consistently.
- **Robustness**: Error handling and logging are managed centrally.
- **Maintainability**: Removes boilerplate code (~50 lines per server).
- **Future-Proofing**: Updates to the protocol (e.g., new transports) only need to be implemented in the base class.

## Migration Checklist

1. [ ] Update imports to include `antigravity.mcp.base`.
2. [ ] Create a class inheriting from `BaseMCPServer`.
3. [ ] Move tool definitions to `get_tools()`.
4. [ ] Move tool execution logic to `handle_tool_call()`.
5. [ ] Remove old main loop, error handling, and logging setup.
6. [ ] Update `if __name__ == "__main__":` block to instantiate and run the class.

## Before vs. After

### Before (Old Pattern)

```python
# Old boilerplate style
import sys
import json
import logging
import asyncio

# Manual logging setup...
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger("my-server")

async def handle_tool_call(name, args):
    if name == "my_tool":
        return "result"
    raise ValueError("Unknown tool")

async def run_server():
    # Manual loop implementation...
    reader = asyncio.StreamReader()
    # ... connection setup ...
    while True:
        # ... read line ...
        # ... parse json ...
        # ... handle request ...
        # ... write response ...
        pass

if __name__ == "__main__":
    asyncio.run(run_server())
```

### After (New Pattern)

```python
# New class-based style
import asyncio
from typing import Any, Dict, List
from antigravity.mcp.base import BaseMCPServer

# Logic can be imported or implemented inline
from .handlers import MyHandler

class MyMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("my-server")
        self.handler = MyHandler()

    def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "my_tool",
                "description": "Does something",
                "inputSchema": {"type": "object", "properties": {}}
            }
        ]

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        if name == "my_tool":
             return self.handler.do_something()
        raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = MyMCPServer()
    server.run()
```

## Specific Changes

### 1. Error Handling
**Old**: You had to manually construct error dictionaries inside the loop or request handler.
**New**: Just `raise ValueError("message")` or any other exception. The base class automatically catches it and formats a standard JSON-RPC error response.

### 2. Logging
**Old**: Manual `logging.basicConfig` setup.
**New**: `self.logger` is pre-configured. Just use `self.logger.info()`.

### 3. Tool Listing
**Old**: Manually handling `if method == "tools/list": ...`.
**New**: Just return the list from `get_tools()`.

### 4. Initialization
**Old**: Manually handling `if method == "initialize": ...`.
**New**: Handled automatically.

## Backward Compatibility

The protocol exposed to clients (Claude, mcp-cli) remains exactly the same (JSON-RPC 2.0 over Stdio). Clients do not need any updates when you migrate the server implementation.
