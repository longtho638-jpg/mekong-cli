"""
Content Marketing Strategy Facade.
"""
from .engine import ContentMarketingEngine
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


class ContentMarketingStrategy(ContentMarketingEngine):
    def format_strategy(self, strategy: ContentStrategy) -> str:
        """Pretty-prints the strategy report."""
        lines = [
            f"🎯 STRATEGY FOR: {strategy.business_type.upper()}",
            "═" * 50,
            f"Pillars: {len(strategy.pillars)}",
            f"Primary Channel: {strategy.channel_strategy.primary_channel.value if strategy.channel_strategy else 'N/A'}",
            "═" * 50,
        ]
        return "\n".join(lines)
