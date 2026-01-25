"""
Example 3: Async Task Server
Demonstrates async operations and non-blocking behavior.
"""
import asyncio
from typing import Any, Dict, List
from antigravity.mcp.base import BaseMCPServer

class AsyncTaskMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("async-server")

    def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "simulate_long_task",
                "description": "Simulates a long running task",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "duration": {
                            "type": "number",
                            "description": "Duration in seconds"
                        }
                    },
                    "required": ["duration"]
                }
            },
            {
                "name": "fetch_dummy_data",
                "description": "Simulates fetching data from an API",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"}
                    }
                }
            }
        ]

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        if name == "simulate_long_task":
            duration = args.get("duration", 1)
            self.logger.info(f"Starting task for {duration} seconds...")

            # Non-blocking sleep
            await asyncio.sleep(duration)

            self.logger.info("Task completed")
            return f"Task completed after {duration} seconds"

        elif name == "fetch_dummy_data":
            item_id = args.get("id", 0)
            # Simulate network latency
            await asyncio.sleep(0.5)
            return {
                "id": item_id,
                "name": "Dummy Item",
                "status": "active"
            }

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = AsyncTaskMCPServer()
    server.run()
