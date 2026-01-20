"""
Nonprofit Marketing Facade and Dashboard.
"""
import logging

from .engine import NonprofitEngine
from .models import (
    CampaignStatus,
    CampaignType,
    DonationCampaign,
    NonprofitCategory,
    NonprofitClient,
)

logger = logging.getLogger(__name__)

class NonprofitMarketing(NonprofitEngine):
    """
    Nonprofit Marketing System.
    Orchestrates cause-driven marketing initiatives and fundraising tracking.
    """

    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Nonprofit Marketing system initialized for {agency_name}")
        self._init_defaults()

    def _init_defaults(self):
        """Seed the system with sample non-profit data."""
        try:
            c1 = self.add_client(
                "Hope Church", NonprofitCategory.RELIGIOUS, "Community hope", 2000.0
            )
            camp = self.create_campaign(c1.id, "Annual Drive", CampaignType.FUNDRAISING, 50000.0)
            self.update_campaign_progress(camp.id, 35000.0, 150)
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def format_dashboard(self) -> str:
        """Render the Nonprofit Marketing Dashboard."""
        total_raised = sum(c.raised for c in self.campaigns.values())
        active_camps = [c for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE]

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🙏 NONPROFIT MARKETING DASHBOARD{' ' * 25}║",
            f"║  {len(self.clients)} clients │ ${total_raised:,.0f} raised │ {len(active_camps)} active campaigns{' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏛️ ACTIVE CLIENTS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        cat_icons = {
            NonprofitCategory.RELIGIOUS: "⛪",
            NonprofitCategory.CHARITY: "💝",
            NonprofitCategory.EDUCATION: "📚",
            NonprofitCategory.ENVIRONMENT: "🌳",
        }

        for c in list(self.clients.values())[:4]:
            icon = cat_icons.get(c.category, "🙏")
            name_disp = (c.name[:20] + "..") if len(c.name) > 22 else c.name
            lines.append(
                f"║  {icon} {name_disp:<22} │ ${c.monthly_retainer:>8,.0f}/mo │ ${c.total_raised:>8,.0f} raised ║"
            )

        lines.extend(["║                                                           ║", "║  📊 CAMPAIGN PERFORMANCE                                  ║", "║  ───────────────────────────────────────────────────────  ║"])

        for camp in active_camps[:3]:
            prog = (camp.raised / camp.goal) * 100
            bar = "█" * int(prog / 10) + "░" * (10 - int(prog / 10))
            lines.append(
                f"║    🎯 {camp.name[:18]:<18} │ {bar} │ {prog:>3.0f}% (${camp.raised:,.0f}) ║"
            )

        lines.extend([
            "║                                                           ║",
            "║  [🏛️ New Client]  [📢 Campaign]  [💰 Donation]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Impact!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)
