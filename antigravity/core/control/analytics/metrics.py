import logging
from datetime import date, timedelta
from typing import Dict, Optional
from ..redis_client import RedisClient

logger = logging.getLogger(__name__)

class MetricsEngine:
    """Aggregates and retrieves metrics from Redis."""

    def __init__(self, redis_client: Optional[RedisClient] = None):
        self.redis = redis_client

    def get_event_metrics(self, event_name: str, target_date: Optional[date] = None) -> Dict[str, int]:
        """Get metrics for an event on a specific date."""
        if not self.redis:
            logger.warning("Redis not available, cannot retrieve metrics")
            return {"count": 0}

        target_date = target_date or date.today()
        key = f"analytics:{event_name}:{target_date}"

        try:
            data = self.redis.client.hgetall(key)
            if not data:
                return {"count": 0}

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

    def get_summary(self, event_names: set, days: int = 7) -> Dict[str, int]:
        """Get analytics summary for the last N days for a set of events."""
        summary_counts = {}
        for event_name in event_names:
            total = 0
            for i in range(days):
                target_date = date.today() - timedelta(days=i)
                metrics = self.get_event_metrics(event_name, target_date)
                total += metrics.get("count", 0)
            summary_counts[event_name] = total
        return summary_counts
