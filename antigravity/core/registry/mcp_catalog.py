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
        self.metadata = self.data.get("metadata", {})

    def _load_catalog(self) -> Dict[str, Any]:
        if not CATALOG_PATH.exists():
            return {"tools": {}, "servers": {}, "metadata": {}}
        try:
            return json.loads(CATALOG_PATH.read_text())
        except Exception:
            return {"tools": {}, "servers": {}, "metadata": {}}

    def save_catalog(self):
        CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.data = {
            "tools": self.tools,
            "servers": self.servers,
            "metadata": self.metadata
        }
        CATALOG_PATH.write_text(json.dumps(self.data, indent=2))

    def register_server(self, server_name: str, config: Dict[str, Any], tools_list: Optional[List[Dict[str, Any]]] = None):
        """Registers a server and its tools. If tools_list is None, marks as unprobed."""
        self.servers[server_name] = config

        if tools_list is not None:
            self.tools[server_name] = tools_list
            self.metadata[server_name] = {"probed": True, "last_probed": json.dumps(str(Path.cwd()))} # Store context
        else:
            if server_name not in self.tools:
                self.tools[server_name] = []
            self.metadata[server_name] = {"probed": False}

        self.save_catalog()

    def get_unprobed_servers(self) -> List[str]:
        """Returns a list of servers that haven't been probed for tools yet."""
        return [
            name for name, meta in self.metadata.items()
            if not meta.get("probed", False)
        ]

    def mark_probed(self, server_name: str, tools_list: List[Dict[str, Any]]):
        """Updates a server with its discovered tools."""
        if server_name in self.servers:
            self.tools[server_name] = tools_list
            self.metadata[server_name] = {"probed": True}
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
