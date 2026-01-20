"""
Analytics Package
=================

Event tracking and metrics aggregation with Redis backend.
"""

from .models import AnalyticsEvent
from .tracker import AnalyticsTracker

__all__ = ["AnalyticsEvent", "AnalyticsTracker"]
