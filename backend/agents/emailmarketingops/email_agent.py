"""
Email Agent - Email Campaign Management
Manages email campaigns, lists, and deliverability.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict


class CampaignStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"


@dataclass
class EmailList:
    """Email list"""

    id: str
    name: str
    subscribers: int
    active: int
    bounced: int = 0
    unsubscribed: int = 0

    @property
    def health_score(self) -> float:
        return (self.active / self.subscribers * 100) if self.subscribers > 0 else 0


@dataclass
class EmailCampaign:
    """Email campaign"""

    id: str
    name: str
    subject: str
    list_id: str
    status: CampaignStatus = CampaignStatus.DRAFT
    sent: int = 0
    delivered: int = 0
    opened: int = 0
    clicked: int = 0
    bounced: int = 0
    unsubscribed: int = 0
    scheduled_at: datetime = None
    sent_at: datetime = None

    @property
    def open_rate(self) -> float:
        return (self.opened / self.delivered * 100) if self.delivered > 0 else 0

    @property
    def click_rate(self) -> float:
        return (self.clicked / self.delivered * 100) if self.delivered > 0 else 0

    @property
    def delivery_rate(self) -> float:
        return (self.delivered / self.sent * 100) if self.sent > 0 else 0


class EmailAgent:
    """
    Email Agent - Quản lý Email Marketing

    Responsibilities:
    - Email campaigns
    - List management
    - A/B testing
    - Deliverability tracking
    """

    def __init__(self):
        self.name = "Email"
        self.status = "ready"
        self.campaigns: Dict[str, EmailCampaign] = {}
        self.lists: Dict[str, EmailList] = {}

    def create_list(self, name: str, subscribers: int) -> EmailList:
        """Create email list"""
        list_id = f"list_{random.randint(100, 999)}"

        email_list = EmailList(
            id=list_id, name=name, subscribers=subscribers, active=int(subscribers * 0.95)
        )

        self.lists[list_id] = email_list
        return email_list

    def create_campaign(self, name: str, subject: str, list_id: str) -> EmailCampaign:
        """Create email campaign"""
        campaign_id = f"camp_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        campaign = EmailCampaign(id=campaign_id, name=name, subject=subject, list_id=list_id)

        self.campaigns[campaign_id] = campaign
        return campaign

    def send_campaign(self, campaign_id: str) -> EmailCampaign:
        """Send campaign"""
        if campaign_id not in self.campaigns:
            raise ValueError(f"Campaign not found: {campaign_id}")

        campaign = self.campaigns[campaign_id]
        email_list = self.lists.get(campaign.list_id)

        if email_list:
            campaign.sent = email_list.active
            campaign.delivered = int(campaign.sent * 0.98)
            campaign.opened = int(campaign.delivered * random.uniform(0.15, 0.35))
            campaign.clicked = int(campaign.opened * random.uniform(0.10, 0.25))
            campaign.bounced = campaign.sent - campaign.delivered

        campaign.status = CampaignStatus.SENT
        campaign.sent_at = datetime.now()

        return campaign

    def get_stats(self) -> Dict:
        """Get email statistics"""
        campaigns = list(self.campaigns.values())
        sent = [c for c in campaigns if c.status == CampaignStatus.SENT]

        return {
            "total_campaigns": len(campaigns),
            "sent": len(sent),
            "total_lists": len(self.lists),
            "total_subscribers": sum(l.subscribers for l in self.lists.values()),
            "avg_open_rate": sum(c.open_rate for c in sent) / len(sent) if sent else 0,
            "avg_click_rate": sum(c.click_rate for c in sent) / len(sent) if sent else 0,
        }


# Demo
if __name__ == "__main__":
    agent = EmailAgent()

    print("📧 Email Agent Demo\n")

    # Create list
    list1 = agent.create_list("Newsletter Subscribers", 10000)

    print(f"📋 List: {list1.name}")
    print(f"   Subscribers: {list1.subscribers}")
    print(f"   Health: {list1.health_score:.0f}%")

    # Create and send campaign
    c1 = agent.create_campaign("December Newsletter", "🎄 Holiday Special Inside!", list1.id)
    agent.send_campaign(c1.id)

    print(f"\n📧 Campaign: {c1.name}")
    print(f"   Subject: {c1.subject}")
    print(f"   Sent: {c1.sent}")
    print(f"   Delivered: {c1.delivered} ({c1.delivery_rate:.1f}%)")
    print(f"   Opens: {c1.opened} ({c1.open_rate:.1f}%)")
    print(f"   Clicks: {c1.clicked} ({c1.click_rate:.1f}%)")
