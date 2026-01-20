"""
Data models and Enums for Nonprofit Marketing.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class NonprofitCategory(Enum):
    """Sectors of non-profit organizations."""
    RELIGIOUS = "religious"
    CHARITY = "charity"
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    ENVIRONMENT = "environment"
    SOCIAL = "social"

class CampaignType(Enum):
    """Types of marketing campaigns for nonprofits."""
    FUNDRAISING = "fundraising"
    AWARENESS = "awareness"
    VOLUNTEER = "volunteer"
    EVENT = "event"
    MEMBERSHIP = "membership"

class CampaignStatus(Enum):
    """Lifecycle status of a campaign."""
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"

@dataclass
class NonprofitClient:
    """A non-profit organization client entity."""
    id: str
    name: str
    category: NonprofitCategory
    mission: str
    monthly_retainer: float = 0.0
    campaigns: List[str] = field(default_factory=list)
    total_raised: float = 0.0

    def __post_init__(self):
        if self.monthly_retainer < 0:
            raise ValueError("Retainer cannot be negative")

@dataclass
class DonationCampaign:
    """A fundraising campaign record."""
    id: str
    client_id: str
    name: str
    campaign_type: CampaignType
    goal: float
    raised: float = 0.0
    donors: int = 0
    status: CampaignStatus = CampaignStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    def __post_init__(self):
        if self.goal <= 0:
            raise ValueError("Campaign goal must be positive")
