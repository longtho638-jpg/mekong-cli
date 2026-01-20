"""
Orchestrator MCP Server
=======================
Migrated from scripts/vibeos/orchestrator.py
"""

from .server import OrchestratorMCPServer

if __name__ == "__main__":
    server = OrchestratorMCPServer()
    server.run()
