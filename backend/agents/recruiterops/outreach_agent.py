"""
Outreach Agent - Email Sequences & Engagement
Manages candidate outreach and communication.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class OutreachStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    OPENED = "opened"
    REPLIED = "replied"
    SCHEDULED = "scheduled"
    BOUNCED = "bounced"


class SequenceStep(Enum):
    INITIAL = "initial"
    FOLLOW_UP_1 = "follow_up_1"
    FOLLOW_UP_2 = "follow_up_2"
    FINAL = "final"


@dataclass
class OutreachCampaign:
    """Outreach email campaign"""
    id: str
    candidate_name: str
    candidate_email: str
    job_title: str
    current_step: SequenceStep = SequenceStep.INITIAL
    status: OutreachStatus = OutreachStatus.DRAFT
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def response_time_hours(self) -> int:
        if self.replied_at and self.sent_at:
            return int((self.replied_at - self.sent_at).total_seconds() / 3600)
        return 0


class OutreachAgent:
    """
    Outreach Agent - Liên hệ Ứng viên
    
    Responsibilities:
    - Send email sequences
    - Track responses
    - Automate follow-ups
    - Measure engagement
    """
    
    # Follow-up intervals (days)
    FOLLOW_UP_INTERVALS = {
        SequenceStep.INITIAL: 3,
        SequenceStep.FOLLOW_UP_1: 5,
        SequenceStep.FOLLOW_UP_2: 7,
        SequenceStep.FINAL: 0
    }
    
    def __init__(self):
        self.name = "Outreach"
        self.status = "ready"
        self.campaigns: Dict[str, OutreachCampaign] = {}
        
    def create_campaign(
        self,
        candidate_name: str,
        candidate_email: str,
        job_title: str
    ) -> OutreachCampaign:
        """Create outreach campaign"""
        campaign_id = f"outreach_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        campaign = OutreachCampaign(
            id=campaign_id,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job_title
        )
        
        self.campaigns[campaign_id] = campaign
        return campaign
    
    def send(self, campaign_id: str) -> OutreachCampaign:
        """Send outreach email"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.status = OutreachStatus.SENT
        campaign.sent_at = datetime.now()
        
        interval = self.FOLLOW_UP_INTERVALS.get(campaign.current_step, 3)
        if interval > 0:
            campaign.next_follow_up = datetime.now() + timedelta(days=interval)
        
        return campaign
    
    def mark_opened(self, campaign_id: str) -> OutreachCampaign:
        """Mark email as opened"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.status = OutreachStatus.OPENED
        campaign.opened_at = datetime.now()
        
        return campaign
    
    def mark_replied(self, campaign_id: str) -> OutreachCampaign:
        """Mark as replied"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        campaign.status = OutreachStatus.REPLIED
        campaign.replied_at = datetime.now()
        
        return campaign
    
    def advance_sequence(self, campaign_id: str) -> OutreachCampaign:
        """Advance to next sequence step"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")
            
        campaign = self.campaigns[campaign_id]
        
        steps = list(SequenceStep)
        current_idx = steps.index(campaign.current_step)
        if current_idx < len(steps) - 1:
            campaign.current_step = steps[current_idx + 1]
        
        return campaign
    
    def get_pending_follow_ups(self) -> List[OutreachCampaign]:
        """Get campaigns needing follow-up"""
        now = datetime.now()
        return [
            c for c in self.campaigns.values()
            if c.next_follow_up and c.next_follow_up <= now and c.status not in [OutreachStatus.REPLIED, OutreachStatus.BOUNCED]
        ]
    
    def get_stats(self) -> Dict:
        """Get outreach statistics"""
        campaigns = list(self.campaigns.values())
        sent = [c for c in campaigns if c.status != OutreachStatus.DRAFT]
        opened = [c for c in campaigns if c.status in [OutreachStatus.OPENED, OutreachStatus.REPLIED]]
        replied = [c for c in campaigns if c.status == OutreachStatus.REPLIED]
        
        return {
            "total_campaigns": len(campaigns),
            "sent": len(sent),
            "open_rate": f"{len(opened)/len(sent)*100:.0f}%" if sent else "0%",
            "reply_rate": f"{len(replied)/len(sent)*100:.0f}%" if sent else "0%",
            "pending_follow_ups": len(self.get_pending_follow_ups()),
            "avg_response_time": sum(c.response_time_hours for c in replied) / len(replied) if replied else 0
        }


# Demo
if __name__ == "__main__":
    agent = OutreachAgent()
    
    print("📧 Outreach Agent Demo\n")
    
    # Create campaigns
    c1 = agent.create_campaign("Nguyen A", "a@email.com", "Senior Engineer")
    c2 = agent.create_campaign("Tran B", "b@email.com", "Product Manager")
    c3 = agent.create_campaign("Le C", "c@email.com", "Backend Dev")
    
    print(f"📋 Campaign: {c1.candidate_name}")
    print(f"   Job: {c1.job_title}")
    print(f"   Step: {c1.current_step.value}")
    
    # Send and track
    agent.send(c1.id)
    agent.send(c2.id)
    agent.mark_opened(c1.id)
    agent.mark_replied(c1.id)
    
    print(f"\n✅ Status: {c1.status.value}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Sent: {stats['sent']}")
    print(f"   Open Rate: {stats['open_rate']}")
    print(f"   Reply Rate: {stats['reply_rate']}")
