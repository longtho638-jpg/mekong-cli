"""
Security MCP Server
===================
Migrated from scripts/vibeos/security_armor.py
"""

from .server import SecurityMCPServer

if __name__ == "__main__":
    server = SecurityMCPServer()
    server.run()
