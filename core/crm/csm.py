"""
🎯 Customer Success Manager - Client Success Leadership
=========================================================

Drive client success and value realization.
Partner for client growth!

Roles:
- Value realization
- Success planning
- Executive relationships
- Advocacy development
"""

import uuid
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SuccessStage(Enum):
    """Client success lifecycle stages."""
    ONBOARDING = "onboarding"
    ADOPTION = "adoption"
    VALUE_REALIZATION = "value_realization"
    GROWTH = "growth"
    ADVOCACY = "advocacy"


class EngagementLevel(Enum):
    """Client engagement categories."""
    CHAMPION = "champion"
    ENGAGED = "engaged"
    PASSIVE = "passive"
    DISENGAGED = "disengaged"


@dataclass
class SuccessPlan:
    """A strategic success roadmap for a client."""
    id: str
    client_name: str
    csm: str
    stage: SuccessStage
    goals: List[str]
    milestones: List[str]
    risks: List[str]
    engagement: EngagementLevel
    health_score: int = 80
    nps_score: Optional[int] = None

    def __post_init__(self):
        if not 0 <= self.health_score <= 100:
            raise ValueError("Health score must be between 0 and 100")


@dataclass
class QBRRecord:
    """A record of a Quarterly Business Review meeting."""
    id: str
    client_name: str
    date: datetime
    achievements: List[str]
    challenges: List[str]
    next_quarter_goals: List[str]
    satisfaction: int


class CustomerSuccessManager:
    """
    Customer Success Manager System.
    
    Orchestrates the success journey, quarterly reviews, and proactive relationship building.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.success_plans: Dict[str, SuccessPlan] = {}
        self.qbrs: List[QBRRecord] = []
        logger.info(f"CSM System initialized for {agency_name}")

    def create_success_plan(
        self,
        client_name: str,
        csm: str,
        goals: List[str],
        milestones: List[str]
    ) -> SuccessPlan:
        """Create a new strategic success plan."""
        if not client_name or not csm:
            raise ValueError("Client and CSM names are required")

        plan = SuccessPlan(
            id=f"CSP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            csm=csm,
            stage=SuccessStage.ONBOARDING,
            goals=goals,
            milestones=milestones,
            risks=[],
            engagement=EngagementLevel.ENGAGED
        )
        self.success_plans[plan.id] = plan
        logger.info(f"Success plan created for {client_name} (CSM: {csm})")
        return plan

    def advance_stage(self, plan_id: str) -> bool:
        """Move a client to the next stage in their success journey."""
        if plan_id not in self.success_plans:
            return False

        plan = self.success_plans[plan_id]
        stages = list(SuccessStage)
        current_idx = stages.index(plan.stage)
        if current_idx < len(stages) - 1:
            plan.stage = stages[current_idx + 1]
            logger.info(f"Stage advanced for {plan.client_name}: {plan.stage.value}")
            return True
        return False

    def record_qbr(
        self,
        client_name: str,
        achievements: List[str],
        challenges: List[str],
        next_goals: List[str],
        satisfaction: int
    ) -> QBRRecord:
        """Log the outcome of a Quarterly Business Review."""
        qbr = QBRRecord(
            id=f"QBR-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            date=datetime.now(),
            achievements=achievements,
            challenges=challenges,
            next_quarter_goals=next_goals,
            satisfaction=satisfaction
        )
        self.qbrs.append(qbr)
        logger.info(f"QBR recorded for {client_name}")
        return qbr

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

        stage_icons = {
            SuccessStage.ONBOARDING: "👋", SuccessStage.ADOPTION: "📈",
            SuccessStage.VALUE_REALIZATION: "💎", SuccessStage.GROWTH: "🚀",
            SuccessStage.ADVOCACY: "⭐"
        }

        for stage in SuccessStage:
            count = sum(1 for p in self.success_plans.values() if p.stage == stage)
            icon = stage_icons.get(stage, "📊")
            lines.append(f"║  {icon} {stage.value.replace('_', ' ').title():<25} │ {count:>3} clients        ║")

        lines.extend([
            "║                                                           ║",
            "║  👤 TOP CLIENT HEALTH                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        eng_icons = {
            EngagementLevel.CHAMPION: "⭐", EngagementLevel.ENGAGED: "🟢",
            EngagementLevel.PASSIVE: "🟡", EngagementLevel.DISENGAGED: "🔴"
        }

        # Display top 4 healthy clients
        top_plans = sorted(self.success_plans.values(), key=lambda x: x.health_score, reverse=True)[:4]
        for p in top_plans:
            e_icon = eng_icons.get(p.engagement, "⚪")
            s_icon = stage_icons.get(p.stage, "📊")
            name_disp = (p.client_name[:18] + '..') if len(p.client_name) > 20 else p.client_name
            lines.append(f"║  {e_icon} {name_disp:<18} │ {s_icon} {p.stage.value[:12]:<12} │ {p.health_score:>3}%  ║")

        lines.extend([
            "║                                                           ║",
            "║  [📋 Plan]  [📊 QBR Prep]  [📈 Health]  [⚙️ Settings]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Partner!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Customer Success Manager...")
    print("=" * 60)

    try:
        csm_system = CustomerSuccessManager("Saigon Digital Hub")

        # Create plans
        p1 = csm_system.create_success_plan("Sunrise Realty", "Alex", ["SEO +50%"], ["Audit"])
        p1.stage = SuccessStage.VALUE_REALIZATION
        p1.engagement = EngagementLevel.CHAMPION
        p1.health_score = 92

        csm_system.create_success_plan("Coffee Lab", "Sarah", ["Brand Growth"], ["Guide"])

        print("\n" + csm_system.format_dashboard())

    except Exception as e:
        logger.error(f"CSM Error: {e}")
