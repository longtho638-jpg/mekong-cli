"""
Google Ads Agent - Search, Display & Video
Manages Google Search, Display, and Video campaigns.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from enum import Enum
import random


class AdType(Enum):
    SEARCH = "search"
    DISPLAY = "display"
    VIDEO = "video"
    SHOPPING = "shopping"


class KeywordMatch(Enum):
    BROAD = "broad"
    PHRASE = "phrase"
    EXACT = "exact"


@dataclass
class PPCKeyword:
    """PPC Keyword"""
    text: str
    match_type: KeywordMatch
    quality_score: int = 0
    cpc: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    
    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0
    
    @property
    def conversion_rate(self) -> float:
        return (self.conversions / self.clicks * 100) if self.clicks > 0 else 0


@dataclass
class GoogleAdsCampaign:
    """Google Ads campaign"""
    id: str
    name: str
    ad_type: AdType
    budget_daily: float
    status: str = "enabled"
    keywords: List[PPCKeyword] = field(default_factory=list)
    impressions: int = 0
    clicks: int = 0
    cost: float = 0
    conversions: int = 0
    conversion_value: float = 0
    
    @property
    def roas(self) -> float:
        return self.conversion_value / self.cost if self.cost > 0 else 0
    
    @property
    def cpa(self) -> float:
        return self.cost / self.conversions if self.conversions > 0 else 0


class GoogleAdsAgent:
    """
    Google Ads Agent - Quảng cáo Google
    
    Responsibilities:
    - Search, Display, Video campaigns
    - Keyword management
    - Ad copy testing
    - Quality Score tracking
    """
    
    def __init__(self):
        self.name = "Google Ads"
        self.status = "ready"
        self.campaigns: Dict[str, GoogleAdsCampaign] = {}
        
    def create_campaign(
        self,
        name: str,
        ad_type: AdType,
        budget: float
    ) -> GoogleAdsCampaign:
        """Create Google Ads campaign"""
        campaign_id = f"gads_{random.randint(100,999)}"
        
        campaign = GoogleAdsCampaign(
            id=campaign_id,
            name=name,
            ad_type=ad_type,
            budget_daily=budget
        )
        
        self.campaigns[campaign_id] = campaign
        return campaign
    
    def add_keyword(
        self,
        campaign_id: str,
        text: str,
        match_type: KeywordMatch
    ) -> GoogleAdsCampaign:
        """Add keyword to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        keyword = PPCKeyword(
            text=text,
            match_type=match_type,
            quality_score=random.randint(5, 10),  # Initial quality score
            cpc=random.uniform(0.5, 5.0)
        )
        
        self.campaigns[campaign_id].keywords.append(keyword)
        return self.campaigns[campaign_id]
    
    def simulate_performance(self, campaign_id: str, days: int = 7) -> GoogleAdsCampaign:
        """Simulate campaign performance"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        
        # Simulate campaign level metrics based on keywords
        total_impressions = 0
        total_clicks = 0
        total_cost = 0
        total_conversions = 0
        
        for kw in campaign.keywords:
            # Better quality score = better performance
            qs_factor = kw.quality_score / 10.0
            
            kw.impressions = int(random.randint(1000, 5000) * days * qs_factor)
            kw.clicks = int(kw.impressions * random.uniform(0.02, 0.08) * qs_factor)
            kw.conversions = int(kw.clicks * random.uniform(0.05, 0.15))
            
            kw_cost = kw.clicks * kw.cpc
            
            total_impressions += kw.impressions
            total_clicks += kw.clicks
            total_cost += kw_cost
            total_conversions += kw.conversions
        
        campaign.impressions = total_impressions
        campaign.clicks = total_clicks
        campaign.cost = total_cost
        campaign.conversions = total_conversions
        
        # Simulate ROAS
        roas_target = 3.5 if campaign.ad_type == AdType.SEARCH else 2.0
        campaign.conversion_value = campaign.cost * roas_target * random.uniform(0.8, 1.2)
        
        return campaign
    
    def get_stats(self) -> Dict:
        """Get Google Ads statistics"""
        campaigns = list(self.campaigns.values())
        
        total_spend = sum(c.cost for c in campaigns)
        total_rev = sum(c.conversion_value for c in campaigns)
        
        return {
            "total_campaigns": len(campaigns),
            "total_keywords": sum(len(c.keywords) for c in campaigns),
            "total_spend": total_spend,
            "total_revenue": total_rev,
            "global_roas": total_rev / total_spend if total_spend > 0 else 0,
            "avg_qs": sum(k.quality_score for c in campaigns for k in c.keywords) / sum(len(c.keywords) for c in campaigns) if campaigns else 0
        }


# Demo
if __name__ == "__main__":
    agent = GoogleAdsAgent()
    
    print("🎯 Google Ads Agent Demo\n")
    
    # Create campaign
    c1 = agent.create_campaign("SaaS Search Q1", AdType.SEARCH, 150)
    
    print(f"📋 Campaign: {c1.name}")
    print(f"   Type: {c1.ad_type.value}")
    print(f"   Budget: ${c1.budget_daily}/day")
    
    # Add keywords
    agent.add_keyword(c1.id, "marketing automation", KeywordMatch.PHRASE)
    agent.add_keyword(c1.id, "crm software", KeywordMatch.EXACT)
    agent.add_keyword(c1.id, "lead generation tools", KeywordMatch.BROAD)
    
    print(f"   Keywords: {len(c1.keywords)}")
    
    # Simulate
    agent.simulate_performance(c1.id)
    
    print("\n📊 Performance:")
    print(f"   Impressions: {c1.impressions:,}")
    print(f"   Clicks: {c1.clicks:,}")
    print(f"   Cost: ${c1.cost:,.0f}")
    print(f"   Conversions: {c1.conversions}")
    print(f"   CPA: ${c1.cpa:.2f}")
    print(f"   ROAS: {c1.roas:.1f}x")
    
    # Keyword stats
    print("\n🔑 Top Keyword:")
    top_kw = max(c1.keywords, key=lambda k: k.conversions)
    print(f"   '{top_kw.text}': QS {top_kw.quality_score}/10, {top_kw.conversions} conv")
