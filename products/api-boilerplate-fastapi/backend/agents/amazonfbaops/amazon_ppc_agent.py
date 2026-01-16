"""
Amazon PPC Agent - Sponsored Ads & ACOS
Manages Amazon advertising campaigns.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from enum import Enum
import random


class CampaignType(Enum):
    SPONSORED_PRODUCTS = "sp"
    SPONSORED_BRANDS = "sb"
    SPONSORED_DISPLAY = "sd"


class CampaignStatus(Enum):
    ENABLED = "enabled"
    PAUSED = "paused"
    ARCHIVED = "archived"


class MatchType(Enum):
    EXACT = "exact"
    PHRASE = "phrase"
    BROAD = "broad"
    AUTO = "auto"


@dataclass
class Keyword:
    """PPC keyword"""
    keyword: str
    match_type: MatchType
    bid: float
    impressions: int = 0
    clicks: int = 0
    spend: float = 0
    sales: float = 0

    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0

    @property
    def acos(self) -> float:
        return (self.spend / self.sales * 100) if self.sales > 0 else 0


@dataclass
class PPCCampaign:
    """Amazon PPC campaign"""
    id: str
    name: str
    campaign_type: CampaignType
    status: CampaignStatus = CampaignStatus.ENABLED
    daily_budget: float = 0
    keywords: List[Keyword] = field(default_factory=list)

    @property
    def total_spend(self) -> float:
        return sum(k.spend for k in self.keywords)

    @property
    def total_sales(self) -> float:
        return sum(k.sales for k in self.keywords)

    @property
    def acos(self) -> float:
        return (self.total_spend / self.total_sales * 100) if self.total_sales > 0 else 0

    @property
    def roas(self) -> float:
        return self.total_sales / self.total_spend if self.total_spend > 0 else 0


class AmazonPPCAgent:
    """
    Amazon PPC Agent - Quảng cáo Amazon
    
    Responsibilities:
    - Sponsored Products
    - ACOS optimization
    - Keyword bidding
    - Campaign analytics
    """

    def __init__(self):
        self.name = "Amazon PPC"
        self.status = "ready"
        self.campaigns: Dict[str, PPCCampaign] = {}

    def create_campaign(
        self,
        name: str,
        campaign_type: CampaignType,
        daily_budget: float
    ) -> PPCCampaign:
        """Create PPC campaign"""
        campaign_id = f"ppc_{random.randint(1000,9999)}"

        campaign = PPCCampaign(
            id=campaign_id,
            name=name,
            campaign_type=campaign_type,
            daily_budget=daily_budget
        )

        self.campaigns[campaign_id] = campaign
        return campaign

    def add_keyword(
        self,
        campaign_id: str,
        keyword: str,
        match_type: MatchType,
        bid: float
    ) -> PPCCampaign:
        """Add keyword to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        kw = Keyword(keyword=keyword, match_type=match_type, bid=bid)
        self.campaigns[campaign_id].keywords.append(kw)

        return self.campaigns[campaign_id]

    def simulate_performance(self, campaign_id: str, days: int = 7) -> PPCCampaign:
        """Simulate campaign performance"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]

        for kw in campaign.keywords:
            kw.impressions = random.randint(5000, 20000) * days
            kw.clicks = int(kw.impressions * random.uniform(0.005, 0.02))
            kw.spend = kw.clicks * kw.bid * random.uniform(0.8, 1.2)
            kw.sales = kw.spend * random.uniform(2.0, 5.0)

        return campaign

    def optimize_bids(self, campaign_id: str, target_acos: float = 25) -> PPCCampaign:
        """Optimize keyword bids for target ACOS"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]

        for kw in campaign.keywords:
            if kw.acos > target_acos:
                kw.bid *= 0.9  # Reduce bid
            elif kw.acos < target_acos * 0.5:
                kw.bid *= 1.1  # Increase bid

        return campaign

    def get_stats(self) -> Dict:
        """Get PPC statistics"""
        campaigns = list(self.campaigns.values())
        active = [c for c in campaigns if c.status == CampaignStatus.ENABLED]

        return {
            "total_campaigns": len(campaigns),
            "active": len(active),
            "total_spend": sum(c.total_spend for c in campaigns),
            "total_sales": sum(c.total_sales for c in campaigns),
            "avg_acos": sum(c.acos for c in active) / len(active) if active else 0,
            "avg_roas": sum(c.roas for c in active) / len(active) if active else 0
        }


# Demo
if __name__ == "__main__":
    agent = AmazonPPCAgent()

    print("📊 Amazon PPC Agent Demo\n")

    # Create campaign
    c1 = agent.create_campaign("Wireless Earbuds - SP", CampaignType.SPONSORED_PRODUCTS, 50)

    print(f"📋 Campaign: {c1.name}")
    print(f"   Type: {c1.campaign_type.value}")
    print(f"   Budget: ${c1.daily_budget}/day")

    # Add keywords
    agent.add_keyword(c1.id, "wireless earbuds", MatchType.EXACT, 1.50)
    agent.add_keyword(c1.id, "bluetooth earbuds", MatchType.PHRASE, 1.20)
    agent.add_keyword(c1.id, "earbuds", MatchType.BROAD, 0.80)

    print(f"   Keywords: {len(c1.keywords)}")

    # Simulate
    agent.simulate_performance(c1.id)

    print("\n📊 Performance:")
    print(f"   Spend: ${c1.total_spend:,.0f}")
    print(f"   Sales: ${c1.total_sales:,.0f}")
    print(f"   ACOS: {c1.acos:.1f}%")
    print(f"   ROAS: {c1.roas:.1f}x")

    # Optimize
    agent.optimize_bids(c1.id, target_acos=25)
    print("\n✅ Bids optimized for 25% ACOS")
