"""
Analytics Tracker - Event Tracking & Metrics
=============================================

Provides analytics tracking with:
- Event recording
- Metrics aggregation
- Redis-backed persistence
- Time-series data management
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import date, datetime
from typing import Dict, List, Optional

from .redis_client import RedisClient

logger = logging.getLogger(__name__)


@dataclass
class AnalyticsEvent:
    """
    Analytics event data structure.

    Attributes:
        event_name: Event identifier (e.g., 'user_login', 'feature_used')
        user_id: User identifier
        timestamp: Event timestamp
        properties: Additional event properties
    """

    event_name: str
    user_id: str
    timestamp: datetime
    properties: Dict[str, object]

    def to_dict(self) -> Dict[str, object]:
        """Convert to dictionary for storage."""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, object]) -> "AnalyticsEvent":
        """Create from dictionary."""
        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        return cls(**data)


class AnalyticsTracker:
    """Event tracking with Redis backend."""

    def __init__(self, redis_client: Optional[RedisClient] = None, buffer_size: int = 100):
        """
        Initialize analytics tracker.

        Args:
            redis_client: Optional Redis client for persistence
            buffer_size: Maximum events to buffer before flush
        """
        self.redis = redis_client
        self.buffer_size = buffer_size
        self.event_buffer: List[AnalyticsEvent] = []
        logger.info(f"AnalyticsTracker initialized (buffer_size={buffer_size})")

    def track(
        self, event_name: str, user_id: str, properties: Optional[Dict[str, object]] = None
    ) -> AnalyticsEvent:
        """
        Track an analytics event.

        Args:
            event_name: Event identifier
            user_id: User identifier
            properties: Additional event properties

        Returns:
            Created AnalyticsEvent
        """
        event = AnalyticsEvent(
            event_name=event_name,
            user_id=user_id,
            timestamp=datetime.now(),
            properties=properties or {},
        )

        # Add to buffer
        self.event_buffer.append(event)

        # Store immediately if Redis available
        if self.redis:
            self._store_event(event)

        # Flush buffer if full
        if len(self.event_buffer) >= self.buffer_size:
            self.flush()

        logger.debug(f"Event tracked: {event_name} (user={user_id})")
        return event

    def get_metrics(self, event_name: str, target_date: Optional[date] = None) -> Dict[str, int]:
        """
        Get metrics for an event on a specific date.

        Args:
            event_name: Event identifier
            target_date: Date to query (default: today)

        Returns:
            Dictionary with metric counts
        """
        if not self.redis:
            logger.warning("Redis not available, cannot retrieve metrics")
            return {"count": 0}

        target_date = target_date or date.today()
        key = f"analytics:{event_name}:{target_date}"

        try:
            # Get hash data from Redis
            data = self.redis.client.hgetall(key)
            if not data:
                return {"count": 0}

            # Convert bytes to int
            metrics = {}
            for field, value in data.items():
                try:
                    metrics[field] = int(value)
                except (ValueError, TypeError):
                    metrics[field] = 0

            return metrics

        except Exception as e:
            logger.error(f"Error retrieving metrics for {event_name}: {e}")
            return {"count": 0}

    def get_recent_events(
        self, event_name: str, limit: int = 100
    ) -> List[AnalyticsEvent]:
        """
        Get recent events for an event type.

        Args:
            event_name: Event identifier
            limit: Maximum number of events to return

        Returns:
            List of AnalyticsEvent objects
        """
        if not self.redis:
            # Return from buffer only
            return [e for e in self.event_buffer if e.event_name == event_name][:limit]

        try:
            # Get from Redis list
            key = f"analytics:events:{event_name}"
            event_data = self.redis.client.lrange(key, 0, limit - 1)

            events = []
            for data in event_data:
                try:
                    event_dict = json.loads(data)
                    events.append(AnalyticsEvent.from_dict(event_dict))
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    logger.error(f"Invalid event data: {e}")
                    continue

            return events

        except Exception as e:
            logger.error(f"Error retrieving events for {event_name}: {e}")
            return []

    def flush(self):
        """Flush event buffer to Redis."""
        if not self.redis or not self.event_buffer:
            return

        try:
            flushed = len(self.event_buffer)
            for event in self.event_buffer:
                self._store_event(event)

            self.event_buffer.clear()
            logger.info(f"Flushed {flushed} events to Redis")

        except Exception as e:
            logger.error(f"Error flushing events: {e}")

    def _store_event(self, event: AnalyticsEvent):
        """
        Store event in Redis.

        Args:
            event: AnalyticsEvent to store
        """
        if not self.redis:
            return

        try:
            # Increment daily counter
            date_key = f"analytics:{event.event_name}:{event.timestamp.date()}"
            self.redis.client.hincrby(date_key, "count", 1)
            self.redis.client.expire(date_key, 30 * 24 * 3600)  # 30 days TTL

            # Store event details in list
            events_key = f"analytics:events:{event.event_name}"
            event_json = json.dumps(event.to_dict())
            self.redis.client.lpush(events_key, event_json)

            # Trim list to last 1000 events
            self.redis.client.ltrim(events_key, 0, 999)

        except Exception as e:
            logger.error(f"Error storing event {event.event_name}: {e}")

    def get_summary(self, days: int = 7) -> Dict[str, object]:
        """
        Get analytics summary for the last N days.

        Args:
            days: Number of days to include

        Returns:
            Dictionary with summary statistics
        """
        summary = {
            "buffer_size": len(self.event_buffer),
            "redis_available": self.redis is not None,
            "events": {},
        }

        # Get unique event names from buffer
        event_names = set(e.event_name for e in self.event_buffer)

        # Add counts for each event
        for event_name in event_names:
            total = 0
            for i in range(days):
                target_date = date.today() - timedelta(days=i)
                metrics = self.get_metrics(event_name, target_date)
                total += metrics.get("count", 0)

            summary["events"][event_name] = total

        return summary


# Import timedelta for get_summary
from datetime import timedelta

__all__ = ["AnalyticsEvent", "AnalyticsTracker"]
