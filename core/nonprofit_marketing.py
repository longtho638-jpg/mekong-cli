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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class NonprofitCategory(Enum):
    """Nonprofit categories."""
    RELIGIOUS = "religious"
    CHARITY = "charity"
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    ENVIRONMENT = "environment"
    SOCIAL = "social"


class CampaignType(Enum):
    """Campaign types."""
    FUNDRAISING = "fundraising"
    AWARENESS = "awareness"
    VOLUNTEER = "volunteer"
    EVENT = "event"
    MEMBERSHIP = "membership"


class CampaignStatus(Enum):
    """Campaign status."""
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class NonprofitClient:
    """A nonprofit client."""
    id: str
    name: str
    category: NonprofitCategory
    mission: str
    monthly_retainer: float = 0
    campaigns: List[str] = field(default_factory=list)
    total_raised: float = 0


@dataclass
class DonationCampaign:
    """A donation/fundraising campaign."""
    id: str
    client_id: str
    name: str
    campaign_type: CampaignType
    goal: float
    raised: float = 0
    donors: int = 0
    status: CampaignStatus = CampaignStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class NonprofitMarketing:
    """
    Nonprofit Marketing.
    
    Cause-driven marketing for nonprofits.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, NonprofitClient] = {}
        self.campaigns: Dict[str, DonationCampaign] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        clients = [
            ("Hope Church", NonprofitCategory.RELIGIOUS, "Spreading hope to the community", 2000),
            ("Green Earth Foundation", NonprofitCategory.ENVIRONMENT, "Protecting our planet", 3000),
            ("Local Food Bank", NonprofitCategory.CHARITY, "Fighting hunger locally", 1500),
            ("Youth Education Center", NonprofitCategory.EDUCATION, "Empowering young minds", 2500),
        ]
        
        for name, cat, mission, retainer in clients:
            client = self.add_client(name, cat, mission, retainer)
            
            # Create a campaign for each
            camp = self.create_campaign(
                client, f"{name} Annual Drive",
                CampaignType.FUNDRAISING, 50000
            )
            camp.status = CampaignStatus.ACTIVE
            camp.raised = 35000
            camp.donors = 150
    
    def add_client(
        self,
        name: str,
        category: NonprofitCategory,
        mission: str,
        monthly_retainer: float = 0
    ) -> NonprofitClient:
        """Add a nonprofit client."""
        client = NonprofitClient(
            id=f"NPO-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            category=category,
            mission=mission,
            monthly_retainer=monthly_retainer
        )
        self.clients[client.id] = client
        return client
    
    def create_campaign(
        self,
        client: NonprofitClient,
        name: str,
        campaign_type: CampaignType,
        goal: float
    ) -> DonationCampaign:
        """Create a fundraising campaign."""
        campaign = DonationCampaign(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            client_id=client.id,
            name=name,
            campaign_type=campaign_type,
            goal=goal,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=90)
        )
        self.campaigns[campaign.id] = campaign
        client.campaigns.append(campaign.id)
        return campaign
    
    def update_campaign(self, campaign: DonationCampaign, raised: float, donors: int):
        """Update campaign progress."""
        campaign.raised = raised
        campaign.donors = donors
        
        # Update client total
        client = self.clients.get(campaign.client_id)
        if client:
            client.total_raised = sum(
                c.raised for c in self.campaigns.values()
                if c.client_id == client.id
            )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get nonprofit marketing statistics."""
        total_raised = sum(c.raised for c in self.campaigns.values())
        total_donors = sum(c.donors for c in self.campaigns.values())
        active_campaigns = sum(1 for c in self.campaigns.values() 
                              if c.status == CampaignStatus.ACTIVE)
        total_retainer = sum(c.monthly_retainer for c in self.clients.values())
        
        return {
            "clients": len(self.clients),
            "campaigns": len(self.campaigns),
            "active_campaigns": active_campaigns,
            "total_raised": total_raised,
            "total_donors": total_donors,
            "monthly_retainer": total_retainer
        }
    
    def format_dashboard(self) -> str:
        """Format nonprofit marketing dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🙏 NONPROFIT MARKETING                                   ║",
            f"║  {stats['clients']} clients │ ${stats['total_raised']:,.0f} raised │ {stats['total_donors']} donors  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏛️ NONPROFIT CLIENTS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        cat_icons = {"religious": "⛪", "charity": "💝", "education": "📚",
                    "healthcare": "🏥", "environment": "🌳", "social": "👥"}
        
        for client in list(self.clients.values())[:4]:
            icon = cat_icons.get(client.category.value, "🙏")
            lines.append(f"║    {icon} {client.name[:22]:<22} │ ${client.monthly_retainer:>6,.0f}/mo  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 ACTIVE CAMPAIGNS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"fundraising": "💰", "awareness": "📢", "volunteer": "🙋",
                     "event": "📅", "membership": "👥"}
        
        for campaign in list(self.campaigns.values())[:4]:
            if campaign.status == CampaignStatus.ACTIVE:
                icon = type_icons.get(campaign.campaign_type.value, "📊")
                progress = (campaign.raised / campaign.goal * 100) if campaign.goal else 0
                bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))
                lines.append(f"║    {icon} {campaign.name[:18]:<18} │ {bar} │ {progress:>3.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 FUNDRAISING IMPACT                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Raised:       ${stats['total_raised']:>11,.0f}              ║",
            f"║    👥 Total Donors:       {stats['total_donors']:>12}              ║",
            f"║    📊 Active Campaigns:   {stats['active_campaigns']:>12}              ║",
            f"║    💵 Monthly Retainer:   ${stats['monthly_retainer']:>11,.0f}              ║",
            "║                                                           ║",
            "║  [🏛️ Clients]  [📊 Campaigns]  [💰 Donations]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Make a difference!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    nm = NonprofitMarketing("Saigon Digital Hub")
    
    print("🙏 Nonprofit Marketing")
    print("=" * 60)
    print()
    
    print(nm.format_dashboard())
