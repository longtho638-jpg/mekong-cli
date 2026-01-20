"""
Sync MCP Server
===============
Migrated from scripts/vibeos/fe_be_sync.py
"""

from .server import SyncMCPServer

if __name__ == "__main__":
    server = SyncMCPServer()
    server.run()
