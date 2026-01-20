"""
Influencer Campaign Data Models.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import List, Optional


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
    id: str
    influencer_id: str
    content_type: ContentType
    status: str = "pending"
    reach: int = 0
    engagement: int = 0
    link_clicks: int = 0
    posted_at: Optional[datetime] = None

@dataclass
class InfluencerCampaign:
    id: str
    name: str
    objective: str
    budget: float
    status: CampaignStatus = CampaignStatus.DRAFT
    influencer_ids: List[str] = field(default_factory=list)
    deliverables: List[Deliverable] = field(default_factory=list)
    spend: float = 0
    revenue_attributed: float = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @property
    def total_reach(self) -> int:
        return sum(d.reach for d in self.deliverables)

    @property
    def total_engagement(self) -> int:
        return sum(d.engagement for d in self.deliverables)

    @property
    def roi(self) -> float:
        return ((self.revenue_attributed - self.spend) / self.spend * 100) if self.spend > 0 else 0
