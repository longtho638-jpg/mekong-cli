"""
Customer Success Facade and Dashboard.
"""
import logging

from .engine import CSMEngine
from .models import EngagementLevel, QBRRecord, SuccessPlan, SuccessStage

logger = logging.getLogger(__name__)

class CustomerSuccessManager(CSMEngine):
    """
    Customer Success Manager System.
    Orchestrates the success journey, quarterly reviews, and proactive relationship building.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"CSM System initialized for {agency_name}")

    def format_dashboard(self) -> str:
        """Render the CSM Dashboard."""
        avg_health = sum(p.health_score for p in self.success_plans.values()) / len(self.success_plans) if self.success_plans else 0.0
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 CUSTOMER SUCCESS DASHBOARD{' ' * 31}║",
            f"║  {len(self.success_plans)} success plans │ Avg Health: {avg_health:.0f}%{' ' * 23}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SUCCESS STAGE DISTRIBUTION                            ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        stage_icons = { SuccessStage.ONBOARDING: "👋", SuccessStage.ADOPTION: "📈", SuccessStage.VALUE_REALIZATION: "💎", SuccessStage.GROWTH: "🚀", SuccessStage.ADVOCACY: "⭐" }
        for stage in SuccessStage:
            count = sum(1 for p in self.success_plans.values() if p.stage == stage)
            lines.append(f"║  {stage_icons.get(stage, '📊')} {stage.value.replace('_', ' ').title():<25} │ {count:>3} clients        ║")

        lines.extend(["║                                                           ║", "║  👤 TOP CLIENT HEALTH                                     ║", "║  ───────────────────────────────────────────────────────  ║"])
        eng_icons = { EngagementLevel.CHAMPION: "⭐", EngagementLevel.ENGAGED: "🟢", EngagementLevel.PASSIVE: "🟡", EngagementLevel.DISENGAGED: "🔴" }
        top_plans = sorted(self.success_plans.values(), key=lambda x: x.health_score, reverse=True)[:4]
        for p in top_plans:
            lines.append(f"║  {eng_icons.get(p.engagement, '⚪')} {p.client_name[:18]:<18} │ {stage_icons.get(p.stage, '📊')} {p.stage.value[:12]:<12} │ {p.health_score:>3}%  ║")

        lines.extend([
            "║                                                           ║",
            "║  [📋 Plan]  [📊 QBR Prep]  [📈 Health]  [⚙️ Settings]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Partner!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
