"""
Example 2: File System Server
Demonstrates error handling and logging.
"""
import asyncio
import os
from typing import Any, Dict, List
from antigravity.mcp.base import BaseMCPServer

class FileSystemMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("fs-server")
        # Restrict operations to a sandbox for safety
        self.sandbox_dir = "/tmp/mcp-sandbox"
        os.makedirs(self.sandbox_dir, exist_ok=True)

    def get_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "write_file",
                "description": "Write content to a file in sandbox",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filename": {"type": "string"},
                        "content": {"type": "string"}
                    },
                    "required": ["filename", "content"]
                }
            },
            {
                "name": "read_file",
                "description": "Read content from a file in sandbox",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filename": {"type": "string"}
                    },
                    "required": ["filename"]
                }
            }
        ]

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        filename = args.get("filename")
        if not filename or ".." in filename or filename.startswith("/"):
            # Raise ValueError maps to INVALID_PARAMS error code
            raise ValueError("Invalid filename")

        filepath = os.path.join(self.sandbox_dir, filename)

        try:
            if name == "write_file":
                content = args.get("content", "")
                with open(filepath, "w") as f:
                    f.write(content)
                self.logger.info(f"Wrote to file: {filename}")
                return f"Successfully wrote to {filename}"

            elif name == "read_file":
                if not os.path.exists(filepath):
                    raise FileNotFoundError(f"File not found: {filename}")

                with open(filepath, "r") as f:
                    content = f.read()
                self.logger.info(f"Read from file: {filename}")
                return content

            else:
                raise ValueError(f"Unknown tool: {name}")

        except Exception as e:
            # Log the full error internally
            self.logger.error(f"Operation failed: {e}")
            # Re-raise to let BaseMCPServer format the error response
            raise e

if __name__ == "__main__":
    server = FileSystemMCPServer()
    server.run()
