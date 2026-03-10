"""
Usage Tracking Package — ROIaaS Phase 4

Feature-level tracking with command/feature events, deduplication, and analytics.
"""

from src.usage.usage_tracker import (
    UsageEvent,
    UsageTracker,
    get_tracker,
    track_command,
    track_feature,
)
from src.usage.decorators import (
    track_usage,
    track_command as track_command_decorator,
    track_feature as track_feature_decorator,
)


__all__ = [
    "UsageEvent",
    "UsageTracker",
    "get_tracker",
    "track_command",
    "track_feature",
    "track_usage",
    "track_command_decorator",
    "track_feature_decorator",
]
