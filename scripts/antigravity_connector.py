#!/usr/bin/env python3
"""
Antigravity API Connector - Using Antigravity API at localhost:8000/api/code
====================================================================

Connects to Antigravity API for all operations:
- File creation, reading, and management
- API calls with optimized tunnel
- Integration with viral-ready architecture
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from typing import Any, Dict

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import httpx
except ImportError:
    print("ERROR: httpx not installed. Run: pip install httpx")
    sys.exit(1)

try:
    from backend.api.tunnel import TunnelOptimizer
except ImportError:
    print("ERROR: TunnelOptimizer not found")
    sys.exit(1)

logger = logging.getLogger(__name__)


class AntigravityConnector:
    """Connector for Antigravity API operations."""

    def __init__(self, api_base: str = "http://localhost:8000/api/code"):
        self.api_base = api_base.rstrip("/")
        self.tunnel = TunnelOptimizer()

    async def call_antigravity_api(
        self, endpoint: str, method: str = "GET", data: Dict = None
    ) -> Dict[str, Any]:
        """Call Antigravity API with optimization."""
        try:
            result = await self.tunnel.request(
                method=method, endpoint=f"/api/code{endpoint}", data=data
            )
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_file(
        self, filepath: str, content: str, purpose: str = "general"
    ) -> Dict[str, Any]:
        """Create file using Antigravity API."""
        data = {
            "filepath": filepath,
            "content": content,
            "purpose": purpose,
            "timestamp": time.time(),
        }

        return await self.call_antigravity_api("/files/create", "POST", data)

    async def read_file(self, filepath: str) -> Dict[str, Any]:
        """Read file using Antigravity API."""
        return await self.call_antigravity_api(f"/files/read?path={filepath}")

    async def list_files(self, directory: str = ".") -> Dict[str, Any]:
        """List files using Antigravity API."""
        return await self.call_antigravity_api(f"/files/list?dir={directory}")

    async def get_tools(self) -> Dict[str, Any]:
        """Get available tools from Antigravity API."""
        return await self.call_antigravity_api("/tools")

    async def get_status(self) -> Dict[str, Any]:
        """Get Antigravity API status."""
        return await self.call_antigravity_api("/status")

    async def analyze_codebase(self, path: str = ".", depth: int = 3) -> Dict[str, Any]:
        """Analyze codebase using Antigravity API."""
        data = {"path": path, "depth": depth}
        return await self.call_antigravity_api("/analyze", "POST", data)


async def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description="Antigravity API Connector")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create file command
    create_parser = subparsers.add_parser("create", help="Create file")
    create_parser.add_argument("filepath", help="File path")
    create_parser.add_argument("--content", help="File content")
    create_parser.add_argument("--purpose", default="general", help="File purpose")

    # Read file command
    read_parser = subparsers.add_parser("read", help="Read file")
    read_parser.add_argument("filepath", help="File path")

    # List files command
    list_parser = subparsers.add_parser("list", help="List files")
    list_parser.add_argument("--dir", default=".", help="Directory to list")

    # Tools command
    tools_parser = subparsers.add_parser("tools", help="Get available tools")

    # Status command
    status_parser = subparsers.add_parser("status", help="Get API status")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze codebase")
    analyze_parser.add_argument("--path", default=".", help="Path to analyze")
    analyze_parser.add_argument("--depth", type=int, default=3, help="Analysis depth")

    # Execute command
    execute_parser = subparsers.add_parser("execute", help="Execute operation")
    execute_parser.add_argument("operation", help="Operation to execute")
    execute_parser.add_argument("--data", help="JSON data for operation")

    args = parser.parse_args()

    # Initialize connector
    connector = AntigravityConnector()

    # Execute command
    if args.command == "create":
        result = await connector.create_file(
            args.filepath, args.content or "", args.purpose
        )
        print(json.dumps(result, indent=2))

    elif args.command == "read":
        result = await connector.read_file(args.filepath)
        print(json.dumps(result, indent=2))

    elif args.command == "list":
        result = await connector.list_files(args.dir)
        print(json.dumps(result, indent=2))

    elif args.command == "tools":
        result = await connector.get_tools()
        print(json.dumps(result, indent=2))

    elif args.command == "status":
        result = await connector.get_status()
        print(json.dumps(result, indent=2))

    elif args.command == "analyze":
        result = await connector.analyze_codebase(args.path, args.depth)
        print(json.dumps(result, indent=2))

    elif args.command == "execute":
        try:
            data = json.loads(args.data) if args.data else {}
            result = await connector.call_antigravity_api(
                f"/execute/{args.operation}", "POST", data
            )
            print(json.dumps(result, indent=2))
        except json.JSONDecodeError:
            print(
                json.dumps({"success": False, "error": "Invalid JSON data"}, indent=2)
            )

    else:
        parser.print_help()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\nOperation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
