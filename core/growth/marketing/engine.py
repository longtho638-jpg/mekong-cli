"""
Content Marketing Strategy Engine.
"""
import logging
from datetime import datetime
from typing import List, Optional

from .models import (
    CalendarEntry,
    ChannelConfig,
    ChannelStrategy,
    ContentCalendar,
    ContentChannel,
    ContentPillar,
    ContentStrategy,
    ContentType,
    PerformanceMetrics,
    SearchIntent,
    SEOKeyword,
)

logger = logging.getLogger(__name__)

class ContentMarketingEngine:
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
            created_at=datetime.now(),
        )

    def generate_content_pillars(self, business_type: str) -> List[ContentPillar]:
        """Defines the core authority themes for the business."""
        return [
            ContentPillar("Expert Insights", "Educational content proving industry depth.", ["How-to", "Trends"], business_type),
            ContentPillar("Success Stories", "Social proof and case studies.", ["Results", "Testimonials"], business_type),
            ContentPillar("The Process", "Transparent look at how work is done.", ["behind-the-scenes", "workflow"], business_type),
            ContentPillar("Market Analysis", "Understanding external factors.", ["reports", "news"], business_type),
            ContentPillar("Community Hub", "Building connection with audience.", ["Q&A", "Events"], business_type),
        ]

    def generate_channel_strategy(self, business_type: str) -> ChannelStrategy:
        """Determines where content should be distributed."""
        channels = [
            ChannelConfig(ContentChannel.LINKEDIN, "Daily", priority=1),
            ChannelConfig(ContentChannel.BLOG, "2x/Week", priority=2),
        ]
        return ChannelStrategy(
            channels=channels,
            primary_channel=ContentChannel.LINKEDIN,
            distribution_weights={"LinkedIn": 80.0, "Blog": 60.0},
        )

    def generate_content_calendar(
        self, business_type: str, pillars: List[ContentPillar] = None
    ) -> ContentCalendar:
        """Creates a 4-week execution blueprint with pillar rotation."""
        if not pillars:
            pillars = self.generate_content_pillars(business_type)

        entries = []
        days = ["Monday", "Wednesday", "Friday"]

        for week in range(1, 5):
            for i, day in enumerate(days):
                pillar_idx = (week + i) % len(pillars)
                pillar = pillars[pillar_idx]
                ctype = ContentType.BLOG_POST if day == "Monday" else ContentType.THREAD

                entries.append(
                    CalendarEntry(
                        week=week, day=day, content_type=ctype,
                        topic=f"{pillar.name}: Key Insight",
                        channel=ContentChannel.LINKEDIN,
                        pillar=pillar.name,
                    )
                )

        return ContentCalendar(entries=entries)

    def generate_seo_keywords(self, business_type: str) -> List[SEOKeyword]:
        """Identifies target keywords for search dominance."""
        return [
            SEOKeyword(
                f"{business_type} automation",
                SearchIntent.TRANSACTIONAL,
                "High", "1K-10K", "General",
            )
        ]

    def get_performance_metrics(self) -> PerformanceMetrics:
        """Defines baseline KPIs."""
        return PerformanceMetrics()
