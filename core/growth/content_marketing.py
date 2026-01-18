"""
🎯 Content Marketing Strategy Generator
========================================

Generates end-to-end content marketing strategies for the Agency OS. 
Deploys specialized pillars and channel distribution models based on 
the industry niche and brand voice.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime, date, timedelta

# Configure logging
logger = logging.getLogger(__name__)

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


class ContentMarketingStrategy:
    """
    🎯 The Strategy Engine
    
    Orchestrates the creation of high-impact disruptive content plans.
    """

    def generate_strategy(self, business_type: str) -> ContentStrategy:
        """High-level entry point for full strategy generation."""
        pillars = self.generate_content_pillars(business_type)
        return ContentStrategy(
            business_type=business_type,
            pillars=pillars,
            channel_strategy=self.generate_channel_strategy(business_type),
            calendar=self.generate_content_calendar(business_type, pillars),
            keywords=self.generate_seo_keywords(business_type),
            metrics=self.get_performance_metrics(),
            created_at=datetime.now()
        )

    def generate_content_pillars(self, business_type: str) -> List[ContentPillar]:
        """Defines the core authority themes for the business."""
        return [
            ContentPillar("Expert Insights", "Educational content proving industry depth.", ["How-to", "Trends"], business_type),
            ContentPillar("Success Stories", "Social proof and case studies.", ["Results", "Testimonials"], business_type),
            ContentPillar("The Process", "Transparent look at how work is done.", ["behind-the-scenes", "workflow"], business_type),
            ContentPillar("Market Analysis", "Understanding external factors.", ["reports", "news"], business_type),
            ContentPillar("Community Hub", "Building connection with audience.", ["Q&A", "Events"], business_type)
        ]

    def generate_channel_strategy(self, business_type: str) -> ChannelStrategy:
        """Determines where content should be distributed."""
        channels = [
            ChannelConfig(ContentChannel.LINKEDIN, "Daily", priority=1),
            ChannelConfig(ContentChannel.BLOG, "2x/Week", priority=2)
        ]
        return ChannelStrategy(
            channels=channels,
            primary_channel=ContentChannel.LINKEDIN,
            distribution_weights={"LinkedIn": 80.0, "Blog": 60.0}
        )

    def generate_content_calendar(self, business_type: str, pillars: List[ContentPillar] = None) -> ContentCalendar:
        """Creates a 4-week execution blueprint with pillar rotation."""
        if not pillars:
            pillars = self.generate_content_pillars(business_type)
            
        entries = []
        days = ["Monday", "Wednesday", "Friday"]
        
        for week in range(1, 5):
            for i, day in enumerate(days):
                # Rotate pillars
                pillar_idx = (week + i) % len(pillars)
                pillar = pillars[pillar_idx]
                
                # Alternate types
                ctype = ContentType.BLOG_POST if day == "Monday" else ContentType.THREAD
                
                entries.append(CalendarEntry(
                    week=week, 
                    day=day, 
                    content_type=ctype,
                    topic=f"{pillar.name}: Key Insight", 
                    channel=ContentChannel.LINKEDIN, 
                    pillar=pillar.name
                ))
                
        return ContentCalendar(entries=entries)

    def generate_seo_keywords(self, business_type: str) -> List[SEOKeyword]:
        """Identifies target keywords for search dominance."""
        return [
            SEOKeyword(
                f"{business_type} automation", SearchIntent.TRANSACTIONAL,
                "High", "1K-10K", "General"
            )
        ]

    def get_performance_metrics(self) -> PerformanceMetrics:
        """Defines baseline KPIs."""
        return PerformanceMetrics()

    def format_strategy(self, strategy: ContentStrategy) -> str:
        """Pretty-prints the strategy report."""
        lines = [
            f"🎯 STRATEGY FOR: {strategy.business_type.upper()}",
            "═" * 50,
            f"Pillars: {len(strategy.pillars)}",
            f"Primary Channel: {strategy.channel_strategy.primary_channel.value if strategy.channel_strategy else 'N/A'}",
            "═" * 50
        ]
        return "\n".join(lines)