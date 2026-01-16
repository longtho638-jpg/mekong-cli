"""
Campaign Agent - Marketing Campaign Management
Manages campaigns, budgets, and channel coordination.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime, date
from enum import Enum
import random


class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class ChannelType(Enum):
    EMAIL = "email"
    SOCIAL = "social"
    PAID_ADS = "paid_ads"
    CONTENT = "content"
    PR = "pr"
    EVENTS = "events"


@dataclass
class Channel:
    """Marketing channel"""
    type: ChannelType
    budget: float
    spent: float = 0
    leads: int = 0


@dataclass
class Campaign:
    """Marketing campaign"""
    id: str
    name: str
    objective: str
    status: CampaignStatus = CampaignStatus.DRAFT
    budget: float = 0
    spent: float = 0
    channels: List[Channel] = field(default_factory=list)
    start_date: date = None
    end_date: date = None
    leads: int = 0
    conversions: int = 0
    
    @property
    def roi(self) -> float:
        return (self.conversions * 100 / self.spent) if self.spent > 0 else 0
    
    @property
    def budget_used(self) -> float:
        return (self.spent / self.budget * 100) if self.budget > 0 else 0


class CampaignAgent:
    """
    Campaign Agent - Quản lý Chiến dịch
    
    Responsibilities:
    - Campaign management
    - Budget tracking
    - Channel coordination
    - Performance metrics
    """
    
    def __init__(self):
        self.name = "Campaign"
        self.status = "ready"
        self.campaigns: Dict[str, Campaign] = {}
        
    def create_campaign(
        self,
        name: str,
        objective: str,
        budget: float,
        start_date: date = None,
        end_date: date = None
    ) -> Campaign:
        """Create campaign"""
        campaign_id = f"camp_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        campaign = Campaign(
            id=campaign_id,
            name=name,
            objective=objective,
            budget=budget,
            start_date=start_date or date.today(),
            end_date=end_date
        )
        
        self.campaigns[campaign_id] = campaign
        return campaign
    
    def add_channel(self, campaign_id: str, channel_type: ChannelType, budget: float) -> Campaign:
        """Add channel to campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        
        channel = Channel(type=channel_type, budget=budget)
        campaign.channels.append(channel)
        
        return campaign
    
    def launch(self, campaign_id: str) -> Campaign:
        """Launch campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.status = CampaignStatus.ACTIVE
        
        return campaign
    
    def record_spend(self, campaign_id: str, amount: float, leads: int = 0, conversions: int = 0) -> Campaign:
        """Record campaign spend"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.spent += amount
        campaign.leads += leads
        campaign.conversions += conversions
        
        return campaign
    
    def complete(self, campaign_id: str) -> Campaign:
        """Complete campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.status = CampaignStatus.COMPLETED
        
        return campaign
    
    def get_stats(self) -> Dict:
        """Get campaign statistics"""
        campaigns = list(self.campaigns.values())
        active = [c for c in campaigns if c.status == CampaignStatus.ACTIVE]
        
        return {
            "total_campaigns": len(campaigns),
            "active": len(active),
            "total_budget": sum(c.budget for c in campaigns),
            "total_spent": sum(c.spent for c in campaigns),
            "total_leads": sum(c.leads for c in campaigns),
            "total_conversions": sum(c.conversions for c in campaigns)
        }


# Demo
if __name__ == "__main__":
    agent = CampaignAgent()
    
    print("📣 Campaign Agent Demo\n")
    
    # Create campaign
    c1 = agent.create_campaign("Q1 Product Launch", "Generate 500 leads", 50000)
    
    print(f"📋 Campaign: {c1.name}")
    print(f"   Objective: {c1.objective}")
    print(f"   Budget: ${c1.budget:,.0f}")
    
    # Add channels
    agent.add_channel(c1.id, ChannelType.PAID_ADS, 20000)
    agent.add_channel(c1.id, ChannelType.EMAIL, 10000)
    agent.add_channel(c1.id, ChannelType.SOCIAL, 20000)
    
    print(f"\n📢 Channels: {len(c1.channels)}")
    
    # Launch and track
    agent.launch(c1.id)
    agent.record_spend(c1.id, 25000, leads=350, conversions=45)
    
    print(f"\n💰 Spent: ${c1.spent:,.0f} ({c1.budget_used:.0f}%)")
    print(f"📈 Leads: {c1.leads} | Conversions: {c1.conversions}")
    print(f"🎯 ROI: {c1.roi:.1f}%")
