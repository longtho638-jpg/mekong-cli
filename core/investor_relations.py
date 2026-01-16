"""
🤝 Investor Relations - VC Pipeline Management
===============================================

Manage investor relationships and fundraising pipeline.
Inspired by Pillar VC's Investor Outreach Template.

Features:
- Investor pipeline tracking
- Outreach management
- Due diligence checklist
- VC relationship scoring
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class InvestorType(Enum):
    """Investor type."""
    ANGEL = "angel"
    SEED_VC = "seed_vc"
    SERIES_A_VC = "series_a_vc"
    GROWTH_VC = "growth_vc"
    STRATEGIC = "strategic"
    FAMILY_OFFICE = "family_office"


class PipelineStage(Enum):
    """Investor pipeline stage."""
    RESEARCH = "research"
    OUTREACH = "outreach"
    INTRO_MEETING = "intro_meeting"
    PARTNER_MEETING = "partner_meeting"
    DUE_DILIGENCE = "due_diligence"
    TERM_SHEET = "term_sheet"
    CLOSED = "closed"
    PASSED = "passed"


class InteractionType(Enum):
    """Investor interaction type."""
    EMAIL = "email"
    CALL = "call"
    MEETING = "meeting"
    PITCH = "pitch"
    FOLLOW_UP = "follow_up"


@dataclass
class Investor:
    """An investor contact."""
    id: str
    name: str
    firm: str
    investor_type: InvestorType
    stage: PipelineStage = PipelineStage.RESEARCH
    check_size_min: float = 0
    check_size_max: float = 0
    focus_areas: List[str] = field(default_factory=list)
    warm_intro: Optional[str] = None
    last_contact: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: str = ""
    relationship_score: int = 0  # 0-100


@dataclass
class Interaction:
    """An investor interaction."""
    id: str
    investor_id: str
    interaction_type: InteractionType
    date: datetime
    summary: str
    outcome: str = ""
    next_steps: str = ""


@dataclass 
class DueDiligenceItem:
    """A due diligence checklist item."""
    category: str
    item: str
    status: str = "pending"  # pending, in_progress, complete
    notes: str = ""


class InvestorRelations:
    """
    Investor Relations Manager.
    
    Track and manage VC relationships.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.investors: Dict[str, Investor] = {}
        self.interactions: Dict[str, List[Interaction]] = {}
        self.dd_checklist: List[DueDiligenceItem] = []
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Add sample investors
        investors_data = [
            ("Sarah Chen", "Pillar VC", InvestorType.SEED_VC, 500_000, 2_000_000, 
             ["SaaS", "AI", "Enterprise"], PipelineStage.PARTNER_MEETING, 75),
            ("John Smith", "Andreessen Horowitz", InvestorType.SERIES_A_VC, 5_000_000, 15_000_000,
             ["AI", "Infrastructure"], PipelineStage.RESEARCH, 20),
            ("Mike Nguyen", "Angel Investor", InvestorType.ANGEL, 25_000, 100_000,
             ["Vietnam", "B2B"], PipelineStage.CLOSED, 90),
            ("Lisa Park", "First Round Capital", InvestorType.SEED_VC, 1_000_000, 3_000_000,
             ["SaaS", "Developer Tools"], PipelineStage.OUTREACH, 35),
        ]
        
        for name, firm, inv_type, min_check, max_check, focus, stage, score in investors_data:
            inv = self.add_investor(name, firm, inv_type, min_check, max_check, focus)
            inv.stage = stage
            inv.relationship_score = score
            inv.last_contact = datetime.now() - timedelta(days=7)
        
        # Add DD checklist
        self._init_dd_checklist()
    
    def _init_dd_checklist(self):
        """Initialize due diligence checklist."""
        dd_items = [
            ("Legal", "Certificate of Incorporation"),
            ("Legal", "Cap Table"),
            ("Legal", "IP Assignment Agreements"),
            ("Financial", "Last 12 months P&L"),
            ("Financial", "Bank statements"),
            ("Financial", "Revenue breakdown by customer"),
            ("Product", "Product roadmap"),
            ("Product", "Technical architecture"),
            ("Team", "Org chart"),
            ("Team", "Key employee agreements"),
            ("Market", "TAM/SAM/SOM analysis"),
            ("Customers", "Customer references"),
        ]
        
        for category, item in dd_items:
            self.dd_checklist.append(DueDiligenceItem(category=category, item=item))
    
    def add_investor(
        self,
        name: str,
        firm: str,
        investor_type: InvestorType,
        check_size_min: float = 0,
        check_size_max: float = 0,
        focus_areas: List[str] = None
    ) -> Investor:
        """Add an investor to the pipeline."""
        investor = Investor(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            firm=firm,
            investor_type=investor_type,
            check_size_min=check_size_min,
            check_size_max=check_size_max,
            focus_areas=focus_areas or []
        )
        self.investors[investor.id] = investor
        self.interactions[investor.id] = []
        return investor
    
    def log_interaction(
        self,
        investor_id: str,
        interaction_type: InteractionType,
        summary: str,
        outcome: str = "",
        next_steps: str = ""
    ) -> Interaction:
        """Log an interaction with an investor."""
        interaction = Interaction(
            id=f"INT-{uuid.uuid4().hex[:6].upper()}",
            investor_id=investor_id,
            interaction_type=interaction_type,
            date=datetime.now(),
            summary=summary,
            outcome=outcome,
            next_steps=next_steps
        )
        
        if investor_id in self.interactions:
            self.interactions[investor_id].append(interaction)
        
        # Update investor's last contact
        if investor_id in self.investors:
            self.investors[investor_id].last_contact = datetime.now()
        
        return interaction
    
    def update_stage(self, investor_id: str, stage: PipelineStage):
        """Update investor pipeline stage."""
        if investor_id in self.investors:
            self.investors[investor_id].stage = stage
    
    def get_pipeline_summary(self) -> Dict[str, List[Investor]]:
        """Get investors grouped by pipeline stage."""
        pipeline = {}
        for investor in self.investors.values():
            stage = investor.stage.value
            if stage not in pipeline:
                pipeline[stage] = []
            pipeline[stage].append(investor)
        return pipeline
    
    def get_stats(self) -> Dict[str, Any]:
        """Get investor relations statistics."""
        total = len(self.investors)
        by_stage = {}
        by_type = {}
        total_potential = 0
        closed_count = 0
        
        for inv in self.investors.values():
            stage = inv.stage.value
            by_stage[stage] = by_stage.get(stage, 0) + 1
            
            inv_type = inv.investor_type.value
            by_type[inv_type] = by_type.get(inv_type, 0) + 1
            
            if inv.stage == PipelineStage.CLOSED:
                closed_count += 1
                total_potential += inv.check_size_max
            elif inv.stage not in [PipelineStage.PASSED]:
                total_potential += (inv.check_size_min + inv.check_size_max) / 2
        
        dd_complete = sum(1 for item in self.dd_checklist if item.status == "complete")
        
        return {
            "total_investors": total,
            "by_stage": by_stage,
            "by_type": by_type,
            "pipeline_value": total_potential,
            "closed_count": closed_count,
            "dd_progress": dd_complete / len(self.dd_checklist) * 100 if self.dd_checklist else 0
        }
    
    def format_dashboard(self) -> str:
        """Format investor relations dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🤝 INVESTOR RELATIONS                                    ║",
            f"║  {stats['total_investors']} investors │ ${stats['pipeline_value']:,.0f} pipeline  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PIPELINE FUNNEL                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        stage_icons = {
            "research": "🔍", "outreach": "📧", "intro_meeting": "☕",
            "partner_meeting": "🤝", "due_diligence": "📋",
            "term_sheet": "📝", "closed": "✅", "passed": "❌"
        }
        
        for stage, count in stats['by_stage'].items():
            icon = stage_icons.get(stage, "⚪")
            bar = "█" * min(count * 3, 20)
            lines.append(f"║    {icon} {stage.replace('_', ' ').title():<15} │ {bar:<15} {count:>2}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 HOT INVESTORS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        hot_investors = sorted(
            [inv for inv in self.investors.values() if inv.stage != PipelineStage.PASSED],
            key=lambda x: x.relationship_score,
            reverse=True
        )[:4]
        
        for inv in hot_investors:
            score_bar = "●" * (inv.relationship_score // 20) + "○" * (5 - inv.relationship_score // 20)
            lines.append(f"║    {inv.name:<18} │ {inv.firm[:12]:<12} │ {score_bar}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 DUE DILIGENCE                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Progress: {stats['dd_progress']:.0f}%                                       ║",
            "║    ████████░░░░░░░░░░ 12 items                           ║",
            "║                                                           ║",
            "║  [📊 Pipeline]  [📧 Outreach]  [📋 DD Tracker]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Build relationships!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ir = InvestorRelations("Saigon Digital Hub")
    
    print("🤝 Investor Relations")
    print("=" * 60)
    print()
    
    print(ir.format_dashboard())
