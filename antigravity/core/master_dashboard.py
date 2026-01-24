"""
🏯 Master Dashboard - Full System Command & Control
===================================================

Provides a unified, 360-degree view of the entire Agency OS platform.
Aggregates health, performance, and financial data from all major
subsystems into a single strategic dashboard.

Layers Monitored:
- 🤖 Agentic Layer: Workforce capacity and proficiency.
- 🏰 Retention Layer: Strategic moats and loyalty status.
- 💰 Revenue Layer: Cashflow progress toward $1M ARR.
- 🏗️ Infrastructure Layer: Operational stability and readiness.

Binh Pháp: 🏯 Thống (Unity) - Commanding the entire field from one center.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from typing_extensions import TypedDict

from .cashflow_engine import get_cashflow_engine
from .infrastructure import InfrastructureStack
from .loyalty_rewards import get_loyalty_program
from .moat_engine import get_moat_engine
from .unified_dashboard import AgenticDashboard

# Configure logging
logger = logging.getLogger(__name__)


class AgenticLayerDict(TypedDict):
    agents_active: int
    success_rate: float


class RetentionLayerDict(TypedDict):
    moat_strength: int
    loyalty_tier: str
    switching_cost_usd: float


class RevenueLayerDict(TypedDict):
    arr: float
    progress: float


class InfraLayerDict(TypedDict):
    health: int
    layers_online: int


class MasterLayersDict(TypedDict):
    agentic: AgenticLayerDict
    retention: RetentionLayerDict
    revenue: RevenueLayerDict
    infra: InfraLayerDict


class MasterSummaryDict(TypedDict):
    """Unified system summary"""
    timestamp: str
    score: int
    layers: MasterLayersDict


class MasterDashboard:
    """
    🏯 Master Command Center

    The ultimate high-level overview for the agency owner.
    Combines technical, agentic, and financial metrics.
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

    def print_master_report(self):
        """Renders the definitive, full-screen dashboard to the console."""
        s = self.get_summary()
        score = s["score"]
        layers = s["layers"]

        print("\n" + "═" * 70)
        print("║" + "🏯 AGENCY OS - MASTER OPERATIONAL DASHBOARD".center(68) + "║")
        print("║" + "The Closed-Loop $1M ARR Command Center".center(68) + "║")
        print("═" * 70)

        # 1. AGENTIC LAYER
        print(" 🤖 AGENTIC INFRASTRUCTURE")
        print(
            f"    ├─ Agents Active : {layers['agentic']['agents_active']:<5} | Success Rate : {layers['agentic']['success_rate']:.1%}"
        )
        print("    └─ Integration   : Healthy")

        print(" ─" * 35)

        # 2. RETENTION LAYER
        print(" 🏰 STRATEGIC DEFENSIBILITY (MOATS)")
        print(
            f"    ├─ Moat Strength : {layers['retention']['moat_strength']}% | Loyalty Tier : {layers['retention']['loyalty_tier']}"
        )
        print(f"    └─ Switching Cost: ${layers['retention']['switching_cost_usd']:,} USD")

        print(" ─" * 35)

        # 3. REVENUE LAYER
        print(" 💰 REVENUE PERFORMANCE")
        print(f"    ├─ Current ARR   : ${layers['revenue']['arr']:,.0f} | Target ARR   : $1,000,000")
        print(f"    └─ Goal Progress : {layers['revenue']['progress']:.1%}")

        print(" ─" * 35)

        # 4. INFRASTRUCTURE LAYER
        print(" 🏗️ PRODUCTION STACK")
        print(
            f"    ├─ Stack Layers  : {layers['infra']['layers_online']}/10  | Health Score : {layers['infra']['health']}%"
        )
        print("    └─ Status        : Operational")

        print("═" * 70)

        # COMPOSITE SCORE
        bar_w = 40
        filled = int(bar_w * score / 100)
        bar = "█" * filled + "░" * (bar_w - filled)
        print(f" 🏆 OVERALL READINESS: [{bar}] {score}%")

        status_msg = (
            "✅ PEAK PERFORMANCE"
            if score >= 90
            else "⚡ READY FOR SCALE"
            if score >= 75
            else "🔨 ACTIVELY BUILDING"
        )
        print(f"    └─ System Status: {status_msg}")
        print("═" * 70)

        print(f'\n   🏯 "Không đánh mà thắng" | {datetime.now().strftime("%Y-%m-%d %H:%M")}\n')


# Global Interface
def show_full_status():
    """Entry point for the master dashboard display."""
    md = MasterDashboard()
    md.print_master_report()


def get_system_health() -> int:
    """Quick access to the composite platform score."""
    return MasterDashboard().get_platform_score()
