"""
Campaign Manager Agent - Cross-Channel Orchestration
Manages marketing campaigns across multiple channels.
"""

from dataclasses import dataclass
from typing import List, Dict
from datetime import date
from enum import Enum
import random


class Channel(Enum):
    SOCIAL = "social"
    SEARCH = "search"
    EMAIL = "email"
    CONTENT = "content"
    EVENTS = "events"
    PR = "pr"


class CampaignStatus(Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class MarketingCampaign:
    """Marketing campaign"""
    id: str
    name: str
    channels: List[Channel]
    start_date: date
    end_date: date
    budget: float
    status: CampaignStatus = CampaignStatus.PLANNING
    tasks_completed: int = 0
    tasks_total: int = 0
    spend: float = 0
    revenue: float = 0

    @property
    def progress(self) -> float:
        return (self.tasks_completed / self.tasks_total * 100) if self.tasks_total > 0 else 0

    @property
    def roas(self) -> float:
        return self.revenue / self.spend if self.spend > 0 else 0


class CampaignManagerAgent:
    """
    Campaign Manager Agent - Quản lý Chiến dịch Đa kênh
    
    Responsibilities:
    - Cross-channel orchestration
    - Marketing calendar
    - Budget allocation
    - Campaign status tracking
    """

    def __init__(self):
        self.name = "Campaign Manager"
        self.status = "ready"
        self.campaigns: Dict[str, MarketingCampaign] = {}

    def create_campaign(
        self,
        name: str,
        channels: List[Channel],
        start_date: date,
        end_date: date,
        budget: float
    ) -> MarketingCampaign:
        """Create marketing campaign"""
        campaign_id = f"mkt_{random.randint(100,999)}"

        campaign = MarketingCampaign(
            id=campaign_id,
            name=name,
            channels=channels,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            tasks_total=random.randint(5, 15)
        )

        self.campaigns[campaign_id] = campaign
        return campaign

    def update_progress(self, campaign_id: str, tasks_completed: int) -> MarketingCampaign:
        """Update campaign progress"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]
        campaign.tasks_completed = min(tasks_completed, campaign.tasks_total)

        if campaign.tasks_completed == campaign.tasks_total:
            campaign.status = CampaignStatus.COMPLETED
        elif campaign.tasks_completed > 0:
            campaign.status = CampaignStatus.ACTIVE

        return campaign

    def simulate_performance(self, campaign_id: str) -> MarketingCampaign:
        """Simulate campaign performance"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]

        # Simulate spend and revenue
        progress_factor = campaign.tasks_completed / campaign.tasks_total if campaign.tasks_total > 0 else 0
        campaign.spend = campaign.budget * progress_factor * random.uniform(0.9, 1.1)

        # ROAS varies by channel mix
        base_roas = 2.5
        if Channel.EMAIL in campaign.channels: base_roas += 1.0 # High ROI
        if Channel.SEARCH in campaign.channels: base_roas += 0.5

        campaign.revenue = campaign.spend * base_roas * random.uniform(0.8, 1.2)

        return campaign

    def get_calendar(self) -> List[MarketingCampaign]:
        """Get marketing calendar"""
        return sorted(self.campaigns.values(), key=lambda c: c.start_date)

    def get_stats(self) -> Dict:
        """Get campaign statistics"""
        campaigns = list(self.campaigns.values())
        active = [c for c in campaigns if c.status == CampaignStatus.ACTIVE]

        return {
            "total_campaigns": len(campaigns),
            "active": len(active),
            "total_budget": sum(c.budget for c in campaigns),
            "total_spend": sum(c.spend for c in campaigns),
            "total_revenue": sum(c.revenue for c in campaigns)
        }


# Demo
if __name__ == "__main__":
    from datetime import timedelta

    agent = CampaignManagerAgent()

    print("📈 Campaign Manager Agent Demo\n")

    # Create campaign
    start = date.today()
    c1 = agent.create_campaign(
        "Q4 Holiday Sale",
        [Channel.EMAIL, Channel.SOCIAL, Channel.SEARCH],
        start,
        start + timedelta(days=30),
        50000
    )

    print(f"📋 Campaign: {c1.name}")
    print(f"   Channels: {', '.join([c.value for c in c1.channels])}")
    print(f"   Budget: ${c1.budget:,}")

    # Update progress
    agent.update_progress(c1.id, 5)
    print(f"   Status: {c1.status.value}")
    print(f"   Progress: {c1.progress:.0f}%")

    # Simulate
    agent.simulate_performance(c1.id)

    print("\n📊 Performance:")
    print(f"   Spend: ${c1.spend:,.0f}")
    print(f"   Revenue: ${c1.revenue:,.0f}")
    print(f"   ROAS: {c1.roas:.1f}x")
