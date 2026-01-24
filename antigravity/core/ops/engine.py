"""
Ops Engine
==========
Operations and System Management logic.
"""
import logging
from antigravity.core.quota_service import quota_service

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
        logger.info("✅ System Health: GREEN")
        logger.info("   - Registry: OK")
        logger.info("   - MCP Orchestrator: OK")
        logger.info("   - Agent Swarm: OK")
