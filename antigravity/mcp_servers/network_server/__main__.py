"""
Network Optimizer MCP Server
============================
Migrated from scripts/vibeos/network_optimizer.py
"""

from .server import NetworkMCPServer

if __name__ == "__main__":
    server = NetworkMCPServer()
    server.run()
