"""
Influencer Campaign Agent - Campaigns & ROI
Manages influencer campaigns and performance tracking.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, date
from enum import Enum
import random


class CampaignStatus(Enum):
    DRAFT = "draft"
    OUTREACH = "outreach"
    NEGOTIATION = "negotiation"
    ACTIVE = "active"
    COMPLETED = "completed"


class ContentType(Enum):
    POST = "post"
    STORY = "story"
    REEL = "reel"
    VIDEO = "video"
    LIVE = "live"


@dataclass
class Deliverable:
    """Campaign deliverable"""
    id: str
    influencer_id: str
    content_type: ContentType
    status: str = "pending"
    reach: int = 0
    engagement: int = 0
    link_clicks: int = 0
    posted_at: datetime = None


@dataclass
class InfluencerCampaign:
    """Influencer campaign"""
    id: str
    name: str
    objective: str
    budget: float
    status: CampaignStatus = CampaignStatus.DRAFT
    influencer_ids: List[str] = field(default_factory=list)
    deliverables: List[Deliverable] = field(default_factory=list)
    spend: float = 0
    revenue_attributed: float = 0
    start_date: date = None
    end_date: date = None
    
    @property
    def total_reach(self) -> int:
        return sum(d.reach for d in self.deliverables)
    
    @property
    def total_engagement(self) -> int:
        return sum(d.engagement for d in self.deliverables)
    
    @property
    def roi(self) -> float:
        return ((self.revenue_attributed - self.spend) / self.spend * 100) if self.spend > 0 else 0


class InfluencerCampaignAgent:
    """
    Influencer Campaign Agent - Quản lý Chiến dịch
    
    Responsibilities:
    - Campaign management
    - Content tracking
    - Performance metrics
    - ROI calculation
    """
    
    def __init__(self):
        self.name = "Influencer Campaign"
        self.status = "ready"
        self.campaigns: Dict[str, InfluencerCampaign] = {}
        
    def create_campaign(
        self,
        name: str,
        objective: str,
        budget: float,
        start_date: date = None,
        end_date: date = None
    ) -> InfluencerCampaign:
        """Create influencer campaign"""
        campaign_id = f"icamp_{random.randint(100,999)}"
        
        campaign = InfluencerCampaign(
            id=campaign_id,
            name=name,
            objective=objective,
            budget=budget,
            start_date=start_date,
            end_date=end_date
        )
        
        self.campaigns[campaign_id] = campaign
        return campaign
    
    def add_influencer(self, campaign_id: str, influencer_id: str) -> InfluencerCampaign:
        """Add influencer to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        self.campaigns[campaign_id].influencer_ids.append(influencer_id)
        return self.campaigns[campaign_id]
    
    def add_deliverable(
        self,
        campaign_id: str,
        influencer_id: str,
        content_type: ContentType
    ) -> InfluencerCampaign:
        """Add deliverable to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        deliverable = Deliverable(
            id=f"del_{random.randint(1000,9999)}",
            influencer_id=influencer_id,
            content_type=content_type
        )
        
        self.campaigns[campaign_id].deliverables.append(deliverable)
        return self.campaigns[campaign_id]
    
    def activate(self, campaign_id: str) -> InfluencerCampaign:
        """Activate campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        self.campaigns[campaign_id].status = CampaignStatus.ACTIVE
        return self.campaigns[campaign_id]
    
    def simulate_performance(self, campaign_id: str) -> InfluencerCampaign:
        """Simulate campaign performance"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        
        for deliverable in campaign.deliverables:
            deliverable.status = "live"
            deliverable.reach = random.randint(10000, 100000)
            deliverable.engagement = int(deliverable.reach * random.uniform(0.02, 0.08))
            deliverable.link_clicks = int(deliverable.engagement * random.uniform(0.1, 0.3))
            deliverable.posted_at = datetime.now()
        
        campaign.spend = campaign.budget * random.uniform(0.8, 1.0)
        campaign.revenue_attributed = campaign.spend * random.uniform(1.5, 4.0)
        campaign.status = CampaignStatus.COMPLETED
        
        return campaign
    
    def get_stats(self) -> Dict:
        """Get campaign statistics"""
        campaigns = list(self.campaigns.values())
        completed = [c for c in campaigns if c.status == CampaignStatus.COMPLETED]
        
        return {
            "total_campaigns": len(campaigns),
            "active": len([c for c in campaigns if c.status == CampaignStatus.ACTIVE]),
            "completed": len(completed),
            "total_spend": sum(c.spend for c in campaigns),
            "total_reach": sum(c.total_reach for c in campaigns),
            "avg_roi": sum(c.roi for c in completed) / len(completed) if completed else 0
        }


# Demo
if __name__ == "__main__":
    agent = InfluencerCampaignAgent()
    
    print("📋 Influencer Campaign Agent Demo\n")
    
    # Create campaign
    c1 = agent.create_campaign(
        "Summer Product Launch",
        "Awareness",
        budget=10000
    )
    
    print(f"📋 Campaign: {c1.name}")
    print(f"   Objective: {c1.objective}")
    print(f"   Budget: ${c1.budget:,}")
    
    # Add influencers and deliverables
    agent.add_influencer(c1.id, "inf_001")
    agent.add_influencer(c1.id, "inf_002")
    
    agent.add_deliverable(c1.id, "inf_001", ContentType.REEL)
    agent.add_deliverable(c1.id, "inf_001", ContentType.STORY)
    agent.add_deliverable(c1.id, "inf_002", ContentType.POST)
    
    print(f"   Influencers: {len(c1.influencer_ids)}")
    print(f"   Deliverables: {len(c1.deliverables)}")
    
    # Activate and simulate
    agent.activate(c1.id)
    agent.simulate_performance(c1.id)
    
    print(f"\n📊 Results:")
    print(f"   Reach: {c1.total_reach:,}")
    print(f"   Engagement: {c1.total_engagement:,}")
    print(f"   Spend: ${c1.spend:,.0f}")
    print(f"   Revenue: ${c1.revenue_attributed:,.0f}")
    print(f"   ROI: {c1.roi:.0f}%")
