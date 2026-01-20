"""
Data models and Enums for Content Marketing Strategy.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional


class ContentChannel(Enum):
    """Distribution platforms."""
    BLOG = "Blog"
    LINKEDIN = "LinkedIn"
    TWITTER = "Twitter/X"
    YOUTUBE = "YouTube"
    INSTAGRAM = "Instagram"
    EMAIL = "Email Newsletter"
    PODCAST = "Podcast"
    MEDIUM = "Medium"

class ContentType(Enum):
    """Media formats."""
    BLOG_POST = "Blog Post"
    THREAD = "Thread"
    CAROUSEL = "Carousel"
    VIDEO = "Video"
    INFOGRAPHIC = "Infographic"
    CASE_STUDY = "Case Study"
    WEBINAR = "Webinar"
    NEWSLETTER = "Newsletter"

class SearchIntent(Enum):
    """SEO intent levels."""
    INFORMATIONAL = "Informational"
    NAVIGATIONAL = "Navigational"
    TRANSACTIONAL = "Transactional"
    COMMERCIAL = "Commercial Investigation"

@dataclass
class ContentPillar:
    """A primary thematic area for content production."""
    name: str
    description: str
    topics: List[str] = field(default_factory=list)
    target_audience: str = ""
    content_types: List[ContentType] = field(default_factory=list)

@dataclass
class ChannelConfig:
    """Settings for a specific channel."""
    channel: ContentChannel
    frequency: str
    content_types: List[ContentType] = field(default_factory=list)
    priority: int = 1
    notes: str = ""

@dataclass
class ChannelStrategy:
    """The aggregate multi-channel distribution plan."""
    channels: List[ChannelConfig] = field(default_factory=list)
    primary_channel: ContentChannel = ContentChannel.BLOG
    distribution_weights: Dict[str, float] = field(default_factory=dict)

@dataclass
class CalendarEntry:
    """A scheduled unit of content."""
    week: int
    day: str
    content_type: ContentType
    topic: str
    channel: ContentChannel
    pillar: str
    status: str = "Planned"

@dataclass
class ContentCalendar:
    """A structured execution timeline."""
    entries: List[CalendarEntry] = field(default_factory=list)
    weeks: int = 4
    start_date: date = field(default_factory=date.today)

@dataclass
class SEOKeyword:
    """Targeted keyword for search dominance."""
    keyword: str
    search_intent: SearchIntent
    difficulty: str
    monthly_volume: str
    pillar: str
    priority: int = 1

@dataclass
class PerformanceMetrics:
    """Target performance indicators."""
    engagement_rate_target: float = 3.0
    click_through_rate_target: float = 2.0
    conversion_rate_target: float = 1.0
    email_open_rate_target: float = 25.0
    monthly_traffic_target: int = 5000
    leads_per_month_target: int = 100

@dataclass
class ContentStrategy:
    """The complete content marketing strategy package."""
    business_type: str
    pillars: List[ContentPillar] = field(default_factory=list)
    channel_strategy: Optional[ChannelStrategy] = None
    calendar: Optional[ContentCalendar] = None
    keywords: List[SEOKeyword] = field(default_factory=list)
    metrics: Optional[PerformanceMetrics] = None
    created_at: datetime = field(default_factory=datetime.now)
