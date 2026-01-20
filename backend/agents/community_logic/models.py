"""
Community Agent data models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional


class Platform(Enum):
    FACEBOOK = "facebook"
    ZALO = "zalo"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"

@dataclass
class ScheduledPost:
    id: str
    content: str
    platform: Platform
    scheduled_at: datetime
    published_at: Optional[datetime] = None
    status: str = "scheduled"
    engagement: Dict = field(default_factory=dict)
