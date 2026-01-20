"""
Registry MCP Catalog - Bridging MCP tools into the unified registry.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

CATALOG_PATH = Path(".claude/mcp-catalog.json")

class MCPToolCatalog:
    """
    Local cache of all available MCP tools across all installed servers.
    Includes server configuration for lazy-loading.
    """
    def __init__(self):
        self.data: Dict[str, Any] = self._load_catalog()
        self.tools = self.data.get("tools", {})
        self.servers = self.data.get("servers", {})

    def _load_catalog(self) -> Dict[str, Any]:
        if not CATALOG_PATH.exists():
            return {"tools": {}, "servers": {}}
        try:
            return json.loads(CATALOG_PATH.read_text())
        except Exception:
            return {"tools": {}, "servers": {}}

    def save_catalog(self):
        CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.data = {"tools": self.tools, "servers": self.servers}
        CATALOG_PATH.write_text(json.dumps(self.data, indent=2))

    def register_server(self, server_name: str, config: Dict[str, Any], tools_list: List[Dict[str, Any]]):
        """Registers a server and its tools."""
        self.servers[server_name] = config
        self.tools[server_name] = tools_list
        self.save_catalog()

    def get_server_config(self, server_name: str) -> Optional[Dict[str, Any]]:
        """Returns the execution config for a server."""
        return self.servers.get(server_name)

    def find_tool(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Finds a tool by name across all servers."""
        for server_name, tools in self.tools.items():
            for tool in tools:
                if tool["name"] == tool_name:
                    return {
                        "server": server_name,
                        "tool": tool
                    }
        return None

    def search_tools(self, query: str) -> List[Dict[str, Any]]:
        """Simple keyword search for tools."""
        results = []
        query = query.lower()
        for server_name, tools in self.tools.items():
            for tool in tools:
                if query in tool["name"].lower() or query in tool.get("description", "").lower():
                    results.append({
                        "server": server_name,
                        "tool": tool
                    })
        return results

# Global instance
mcp_catalog = MCPToolCatalog()
