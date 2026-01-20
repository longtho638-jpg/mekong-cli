"""
UI Checker MCP Server
=====================
Migrated from scripts/vibeos/ui_checker.py
"""

from .server import UIMCPServer

if __name__ == "__main__":
    server = UIMCPServer()
    server.run()
