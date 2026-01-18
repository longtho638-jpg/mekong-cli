"""
Content Module - Data Entities
"""

from dataclasses import dataclass
from enum import Enum


class ContentPillar(Enum):
    """5 Content Pillars for agency growth."""

    CODE_TO_CASHFLOW = "code_to_cashflow"
    SOLOPRENEUR_MINDSET = "solopreneur_mindset"
    LOCAL_AI = "local_ai"
    AUTOMATION_HACKS = "automation_hacks"
    AGENCY_LIFE = "agency_life"


class ContentFormat(Enum):
    """Standard social media formats."""

    TWITTER_THREAD = "Twitter Thread"
    CAROUSEL = "Carousel Post"
    VIDEO_SHORT = "Short Video"
    BLOG_POST = "Blog Post"
    LIVE_STREAM = "Live Stream"
    CASE_STUDY = "Case Study"


@dataclass
class ContentIdea:
    """A content idea entity."""

    pillar: ContentPillar
    title: str
    hook: str
    format: ContentFormat
    cta: str
