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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class SuccessStage(Enum):
    """Client success stages."""
    ONBOARDING = "onboarding"
    ADOPTION = "adoption"
    VALUE_REALIZATION = "value_realization"
    GROWTH = "growth"
    ADVOCACY = "advocacy"


class EngagementLevel(Enum):
    """Client engagement level."""
    CHAMPION = "champion"
    ENGAGED = "engaged"
    PASSIVE = "passive"
    DISENGAGED = "disengaged"


@dataclass
class SuccessPlan:
    """Client success plan."""
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


@dataclass
class QBRRecord:
    """Quarterly Business Review."""
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
    
    Drive client success.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.success_plans: Dict[str, SuccessPlan] = {}
        self.qbrs: List[QBRRecord] = []
    
    def create_success_plan(
        self,
        client_name: str,
        csm: str,
        goals: List[str],
        milestones: List[str]
    ) -> SuccessPlan:
        """Create success plan."""
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
        return plan
    
    def advance_stage(self, plan: SuccessPlan):
        """Advance to next stage."""
        stages = list(SuccessStage)
        current_idx = stages.index(plan.stage)
        if current_idx < len(stages) - 1:
            plan.stage = stages[current_idx + 1]
    
    def record_qbr(
        self,
        client_name: str,
        achievements: List[str],
        challenges: List[str],
        next_goals: List[str],
        satisfaction: int
    ) -> QBRRecord:
        """Record a QBR."""
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
        return qbr
    
    def get_by_stage(self, stage: SuccessStage) -> List[SuccessPlan]:
        """Get plans by stage."""
        return [p for p in self.success_plans.values() if p.stage == stage]
    
    def format_dashboard(self) -> str:
        """Format CSM dashboard."""
        avg_health = sum(p.health_score for p in self.success_plans.values()) / len(self.success_plans) if self.success_plans else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 CUSTOMER SUCCESS MANAGER                              ║",
            f"║  {len(self.success_plans)} clients │ Avg Health: {avg_health:.0f}%                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SUCCESS JOURNEY                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        stage_icons = {"onboarding": "👋", "adoption": "📈", "value_realization": "💎", "growth": "🚀", "advocacy": "⭐"}
        
        for stage in SuccessStage:
            plans = self.get_by_stage(stage)
            icon = stage_icons.get(stage.value, "📊")
            lines.append(f"║  {icon} {stage.value.replace('_', ' ').title():<25} │ {len(plans):>3} clients        ║")
        
        lines.extend([
            "║                                                           ║",
            "║  👤 MY CLIENTS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        engagement_icons = {"champion": "⭐", "engaged": "🟢", "passive": "🟡", "disengaged": "🔴"}
        
        for plan in sorted(self.success_plans.values(), key=lambda x: x.health_score, reverse=True)[:4]:
            eng_icon = engagement_icons.get(plan.engagement.value, "⚪")
            stage_icon = stage_icons.get(plan.stage.value, "📊")
            
            lines.append(f"║  {eng_icon} {plan.client_name[:18]:<18} │ {stage_icon} {plan.stage.value[:12]:<12} │ {plan.health_score}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📅 UPCOMING QBRs                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📋 Sunrise Realty - Next week                         ║",
            "║    📋 Coffee Lab - In 2 weeks                            ║",
            "║                                                           ║",
            "║  [📋 Success Plan]  [📊 QBR Prep]  [📈 Health Check]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Partner for success!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    csm = CustomerSuccessManager("Saigon Digital Hub")
    
    print("🎯 Customer Success Manager")
    print("=" * 60)
    print()
    
    # Create success plans
    p1 = csm.create_success_plan(
        "Sunrise Realty", "Alex",
        ["Increase organic traffic 50%", "Generate 100 leads/month"],
        ["SEO audit complete", "Content strategy live", "First leads generated"]
    )
    p1.stage = SuccessStage.VALUE_REALIZATION
    p1.engagement = EngagementLevel.CHAMPION
    p1.health_score = 92
    
    p2 = csm.create_success_plan(
        "Coffee Lab", "Sarah",
        ["Brand awareness", "Social growth"],
        ["Brand guide", "Social calendar", "First campaign"]
    )
    p2.stage = SuccessStage.ADOPTION
    
    p3 = csm.create_success_plan(
        "Tech Startup", "Alex",
        ["Lead generation", "Conversion optimization"],
        ["PPC setup", "Landing pages", "First conversions"]
    )
    
    print(csm.format_dashboard())
