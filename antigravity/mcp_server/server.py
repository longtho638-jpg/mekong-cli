"""
Antigravity MCP Server Implementation.
"""

import logging
from typing import Any, Dict, List

from .handlers import (
    handle_add_lead,
    handle_antigravity_status,
    handle_generate_content,
    handle_get_agency_dna,
    handle_get_revenue_metrics,
    handle_get_vc_score,
    handle_win_win_win_check,
)
from .models import MCPResponse
from .tools import get_tools

logger = logging.getLogger(__name__)

# Import Antigravity modules
try:
    from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone
    from antigravity.core.client_magnet import ClientMagnet
    from antigravity.core.content_factory import ContentFactory
    from antigravity.core.revenue_engine import RevenueEngine
    from antigravity.franchise.manager import FranchiseManager
    from antigravity.platform.data_moat import DataMoat
    from antigravity.vc.metrics import VCMetrics

    HAS_ANTIGRAVITY = True
except ImportError:
    HAS_ANTIGRAVITY = False
    logger.warning("⚠️ Antigravity modules not available")


class AntigravityMCPServer:
    """
    🏯 Antigravity MCP Server

    Exposes all Antigravity capabilities via Model Context Protocol.
    """

    def __init__(self):
        self.name = "antigravity"
        self.version = "0.1.0"
        self.has_antigravity = HAS_ANTIGRAVITY

        # Initialize Antigravity modules if available
        if HAS_ANTIGRAVITY:
            self.dna = AgencyDNA(
                name="Agency OS",
                tone=Tone.PROFESSIONAL,
                tier=PricingTier.PROFESSIONAL,
            )
            self.magnet = ClientMagnet()
            self.engine = RevenueEngine()
            self.factory = ContentFactory()
            self.franchise = FranchiseManager()
            self.metrics = VCMetrics()
            self.moat = DataMoat()
        else:
            self.dna = None
            self.magnet = None
            self.engine = None
            self.factory = None
            self.franchise = None
            self.metrics = None
            self.moat = None

    def get_tools(self) -> List[Dict[str, Any]]:
        """Return list of available MCP tools."""
        return get_tools()

    async def handle_tool(self, name: str, arguments: Dict[str, Any]) -> MCPResponse:
        """Handle tool invocation."""

        handlers = {
            "antigravity_status": handle_antigravity_status,
            "get_agency_dna": handle_get_agency_dna,
            "get_revenue_metrics": handle_get_revenue_metrics,
            "get_vc_score": handle_get_vc_score,
            "generate_content": handle_generate_content,
            "add_lead": handle_add_lead,
            "win_win_win_check": handle_win_win_win_check,
        }

        handler = handlers.get(name)
        if handler:
            return await handler(self, arguments)

        return MCPResponse(success=False, data=None, message=f"Unknown tool: {name}")
