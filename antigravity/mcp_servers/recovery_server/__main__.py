"""
Recovery MCP Server
===================
Migrated from scripts/vibeos/auto_recovery.py
"""

from .server import RecoveryMCPServer

if __name__ == "__main__":
    server = RecoveryMCPServer()
    server.run()
