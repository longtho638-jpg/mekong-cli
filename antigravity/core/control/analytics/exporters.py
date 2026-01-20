import json
import logging
from typing import Optional
from .models import AnalyticsEvent
from ..redis_client import RedisClient

logger = logging.getLogger(__name__)

class RedisExporter:
    """Exports analytics events to Redis."""

    def __init__(self, redis_client: Optional[RedisClient] = None):
        self.redis = redis_client

    def store_event(self, event: AnalyticsEvent):
        """Store event in Redis."""
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

    def get_recent_events(self, event_name: str, limit: int = 100):
        """Get recent events from Redis."""
        if not self.redis:
            return []

        try:
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
