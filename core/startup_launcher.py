"""
🚀 Startup Launcher - New Ventures
====================================

Launch new products, services, and ventures.
Ship fast, learn faster!

Roles:
- Idea validation
- MVP tracking
- Launch planning
- Growth metrics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class VentureStage(Enum):
    """Venture development stages."""
    IDEA = "idea"
    VALIDATION = "validation"
    MVP = "mvp"
    BETA = "beta"
    LAUNCH = "launch"
    GROWTH = "growth"
    SCALE = "scale"


class VentureType(Enum):
    """Venture types."""
    PRODUCT = "product"
    SERVICE = "service"
    SAAS = "saas"
    MARKETPLACE = "marketplace"
    AGENCY_SPINOFF = "agency_spinoff"


class MilestoneStatus(Enum):
    """Milestone status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


@dataclass
class Venture:
    """A new venture/product."""
    id: str
    name: str
    tagline: str
    venture_type: VentureType
    stage: VentureStage = VentureStage.IDEA
    leads: List[str] = field(default_factory=list)
    investment: float = 0
    revenue: float = 0
    users: int = 0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Milestone:
    """A venture milestone."""
    id: str
    venture_id: str
    title: str
    status: MilestoneStatus = MilestoneStatus.NOT_STARTED
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class Experiment:
    """A validation experiment."""
    id: str
    venture_id: str
    hypothesis: str
    metric: str
    target: float
    result: float = 0
    validated: Optional[bool] = None


class StartupLauncher:
    """
    Startup Launcher.
    
    Launch new ventures.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.ventures: Dict[str, Venture] = {}
        self.milestones: List[Milestone] = []
        self.experiments: List[Experiment] = []
    
    def create_venture(
        self,
        name: str,
        tagline: str,
        venture_type: VentureType,
        leads: List[str] = None
    ) -> Venture:
        """Create a new venture."""
        venture = Venture(
            id=f"VNT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            tagline=tagline,
            venture_type=venture_type,
            leads=leads or []
        )
        self.ventures[venture.id] = venture
        return venture
    
    def advance_stage(self, venture: Venture, stage: VentureStage):
        """Advance venture to next stage."""
        venture.stage = stage
    
    def add_investment(self, venture: Venture, amount: float):
        """Add investment to venture."""
        venture.investment += amount
    
    def update_metrics(self, venture: Venture, users: int = 0, revenue: float = 0):
        """Update venture metrics."""
        venture.users = users
        venture.revenue = revenue
    
    def add_milestone(
        self,
        venture: Venture,
        title: str,
        days_out: int = 30
    ) -> Milestone:
        """Add a milestone."""
        milestone = Milestone(
            id=f"MST-{uuid.uuid4().hex[:6].upper()}",
            venture_id=venture.id,
            title=title,
            due_date=datetime.now() + timedelta(days=days_out)
        )
        self.milestones.append(milestone)
        return milestone
    
    def complete_milestone(self, milestone: Milestone):
        """Complete a milestone."""
        milestone.status = MilestoneStatus.COMPLETED
        milestone.completed_at = datetime.now()
    
    def create_experiment(
        self,
        venture: Venture,
        hypothesis: str,
        metric: str,
        target: float
    ) -> Experiment:
        """Create a validation experiment."""
        exp = Experiment(
            id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            venture_id=venture.id,
            hypothesis=hypothesis,
            metric=metric,
            target=target
        )
        self.experiments.append(exp)
        return exp
    
    def validate_experiment(self, exp: Experiment, result: float):
        """Validate an experiment."""
        exp.result = result
        exp.validated = result >= exp.target
    
    def get_stats(self) -> Dict[str, Any]:
        """Get launcher statistics."""
        by_stage = {}
        for stage in VentureStage:
            by_stage[stage.value] = sum(1 for v in self.ventures.values() if v.stage == stage)
        
        total_investment = sum(v.investment for v in self.ventures.values())
        total_revenue = sum(v.revenue for v in self.ventures.values())
        total_users = sum(v.users for v in self.ventures.values())
        
        return {
            "ventures": len(self.ventures),
            "by_stage": by_stage,
            "investment": total_investment,
            "revenue": total_revenue,
            "users": total_users,
            "milestones": len(self.milestones),
            "experiments": len(self.experiments)
        }
    
    def format_dashboard(self) -> str:
        """Format startup launcher dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 STARTUP LAUNCHER                                      ║",
            f"║  {stats['ventures']} ventures │ ${stats['investment']:,.0f} invested │ {stats['users']:,} users  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 VENTURE PIPELINE                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        stage_icons = {"idea": "💡", "validation": "🔬", "mvp": "🛠️",
                      "beta": "🎮", "launch": "🚀", "growth": "📈", "scale": "🏆"}
        type_icons = {"product": "📦", "service": "🎯", "saas": "☁️",
                     "marketplace": "🏪", "agency_spinoff": "🏢"}
        
        for venture in list(self.ventures.values())[:4]:
            s_icon = stage_icons.get(venture.stage.value, "⚪")
            t_icon = type_icons.get(venture.venture_type.value, "📦")
            
            lines.append(f"║  {s_icon} {t_icon} {venture.name[:18]:<18} │ {venture.users:>6} users │ ${venture.revenue:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY STAGE                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for stage in [VentureStage.IDEA, VentureStage.MVP, VentureStage.LAUNCH, VentureStage.GROWTH]:
            count = stats['by_stage'].get(stage.value, 0)
            icon = stage_icons.get(stage.value, "⚪")
            lines.append(f"║    {icon} {stage.value.title():<12} │ {count:>2} ventures                   ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🔬 EXPERIMENTS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for exp in self.experiments[-3:]:
            status = "✅" if exp.validated else "❌" if exp.validated == False else "⏳"
            lines.append(f"║  {status} {exp.hypothesis[:25]:<25} │ {exp.result:.0f}/{exp.target:.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 MILESTONES                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"not_started": "⚪", "in_progress": "🔄", "completed": "✅", "blocked": "🔴"}
        for ms in [m for m in self.milestones if m.status != MilestoneStatus.COMPLETED][:3]:
            icon = status_icons.get(ms.status.value, "⚪")
            due = ms.due_date.strftime("%b %d") if ms.due_date else "No date"
            lines.append(f"║  {icon} {ms.title[:28]:<28} │ {due:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🚀 Launch]  [🔬 Experiment]  [📊 Metrics]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Ship fast, learn faster!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    sl = StartupLauncher("Saigon Digital Hub")
    
    print("🚀 Startup Launcher")
    print("=" * 60)
    print()
    
    v1 = sl.create_venture("AgencyOS", "AI-powered agency management", VentureType.SAAS, ["Khoa"])
    v2 = sl.create_venture("DesignHub", "Design subscription service", VentureType.SERVICE, ["Alex"])
    v3 = sl.create_venture("MarketSync", "E-commerce marketplace", VentureType.MARKETPLACE)
    
    sl.advance_stage(v1, VentureStage.GROWTH)
    sl.advance_stage(v2, VentureStage.MVP)
    
    sl.add_investment(v1, 50000)
    sl.update_metrics(v1, 1500, 25000)
    sl.update_metrics(v2, 50, 500)
    
    m1 = sl.add_milestone(v1, "Reach 2000 users", 30)
    m2 = sl.add_milestone(v2, "MVP Launch", 14)
    m1.status = MilestoneStatus.IN_PROGRESS
    
    e1 = sl.create_experiment(v2, "Users will pay $99/mo for design", "conversion_rate", 5.0)
    sl.validate_experiment(e1, 7.5)
    
    print(sl.format_dashboard())
