"""
Demand Gen Agent - B2B Lead Generation
Manages lead generation campaigns and MQLs.
"""

from dataclasses import dataclass
from typing import Dict
from datetime import datetime
from enum import Enum
import random


class Channel(Enum):
    WEBINAR = "webinar"
    CONTENT = "content"
    PAID_ADS = "paid_ads"
    ORGANIC = "organic"
    REFERRAL = "referral"
    EVENTS = "events"


class LeadStage(Enum):
    RAW = "raw"
    MQL = "mql"
    SQL = "sql"
    OPPORTUNITY = "opportunity"
    WON = "won"
    LOST = "lost"


@dataclass
class Lead:
    """B2B Lead"""
    id: str
    email: str
    company: str
    channel: Channel
    stage: LeadStage = LeadStage.RAW
    score: int = 0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


@dataclass
class DemandGenCampaign:
    """Demand generation campaign"""
    id: str
    name: str
    channel: Channel
    target_mqls: int
    leads_generated: int = 0
    mqls: int = 0
    cost: float = 0
    
    @property
    def mql_rate(self) -> float:
        return (self.mqls / self.leads_generated * 100) if self.leads_generated > 0 else 0
    
    @property
    def cost_per_mql(self) -> float:
        return self.cost / self.mqls if self.mqls > 0 else 0


class DemandGenAgent:
    """
    Demand Gen Agent - Tạo nhu cầu B2B
    
    Responsibilities:
    - Lead generation campaigns
    - MQL tracking
    - Channel attribution
    - Conversion funnels
    """
    
    def __init__(self):
        self.name = "Demand Gen"
        self.status = "ready"
        self.campaigns: Dict[str, DemandGenCampaign] = {}
        self.leads: Dict[str, Lead] = {}
        
    def create_campaign(
        self,
        name: str,
        channel: Channel,
        target_mqls: int,
        budget: float
    ) -> DemandGenCampaign:
        """Create demand gen campaign"""
        campaign_id = f"dg_{random.randint(100,999)}"
        
        campaign = DemandGenCampaign(
            id=campaign_id,
            name=name,
            channel=channel,
            target_mqls=target_mqls,
            cost=budget
        )
        
        self.campaigns[campaign_id] = campaign
        return campaign
    
    def generate_lead(
        self,
        campaign_id: str,
        email: str,
        company: str
    ) -> Lead:
        """Generate lead from campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        lead_id = f"lead_{random.randint(1000,9999)}"
        
        lead = Lead(
            id=lead_id,
            email=email,
            company=company,
            channel=campaign.channel,
            score=random.randint(0, 100)
        )
        
        self.leads[lead_id] = lead
        campaign.leads_generated += 1
        
        # Auto-qualify if score > 50
        if lead.score > 50:
            lead.stage = LeadStage.MQL
            campaign.mqls += 1
        
        return lead
    
    def qualify_lead(self, lead_id: str) -> Lead:
        """Qualify lead to MQL"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")
            
        self.leads[lead_id].stage = LeadStage.MQL
        return self.leads[lead_id]
    
    def get_stats(self) -> Dict:
        """Get demand gen statistics"""
        campaigns = list(self.campaigns.values())
        leads = list(self.leads.values())
        mqls = [l for l in leads if l.stage == LeadStage.MQL]
        
        return {
            "total_campaigns": len(campaigns),
            "total_leads": len(leads),
            "total_mqls": len(mqls),
            "avg_mql_rate": sum(c.mql_rate for c in campaigns) / len(campaigns) if campaigns else 0,
            "total_cost": sum(c.cost for c in campaigns)
        }


# Demo
if __name__ == "__main__":
    agent = DemandGenAgent()
    
    print("🎯 Demand Gen Agent Demo\n")
    
    # Create campaign
    c1 = agent.create_campaign("Q1 Webinar Series", Channel.WEBINAR, 100, 5000)
    
    print(f"📋 Campaign: {c1.name}")
    print(f"   Channel: {c1.channel.value}")
    print(f"   Target MQLs: {c1.target_mqls}")
    
    # Generate leads
    for i in range(50):
        agent.generate_lead(c1.id, f"lead{i}@company.com", f"Company {i}")
    
    print("\n📊 Results:")
    print(f"   Leads: {c1.leads_generated}")
    print(f"   MQLs: {c1.mqls}")
    print(f"   MQL Rate: {c1.mql_rate:.0f}%")
    print(f"   Cost/MQL: ${c1.cost_per_mql:.0f}")
