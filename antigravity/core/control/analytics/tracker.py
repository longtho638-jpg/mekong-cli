"""Analytics Tracker - Event tracking with Redis-backed persistence and metrics aggregation."""

import logging
from datetime import date
from typing import Dict, List, Optional

from ..redis_client import RedisClient
from .collectors import EventCollector
from .exporters import RedisExporter
from .metrics import MetricsEngine
from .models import AnalyticsEvent

logger = logging.getLogger(__name__)

class AnalyticsTracker:
    """Event tracking with Redis backend (Facade)."""

    def __init__(self, redis_client: Optional[RedisClient] = None, buffer_size: int = 100):
        """Initialize analytics tracker with optional Redis client and buffer size."""
        self.redis = redis_client
        self.collector = EventCollector(buffer_size=buffer_size)
        self.exporter = RedisExporter(redis_client)
        self.metrics_engine = MetricsEngine(redis_client)
        logger.info(f"AnalyticsTracker initialized (buffer_size={buffer_size})")

    @property
    def event_buffer(self) -> List[AnalyticsEvent]:
        return self.collector.event_buffer

    def track(
        self, event_name: str, user_id: str, properties: Optional[Dict[str, object]] = None
    ) -> AnalyticsEvent:
        """Track an analytics event."""
        event = self.collector.collect(event_name, user_id, properties)

        # Store immediately if Redis available
        if self.redis:
            self.exporter.store_event(event)

        # Flush buffer if full
        if self.collector.is_buffer_full:
            self.flush()

        logger.debug(f"Event tracked: {event_name} (user={user_id})")
        return event

    def get_metrics(self, event_name: str, target_date: Optional[date] = None) -> Dict[str, int]:
        """Get metrics for an event on a specific date."""
        return self.metrics_engine.get_event_metrics(event_name, target_date)

    def get_recent_events(self, event_name: str, limit: int = 100) -> List[AnalyticsEvent]:
        """Get recent events for an event type."""
        redis_events = self.exporter.get_recent_events(event_name, limit)
        if not redis_events:
            return [e for e in self.event_buffer if e.event_name == event_name][:limit]
        return redis_events

    def flush(self):
        """Flush event buffer to Redis."""
        if not self.redis or not self.event_buffer:
            return

        try:
            flushed_count = len(self.event_buffer)
            for event in self.event_buffer:
                self.exporter.store_event(event)

            self.collector.clear_buffer()
            logger.info(f"Flushed {flushed_count} events to Redis")

        except Exception as e:
            logger.error(f"Error flushing events: {e}")

    def _store_event(self, event: AnalyticsEvent):
        """Store event in Redis (Legacy internal method)."""
        self.exporter.store_event(event)

    def get_summary(self, days: int = 7) -> Dict[str, object]:
        """Get analytics summary for the last N days."""
        # Get unique event names from buffer
        event_names = set(e.event_name for e in self.event_buffer)

        # Add event names that might be in Redis (this is a bit limited in the legacy version too)
        # In a real system we'd query Redis for keys, but we follow legacy logic here.

        summary_counts = self.metrics_engine.get_summary(event_names, days)

        return {
            "buffer_size": len(self.event_buffer),
            "redis_available": self.redis is not None,
            "events": summary_counts,
        }
