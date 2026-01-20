"""
Investor Relations Facade.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List

from .cap_table import CapTableManager
from .communications import CommunicationManager
from .models import (
    DueDiligenceItem,
    Interaction,
    InteractionType,
    Investor,
    InvestorType,
    PipelineStage,
)
from .reporting import ReportingManager


class InvestorRelations(CommunicationManager, CapTableManager, ReportingManager):
    """
    Investor Relations Manager.
    Track and manage VC relationships.
    """

    def __init__(self, agency_name: str):
        # Multiple inheritance init
        CommunicationManager.__init__(self)
        CapTableManager.__init__(self)
        ReportingManager.__init__(self)

        self.agency_name = agency_name
        self.dd_checklist: List[DueDiligenceItem] = []

        self._init_demo_data()

    def _init_demo_data(self):
        """Initialize demo data."""
        # Add sample investors
        investors_data = [
            (
                "Sarah Chen",
                "Pillar VC",
                InvestorType.SEED_VC,
                500_000,
                2_000_000,
                ["SaaS", "AI", "Enterprise"],
                PipelineStage.PARTNER_MEETING,
                75,
            ),
            (
                "John Smith",
                "Andreessen Horowitz",
                InvestorType.SERIES_A_VC,
                5_000_000,
                15_000_000,
                ["AI", "Infrastructure"],
                PipelineStage.RESEARCH,
                20,
            ),
            (
                "Mike Nguyen",
                "Angel Investor",
                InvestorType.ANGEL,
                25_000,
                100_000,
                ["Vietnam", "B2B"],
                PipelineStage.CLOSED,
                90,
            ),
            (
                "Lisa Park",
                "First Round Capital",
                InvestorType.SEED_VC,
                1_000_000,
                3_000_000,
                ["SaaS", "Developer Tools"],
                PipelineStage.OUTREACH,
                35,
            ),
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
            "research": "🔍",
            "outreach": "📧",
            "intro_meeting": "☕",
            "partner_meeting": "🤝",
            "due_diligence": "📋",
            "term_sheet": "📝",
            "closed": "✅",
            "passed": "❌",
        }

        for stage, count in stats["by_stage"].items():
            icon = stage_icons.get(stage, "⚪")
            bar = "█" * min(count * 3, 20)
            lines.append(
                f"║    {icon} {stage.replace('_', ' ').title():<15} │ {bar:<15} {count:>2}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  🎯 HOT INVESTORS                                         ║",
                "║  ─────────────────────────────────────────────────────── ║",
            ]
        )

        hot_investors = sorted(
            [inv for inv in self.investors.values() if inv.stage != PipelineStage.PASSED],
            key=lambda x: x.relationship_score,
            reverse=True,
        )[:4]

        for inv in hot_investors:
            score_bar = "●" * (inv.relationship_score // 20) + "○" * (
                5 - inv.relationship_score // 20
            )
            lines.append(f"║    {inv.name:<18} │ {inv.firm[:12]:<12} │ {score_bar}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  📋 DUE DILIGENCE                                         ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    Progress: {stats['dd_progress']:.0f}%                                       ║",
                "║    ████████░░░░░░░░░░ 12 items                           ║",
                "║                                                           ║",
                "║  [📊 Pipeline]  [📧 Outreach]  [📋 DD Tracker]            ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  Castle {self.agency_name} - Build relationships!            ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)
