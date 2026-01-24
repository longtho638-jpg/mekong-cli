"""
Dashboard Service
=================
Core logic for aggregating system metrics from various engines.
"""
import logging
from antigravity.core.cashflow_engine import get_cashflow_engine
from antigravity.core.infrastructure import InfrastructureStack
from antigravity.core.loyalty_rewards import get_loyalty_program
from antigravity.core.moat_engine import get_moat_engine
from antigravity.core.unified_dashboard import AgenticDashboard
from datetime import datetime

from .types import MasterSummaryDict

logger = logging.getLogger(__name__)


class MasterDashboardService:
    """
    Service layer for the Master Command Center.
    Aggregates data from subsystems.
    """

    def __init__(self):
        self.agentic = AgenticDashboard()
        self.moat_engine = get_moat_engine()
        self.loyalty_program = get_loyalty_program()
        self.cashflow_engine = get_cashflow_engine()
        self.infra_stack = InfrastructureStack()

    def get_platform_score(self) -> int:
        """Calculates a composite Readiness Score (0-100) for the platform."""
        # Retrieve component scores
        a_stats = self.agentic.get_stats()
        a_score = self.agentic._calculate_integration_score(a_stats)

        m_score = self.moat_engine.get_aggregate_strength()
        i_score = self.infra_stack.get_health_score()
        c_progress = min(100, self.cashflow_engine.get_progress_percent())

        # Weighted Aggregation
        # Agentic depth (30%) + Moat strength (25%) + Infra health (25%) + Revenue (20%)
        composite = a_score * 0.30 + m_score * 0.25 + i_score * 0.25 + c_progress * 0.20

        return int(composite)

    def get_summary(self) -> MasterSummaryDict:
        """Collects a flat dictionary of key indicators for programmatic use."""
        a_stats = self.agentic.get_stats()
        m_stats = self.moat_engine.calculate_switching_cost()

        return {
            "timestamp": datetime.now().isoformat(),
            "score": self.get_platform_score(),
            "layers": {
                "agentic": {
                    "agents_active": a_stats["inventory"]["agents"],
                    "success_rate": a_stats["cognition"]["success_rate"],
                },
                "retention": {
                    "moat_strength": self.moat_engine.get_aggregate_strength(),
                    "loyalty_tier": self.loyalty_program.get_current_tier().name,
                    "switching_cost_usd": m_stats["financial_usd"],
                },
                "revenue": {
                    "arr": self.cashflow_engine.get_total_arr(),
                    "progress": self.cashflow_engine.get_progress_percent(),
                },
                "infra": {
                    "health": self.infra_stack.get_health_score(),
                    "layers_online": len(self.infra_stack.layers),
                },
            },
        }
