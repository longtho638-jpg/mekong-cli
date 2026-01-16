
"""
🙏 Nonprofit Marketing - Cause Marketing
==========================================

Marketing for religious and nonprofit clients.
Make a difference!

Features:
- Nonprofit client portfolio
- Donation campaigns
- Mission-driven content
- Grant support
"""

import uuid
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NonprofitCategory(Enum):
    """Sectors of non-profit organizations."""
    RELIGIOUS = "religious"
    CHARITY = "charity"
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    ENVIRONMENT = "environment"
    SOCIAL = "social"


class CampaignType(Enum):
    """Types of marketing campaigns for nonprofits."""
    FUNDRAISING = "fundraising"
    AWARENESS = "awareness"
    VOLUNTEER = "volunteer"
    EVENT = "event"
    MEMBERSHIP = "membership"


class CampaignStatus(Enum):
    """Lifecycle status of a campaign."""
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class NonprofitClient:
    """A non-profit organization client entity."""
    id: str
    name: str
    category: NonprofitCategory
    mission: str
    monthly_retainer: float = 0.0
    campaigns: List[str] = field(default_factory=list)
    total_raised: float = 0.0

    def __post_init__(self):
        if self.monthly_retainer < 0:
            raise ValueError("Retainer cannot be negative")


@dataclass
class DonationCampaign:
    """A fundraising campaign record."""
    id: str
    client_id: str
    name: str
    campaign_type: CampaignType
    goal: float
    raised: float = 0.0
    donors: int = 0
    status: CampaignStatus = CampaignStatus.PLANNING
    start_date: Optional[datetime] = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None

    def __post_init__(self):
        if self.goal <= 0:
            raise ValueError("Campaign goal must be positive")


class NonprofitMarketing:
    """
    Nonprofit Marketing System.
    
    Orchestrates cause-driven marketing initiatives and fundraising tracking.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, NonprofitClient] = {}
        self.campaigns: Dict[str, DonationCampaign] = {}
        logger.info(f"Nonprofit Marketing system initialized for {agency_name}")
        self._init_defaults()

    def _init_defaults(self):
        """Seed the system with sample non-profit data."""
        logger.info("Loading demo non-profit data...")
        try:
            c1 = self.add_client("Hope Church", NonprofitCategory.RELIGIOUS, "Community hope", 2000.0)
            camp = self.create_campaign(c1.id, "Annual Drive", CampaignType.FUNDRAISING, 50000.0)
            self.update_campaign_progress(camp.id, 35000.0, 150)
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def add_client(
        self,
        name: str,
        category: NonprofitCategory,
        mission: str,
        monthly_retainer: float = 0.0
    ) -> NonprofitClient:
        """Register a new non-profit client."""
        if not name:
            raise ValueError("Client name required")

        client = NonprofitClient(
            id=f"NPO-{uuid.uuid4().hex[:6].upper()}",
            name=name, category=category, mission=mission,
            monthly_retainer=monthly_retainer
        )
        self.clients[client.id] = client
        logger.info(f"Nonprofit client added: {name} ({category.value})")
        return client

    def create_campaign(
        self,
        client_id: str,
        name: str,
        campaign_type: CampaignType,
        goal: float
    ) -> Optional[DonationCampaign]:
        """Launch a new marketing campaign for a client."""
        if client_id not in self.clients:
            logger.error(f"Client {client_id} not found")
            return None

        campaign = DonationCampaign(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id, name=name,
            campaign_type=campaign_type, goal=goal,
            end_date=datetime.now() + timedelta(days=90)
        )
        self.campaigns[campaign.id] = campaign
        self.clients[client_id].campaigns.append(campaign.id)

        logger.info(f"Campaign created: {name} (Goal: ${goal:,.0f})")
        return campaign

    def update_campaign_progress(self, campaign_id: str, raised: float, donors: int) -> bool:
        """Update fundraising metrics for a campaign."""
        if campaign_id not in self.campaigns: return False

        camp = self.campaigns[campaign_id]
        camp.raised = raised
        camp.donors = donors
        camp.status = CampaignStatus.ACTIVE

        # Update client aggregated stats
        client = self.clients.get(camp.client_id)
        if client:
            client.total_raised = sum(c.raised for c in self.campaigns.values() if c.client_id == client.id)

        logger.info(f"Campaign {camp.name} updated: ${raised:,.0f} raised")
        return True

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
            NonprofitCategory.RELIGIOUS: "⛪", NonprofitCategory.CHARITY: "💝",
            NonprofitCategory.EDUCATION: "📚", NonprofitCategory.ENVIRONMENT: "🌳"
        }

        for c in list(self.clients.values())[:4]:
            icon = cat_icons.get(c.category, "🙏")
            name_disp = (c.name[:20] + '..') if len(c.name) > 22 else c.name
            lines.append(f"║  {icon} {name_disp:<22} │ ${c.monthly_retainer:>8,.0f}/mo │ ${c.total_raised:>8,.0f} raised ║")

        lines.extend([
            "║                                                           ║",
            "║  📊 CAMPAIGN PERFORMANCE                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        for camp in active_camps[:3]:
            prog = (camp.raised / camp.goal) * 100
            bar = "█" * int(prog / 10) + "░" * (10 - int(prog / 10))
            lines.append(f"║    🎯 {camp.name[:18]:<18} │ {bar} │ {prog:>3.0f}% (${camp.raised:,.0f}) ║")

        lines.extend([
            "║                                                           ║",
            "║  [🏛️ New Client]  [📢 Campaign]  [💰 Donation]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Impact!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🙏 Initializing Nonprofit System...")
    print("=" * 60)

    try:
        np_system = NonprofitMarketing("Saigon Digital Hub")
        print("\n" + np_system.format_dashboard())
    except Exception as e:
        logger.error(f"Nonprofit Error: {e}")
