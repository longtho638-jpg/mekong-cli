"""
Social Ads Agent - Paid Social Advertising
Manages paid campaigns across platforms.
"""

import random
from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Dict, List


class Platform(Enum):
    META = "meta"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"


class AdStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"


@dataclass
class AdSet:
    """Ad set"""

    id: str
    name: str
    audience: str
    budget_daily: float
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0

    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0

    @property
    def cpc(self) -> float:
        return self.spend / self.clicks if self.clicks > 0 else 0


@dataclass
class Campaign:
    """Paid social campaign"""

    id: str
    name: str
    platform: Platform
    objective: str
    status: AdStatus = AdStatus.DRAFT
    budget_total: float = 0
    ad_sets: List[AdSet] = field(default_factory=list)
    start_date: date = None
    end_date: date = None

    @property
    def total_spend(self) -> float:
        return sum(ad.spend for ad in self.ad_sets)

    @property
    def total_conversions(self) -> int:
        return sum(ad.conversions for ad in self.ad_sets)

    @property
    def roas(self) -> float:
        revenue = self.total_conversions * 100  # Assume $100 per conversion
        return revenue / self.total_spend if self.total_spend > 0 else 0


class SocialAdsAgent:
    """
    Social Ads Agent - Quảng cáo Paid Social

    Responsibilities:
    - Platform campaigns
    - Ad sets & creatives
    - Budget allocation
    - Audience targeting
    """

    def __init__(self):
        self.name = "Social Ads"
        self.status = "ready"
        self.campaigns: Dict[str, Campaign] = {}

    def create_campaign(
        self,
        name: str,
        platform: Platform,
        objective: str,
        budget: float,
        start_date: date = None,
        end_date: date = None,
    ) -> Campaign:
        """Create campaign"""
        campaign_id = f"camp_{random.randint(100, 999)}"

        campaign = Campaign(
            id=campaign_id,
            name=name,
            platform=platform,
            objective=objective,
            budget_total=budget,
            start_date=start_date,
            end_date=end_date,
        )

        self.campaigns[campaign_id] = campaign
        return campaign

    def add_ad_set(
        self, campaign_id: str, name: str, audience: str, budget_daily: float
    ) -> Campaign:
        """Add ad set to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        ad_set = AdSet(
            id=f"adset_{random.randint(100, 999)}",
            name=name,
            audience=audience,
            budget_daily=budget_daily,
        )

        self.campaigns[campaign_id].ad_sets.append(ad_set)
        return self.campaigns[campaign_id]

    def activate(self, campaign_id: str) -> Campaign:
        """Activate campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        self.campaigns[campaign_id].status = AdStatus.ACTIVE
        return self.campaigns[campaign_id]

    def simulate_performance(self, campaign_id: str) -> Campaign:
        """Simulate campaign performance"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]

        for ad in campaign.ad_sets:
            ad.spend = ad.budget_daily * random.uniform(0.8, 1.0)
            ad.impressions = int(ad.spend * random.uniform(100, 200))
            ad.clicks = int(ad.impressions * random.uniform(0.01, 0.05))
            ad.conversions = int(ad.clicks * random.uniform(0.05, 0.15))

        return campaign

    def get_stats(self) -> Dict:
        """Get advertising statistics"""
        campaigns = list(self.campaigns.values())
        active = [c for c in campaigns if c.status == AdStatus.ACTIVE]

        return {
            "total_campaigns": len(campaigns),
            "active": len(active),
            "total_spend": sum(c.total_spend for c in campaigns),
            "total_conversions": sum(c.total_conversions for c in campaigns),
            "avg_roas": sum(c.roas for c in campaigns) / len(campaigns) if campaigns else 0,
        }


# Demo
if __name__ == "__main__":
    agent = SocialAdsAgent()

    print("📱 Social Ads Agent Demo\n")

    # Create campaign
    c1 = agent.create_campaign("Q1 Brand Awareness", Platform.META, "Awareness", budget=5000)

    # Add ad sets
    agent.add_ad_set(c1.id, "Professionals 25-35", "Interest: Tech", 100)
    agent.add_ad_set(c1.id, "Decision Makers", "Job Title: Manager+", 150)

    print(f"📋 Campaign: {c1.name}")
    print(f"   Platform: {c1.platform.value}")
    print(f"   Budget: ${c1.budget_total:,.0f}")
    print(f"   Ad Sets: {len(c1.ad_sets)}")

    # Activate and simulate
    agent.activate(c1.id)
    agent.simulate_performance(c1.id)

    print("\n📊 Performance:")
    print(f"   Spend: ${c1.total_spend:,.0f}")
    print(f"   Conversions: {c1.total_conversions}")
    print(f"   ROAS: {c1.roas:.1f}x")
