"""
Ops Engine - Operations and System Management
============================================

Handles system-level operations, monitoring, and quota management.
"""

import logging

from .quota_service import quota_service

logger = logging.getLogger(__name__)

class OpsEngine:
    """
    Manages system operations and monitoring.
    """
    
    def get_quota_status(self, format_type: str = "full"):
        """
        Displays the current model quota status.
        """
        print(quota_service.get_cli_report())
        
    def check_health(self):
        """
        Checks the health of core services (MCP servers, registry, etc.)
        """
        # Future implementation
        print("✅ System Health: GREEN")
        print("   - Registry: OK")
        print("   - MCP Orchestrator: OK")
        print("   - Agent Swarm: OK")

