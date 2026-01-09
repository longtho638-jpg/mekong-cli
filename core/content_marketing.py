"""
🎯 Content Marketing Strategy Generator
========================================

Generate complete content marketing strategies for businesses.
Based on AgencyOS /content-marketing specification.

Features:
- Content pillars & themes
- Channel strategy
- Content calendar template
- SEO keyword recommendations
- Performance metrics

🏯 Binh Pháp Alignment: 火攻篇 (Hoả Công) - Content disruption
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime, date, timedelta
import random


class ContentChannel(Enum):
    """Content distribution channels."""
    BLOG = "Blog"
    LINKEDIN = "LinkedIn"
    TWITTER = "Twitter/X"
    YOUTUBE = "YouTube"
    INSTAGRAM = "Instagram"
    EMAIL = "Email Newsletter"
    PODCAST = "Podcast"
    MEDIUM = "Medium"


class ContentType(Enum):
    """Content format types."""
    BLOG_POST = "Blog Post"
    THREAD = "Thread"
    CAROUSEL = "Carousel"
    VIDEO = "Video"
    INFOGRAPHIC = "Infographic"
    CASE_STUDY = "Case Study"
    WEBINAR = "Webinar"
    NEWSLETTER = "Newsletter"


class SearchIntent(Enum):
    """SEO search intent types."""
    INFORMATIONAL = "Informational"
    NAVIGATIONAL = "Navigational"
    TRANSACTIONAL = "Transactional"
    COMMERCIAL = "Commercial Investigation"


@dataclass
class ContentPillar:
    """Content pillar/theme."""
    name: str
    description: str
    topics: List[str] = field(default_factory=list)
    target_audience: str = ""
    content_types: List[ContentType] = field(default_factory=list)


@dataclass
class ChannelConfig:
    """Channel configuration."""
    channel: ContentChannel
    frequency: str  # e.g., "3x/week", "daily"
    content_types: List[ContentType] = field(default_factory=list)
    priority: int = 1  # 1=highest
    notes: str = ""


@dataclass
class ChannelStrategy:
    """Complete channel strategy."""
    channels: List[ChannelConfig] = field(default_factory=list)
    primary_channel: ContentChannel = ContentChannel.BLOG
    distribution_weights: Dict[str, float] = field(default_factory=dict)


@dataclass
class CalendarEntry:
    """Content calendar entry."""
    week: int
    day: str
    content_type: ContentType
    topic: str
    channel: ContentChannel
    pillar: str
    status: str = "Planned"


@dataclass
class ContentCalendar:
    """Content calendar template."""
    entries: List[CalendarEntry] = field(default_factory=list)
    weeks: int = 4
    start_date: date = None


@dataclass
class SEOKeyword:
    """SEO keyword recommendation."""
    keyword: str
    search_intent: SearchIntent
    difficulty: str  # Low, Medium, High
    monthly_volume: str  # Estimated
    pillar: str
    priority: int = 1


@dataclass
class PerformanceMetrics:
    """Recommended performance metrics."""
    engagement_rate_target: float = 3.0  # %
    click_through_rate_target: float = 2.0  # %
    conversion_rate_target: float = 1.0  # %
    email_open_rate_target: float = 25.0  # %
    monthly_traffic_target: int = 5000
    leads_per_month_target: int = 100
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "Engagement Rate Target": f"{self.engagement_rate_target}%",
            "CTR Target": f"{self.click_through_rate_target}%",
            "Conversion Rate Target": f"{self.conversion_rate_target}%",
            "Email Open Rate Target": f"{self.email_open_rate_target}%",
            "Monthly Traffic Target": f"{self.monthly_traffic_target:,}",
            "Leads/Month Target": self.leads_per_month_target,
        }


@dataclass
class ContentStrategy:
    """Complete content marketing strategy."""
    business_type: str
    pillars: List[ContentPillar] = field(default_factory=list)
    channel_strategy: ChannelStrategy = None
    calendar: ContentCalendar = None
    keywords: List[SEOKeyword] = field(default_factory=list)
    metrics: PerformanceMetrics = None
    created_at: datetime = None


class ContentMarketingStrategy:
    """
    Content Marketing Strategy Generator.
    
    Generate complete content strategies including:
    - Content pillars & themes
    - Channel strategy
    - Content calendar template
    - SEO keyword recommendations
    - Performance metrics
    
    🏯 Binh Pháp: 火攻篇 (Hoả Công) - Content disruption
    """
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Any]:
        """Load strategy templates by business type."""
        return {
            "e-commerce blog": {
                "pillars": [
                    ("Product Education", "Help customers understand products", ["product guides", "comparison posts", "how-to tutorials"]),
                    ("Industry Trends", "Stay ahead of market changes", ["trend reports", "market analysis", "predictions"]),
                    ("Customer Success", "Showcase real results", ["case studies", "testimonials", "before/after"]),
                    ("Lifestyle & Tips", "Integrate products into daily life", ["lifestyle content", "tips & tricks", "hacks"]),
                    ("Behind the Scenes", "Build brand authenticity", ["team stories", "production process", "company culture"]),
                ],
                "channels": [
                    (ContentChannel.BLOG, "2x/week", 1),
                    (ContentChannel.INSTAGRAM, "daily", 2),
                    (ContentChannel.EMAIL, "weekly", 3),
                    (ContentChannel.YOUTUBE, "1x/week", 4),
                ],
                "keywords": [
                    ("best [product] for [use case]", SearchIntent.COMMERCIAL, "Medium"),
                    ("how to use [product]", SearchIntent.INFORMATIONAL, "Low"),
                    ("[product] vs [competitor]", SearchIntent.COMMERCIAL, "High"),
                    ("[product] review", SearchIntent.COMMERCIAL, "Medium"),
                    ("buy [product] online", SearchIntent.TRANSACTIONAL, "High"),
                ],
            },
            "B2B thought leadership": {
                "pillars": [
                    ("Industry Insights", "Deep analysis and expertise", ["whitepapers", "research", "data analysis"]),
                    ("How-To Guides", "Practical actionable content", ["tutorials", "frameworks", "templates"]),
                    ("Case Studies", "Prove ROI and results", ["success stories", "ROI analysis", "implementations"]),
                    ("Trends & Predictions", "Position as forward-thinking", ["trend reports", "future of", "predictions"]),
                    ("Thought Leadership", "Expert opinions and perspectives", ["op-eds", "interviews", "expert roundups"]),
                ],
                "channels": [
                    (ContentChannel.LINKEDIN, "daily", 1),
                    (ContentChannel.BLOG, "2x/week", 2),
                    (ContentChannel.EMAIL, "weekly", 3),
                    (ContentChannel.PODCAST, "bi-weekly", 4),
                ],
                "keywords": [
                    ("[industry] best practices", SearchIntent.INFORMATIONAL, "Medium"),
                    ("how to [solve B2B problem]", SearchIntent.INFORMATIONAL, "Low"),
                    ("[industry] software comparison", SearchIntent.COMMERCIAL, "High"),
                    ("[industry] ROI calculator", SearchIntent.TRANSACTIONAL, "Medium"),
                    ("[industry] trends 2026", SearchIntent.INFORMATIONAL, "Low"),
                ],
            },
            "local business social media": {
                "pillars": [
                    ("Community Spotlight", "Local stories and partnerships", ["local events", "partner features", "community news"]),
                    ("Behind the Business", "Personal connection", ["team intros", "day in the life", "business story"]),
                    ("Tips & Education", "Position as local expert", ["local tips", "how-to", "FAQ answers"]),
                    ("Customer Love", "Social proof", ["reviews", "shoutouts", "user content"]),
                    ("Promotions & Events", "Drive action", ["sales", "events", "limited offers"]),
                ],
                "channels": [
                    (ContentChannel.INSTAGRAM, "daily", 1),
                    (ContentChannel.TWITTER, "2x/day", 2),
                    (ContentChannel.EMAIL, "weekly", 3),
                    (ContentChannel.BLOG, "weekly", 4),
                ],
                "keywords": [
                    ("best [service] in [city]", SearchIntent.TRANSACTIONAL, "Low"),
                    ("[service] near me", SearchIntent.TRANSACTIONAL, "Medium"),
                    ("[city] [service] reviews", SearchIntent.COMMERCIAL, "Low"),
                    ("[service] [city] prices", SearchIntent.COMMERCIAL, "Low"),
                    ("top rated [service] [area]", SearchIntent.COMMERCIAL, "Low"),
                ],
            },
            "digital agency": {
                "pillars": [
                    ("Case Studies", "Showcase client results", ["success stories", "ROI breakdowns", "transformations"]),
                    ("Industry Expertise", "Demonstrate knowledge", ["guides", "tutorials", "best practices"]),
                    ("Tech & Tools", "Show modern capabilities", ["tool reviews", "tech stack", "integrations"]),
                    ("Agency Life", "Build culture and trust", ["team stories", "process", "culture"]),
                    ("Thought Leadership", "Position as authority", ["trends", "opinions", "predictions"]),
                ],
                "channels": [
                    (ContentChannel.LINKEDIN, "daily", 1),
                    (ContentChannel.BLOG, "2x/week", 2),
                    (ContentChannel.TWITTER, "3x/day", 3),
                    (ContentChannel.YOUTUBE, "weekly", 4),
                ],
                "keywords": [
                    ("[service] agency", SearchIntent.TRANSACTIONAL, "High"),
                    ("best [service] agency", SearchIntent.COMMERCIAL, "High"),
                    ("hire [service] expert", SearchIntent.TRANSACTIONAL, "Medium"),
                    ("[service] pricing", SearchIntent.COMMERCIAL, "Medium"),
                    ("[service] vs in-house", SearchIntent.COMMERCIAL, "Low"),
                ],
            },
        }
    
    def generate_strategy(self, business_type: str) -> ContentStrategy:
        """
        Generate complete content marketing strategy.
        
        Args:
            business_type: Type of business (e.g., "e-commerce blog", "B2B thought leadership")
            
        Returns:
            ContentStrategy with all components
        """
        # Normalize business type
        business_key = business_type.lower()
        if business_key not in self.templates:
            business_key = "digital agency"  # Default
        
        strategy = ContentStrategy(
            business_type=business_type,
            pillars=self.generate_content_pillars(business_key),
            channel_strategy=self.generate_channel_strategy(business_key),
            calendar=self.generate_content_calendar(business_key),
            keywords=self.generate_seo_keywords(business_key),
            metrics=self.get_performance_metrics(),
            created_at=datetime.now()
        )
        
        return strategy
    
    def generate_content_pillars(self, business_key: str) -> List[ContentPillar]:
        """Generate content pillars & themes."""
        template = self.templates.get(business_key, self.templates["digital agency"])
        
        pillars = []
        for name, desc, topics in template["pillars"]:
            pillar = ContentPillar(
                name=name,
                description=desc,
                topics=topics,
                target_audience=business_key.title(),
                content_types=[
                    ContentType.BLOG_POST,
                    ContentType.CAROUSEL,
                    ContentType.VIDEO
                ]
            )
            pillars.append(pillar)
        
        return pillars
    
    def generate_channel_strategy(self, business_key: str) -> ChannelStrategy:
        """Generate channel distribution strategy."""
        template = self.templates.get(business_key, self.templates["digital agency"])
        
        channels = []
        weights = {}
        total_priority = sum(4 - c[2] + 1 for c in template["channels"])
        
        for channel, frequency, priority in template["channels"]:
            config = ChannelConfig(
                channel=channel,
                frequency=frequency,
                priority=priority,
                content_types=[ContentType.BLOG_POST, ContentType.CAROUSEL],
            )
            channels.append(config)
            
            # Calculate weight (inverse of priority)
            weight = (4 - priority + 1) / total_priority * 100
            weights[channel.value] = round(weight, 1)
        
        return ChannelStrategy(
            channels=channels,
            primary_channel=channels[0].channel if channels else ContentChannel.BLOG,
            distribution_weights=weights
        )
    
    def generate_content_calendar(self, business_key: str) -> ContentCalendar:
        """Generate 4-week content calendar template."""
        template = self.templates.get(business_key, self.templates["digital agency"])
        
        entries = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        pillars = [p[0] for p in template["pillars"]]
        channels = [c[0] for c in template["channels"]]
        
        for week in range(1, 5):
            for i, day in enumerate(days[:3]):  # Mon, Tue, Wed
                pillar = pillars[i % len(pillars)]
                channel = channels[i % len(channels)]
                
                entry = CalendarEntry(
                    week=week,
                    day=day,
                    content_type=ContentType.BLOG_POST if i == 0 else ContentType.CAROUSEL,
                    topic=f"{pillar}: Topic {week * 3 + i}",
                    channel=channel,
                    pillar=pillar
                )
                entries.append(entry)
        
        return ContentCalendar(
            entries=entries,
            weeks=4,
            start_date=date.today()
        )
    
    def generate_seo_keywords(self, business_key: str) -> List[SEOKeyword]:
        """Generate SEO keyword recommendations."""
        template = self.templates.get(business_key, self.templates["digital agency"])
        pillars = [p[0] for p in template["pillars"]]
        
        keywords = []
        volumes = ["100-1K", "1K-10K", "10K-100K"]
        
        for i, (kw, intent, difficulty) in enumerate(template["keywords"]):
            keyword = SEOKeyword(
                keyword=kw,
                search_intent=intent,
                difficulty=difficulty,
                monthly_volume=random.choice(volumes),
                pillar=pillars[i % len(pillars)],
                priority=i + 1
            )
            keywords.append(keyword)
        
        return keywords
    
    def get_performance_metrics(self) -> PerformanceMetrics:
        """Get recommended performance tracking metrics."""
        return PerformanceMetrics(
            engagement_rate_target=3.0,
            click_through_rate_target=2.5,
            conversion_rate_target=1.5,
            email_open_rate_target=25.0,
            monthly_traffic_target=10000,
            leads_per_month_target=150
        )
    
    def format_strategy(self, strategy: ContentStrategy) -> str:
        """Format strategy for display."""
        lines = []
        
        # Header
        lines.append("=" * 60)
        lines.append("🎯 CONTENT MARKETING STRATEGY")
        lines.append("=" * 60)
        lines.append(f"\n📋 Business Type: {strategy.business_type}")
        lines.append(f"📅 Generated: {strategy.created_at.strftime('%Y-%m-%d %H:%M')}")
        
        # Pillars
        lines.append("\n" + "-" * 60)
        lines.append("📚 CONTENT PILLARS")
        lines.append("-" * 60)
        for i, pillar in enumerate(strategy.pillars, 1):
            lines.append(f"\n{i}. {pillar.name}")
            lines.append(f"   {pillar.description}")
            lines.append(f"   Topics: {', '.join(pillar.topics)}")
        
        # Channel Strategy
        lines.append("\n" + "-" * 60)
        lines.append("📢 CHANNEL STRATEGY")
        lines.append("-" * 60)
        lines.append(f"\nPrimary Channel: {strategy.channel_strategy.primary_channel.value}")
        lines.append("\nDistribution:")
        for channel in strategy.channel_strategy.channels:
            weight = strategy.channel_strategy.distribution_weights.get(channel.channel.value, 0)
            lines.append(f"   • {channel.channel.value}: {channel.frequency} ({weight}%)")
        
        # Content Calendar
        lines.append("\n" + "-" * 60)
        lines.append("📆 CONTENT CALENDAR (4 Weeks)")
        lines.append("-" * 60)
        current_week = 0
        for entry in strategy.calendar.entries:
            if entry.week != current_week:
                current_week = entry.week
                lines.append(f"\n  Week {current_week}:")
            lines.append(f"   • {entry.day}: {entry.content_type.value} - {entry.pillar}")
        
        # SEO Keywords
        lines.append("\n" + "-" * 60)
        lines.append("🔍 SEO KEYWORDS")
        lines.append("-" * 60)
        for kw in strategy.keywords:
            lines.append(f"\n   • \"{kw.keyword}\"")
            lines.append(f"     Intent: {kw.search_intent.value} | Difficulty: {kw.difficulty}")
            lines.append(f"     Volume: {kw.monthly_volume} | Pillar: {kw.pillar}")
        
        # Performance Metrics
        lines.append("\n" + "-" * 60)
        lines.append("📊 PERFORMANCE METRICS")
        lines.append("-" * 60)
        for metric, value in strategy.metrics.to_dict().items():
            lines.append(f"   • {metric}: {value}")
        
        # Footer
        lines.append("\n" + "=" * 60)
        lines.append("🏯 Binh Pháp: 火攻篇 - Content Disruption Strategy")
        lines.append("   Quality over quantity | Repurpose across channels")
        lines.append("=" * 60)
        
        return "\n".join(lines)


# Demo
if __name__ == "__main__":
    import sys
    
    business_type = sys.argv[1] if len(sys.argv) > 1 else "digital agency"
    
    strategy_gen = ContentMarketingStrategy()
    result = strategy_gen.generate_strategy(business_type)
    print(strategy_gen.format_strategy(result))
