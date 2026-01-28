"""
Search Analytics Service
========================

Tracks search metrics including:
- Popular queries (Top searches)
- No-result searches (Content gaps)
- Search volume
- Click-through rates (placeholder for future implementation)

Uses Redis Sorted Sets for ranking and simple keys for counters.
Binh Pháp Ch.13: "Dụng Gián" - Knowing what the enemy (or user) seeks.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List

from backend.services.redis_client import redis_service

logger = logging.getLogger(__name__)

class SearchAnalyticsService:
    """
    Service to track and retrieve search analytics.
    """
    PREFIX = "search:analytics"
    TOP_QUERIES_KEY = f"{PREFIX}:top_queries"
    NO_RESULTS_KEY = f"{PREFIX}:no_results"
    DAILY_VOLUME_KEY = f"{PREFIX}:daily_volume"

    def __init__(self):
        self.redis = redis_service

    async def log_search(self, query: str, result_count: int, user_id: str = None):
        """
        Log a search event.
        Fire-and-forget style usually, but here we await for simplicity.
        """
        if not query or len(query.strip()) < 2:
            return

        normalized_query = query.strip().lower()
        today = datetime.now().strftime("%Y-%m-%d")

        try:
            # 1. Increment total volume for today
            await self.redis.get_client().incr(f"{self.DAILY_VOLUME_KEY}:{today}")

            # 2. Track top queries (Sorted Set: Score = Frequency, Member = Query)
            # Increment score by 1
            await self.redis.get_client().zincrby(self.TOP_QUERIES_KEY, 1, normalized_query)

            # 3. Track no-results queries
            if result_count == 0:
                await self.redis.get_client().zincrby(self.NO_RESULTS_KEY, 1, normalized_query)

        except Exception as e:
            logger.error(f"Error logging search analytics: {e}")

    async def get_top_queries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most popular search queries."""
        try:
            # ZREVRANGE returns list of (member, score) tuples
            items = await self.redis.get_client().zrevrange(
                self.TOP_QUERIES_KEY, 0, limit - 1, withscores=True
            )
            return [{"query": member.decode('utf-8'), "count": int(score)} for member, score in items]
        except Exception as e:
            logger.error(f"Error fetching top queries: {e}")
            return []

    async def get_no_result_queries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most frequent queries that returned no results."""
        try:
            items = await self.redis.get_client().zrevrange(
                self.NO_RESULTS_KEY, 0, limit - 1, withscores=True
            )
            return [{"query": member.decode('utf-8'), "count": int(score)} for member, score in items]
        except Exception as e:
            logger.error(f"Error fetching no-result queries: {e}")
            return []

    async def get_daily_volume(self, days: int = 7) -> Dict[str, int]:
        """Get search volume for the last N days."""
        # This implementation is naive (iterating keys or just checking known dates).
        # Better to use a TimeSeries module or just check last 7 generated keys.
        result = {}
        client = self.redis.get_client()

        # Check last 'days' days
        from datetime import timedelta

        import pandas as pd  # Optional, but standard python datetime works too

        start_date = datetime.now()
        for i in range(days):
            date_str = (start_date - timedelta(days=i)).strftime("%Y-%m-%d")
            key = f"{self.DAILY_VOLUME_KEY}:{date_str}"
            count = await client.get(key)
            result[date_str] = int(count) if count else 0

        return result

def get_search_analytics() -> SearchAnalyticsService:
    """Dependency provider."""
    return SearchAnalyticsService()
