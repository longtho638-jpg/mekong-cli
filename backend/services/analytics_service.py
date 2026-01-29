"""
Analytics Service - Supabase Implementation
===========================================

Service for tracking and analyzing user activity using Supabase (PostgREST).

Tracks:
- API calls per user/day
- BizPlan generations
- Feature usage
- Daily/weekly/monthly aggregations
"""

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from backend.models.analytics_event import AnalyticsEvent
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for tracking and analyzing user activity."""

    def __init__(self):
        """Initialize analytics service with Supabase client."""
        self.db = get_db()

    def track_event(
        self,
        user_id: str,
        event_type: str,
        event_category: str,
        event_name: str,
        event_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Track a user event.

        Args:
            user_id: User identifier
            event_type: Type of event (e.g., 'api_call', 'feature_usage')
            event_category: Category (e.g., 'billing', 'core')
            event_name: Specific event name
            event_data: Event specific payload
            metadata: Additional metadata
            session_id: Session identifier

        Returns:
            Created event record
        """
        try:
            data = {
                "user_id": user_id,
                "event_type": event_type,
                "event_category": event_category,
                "event_name": event_name,
                "event_data": event_data or {},
                "metadata": metadata or {},
                "session_id": session_id,
                "occurred_at": datetime.utcnow().isoformat(),
            }

            result = self.db.table("usage_events").insert(data).execute()
            return result.data[0] if result.data else {}

        except Exception as e:
            logger.error(f"Failed to track event: {e}")
            return {}

    def get_user_stats(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get statistics for a specific user.

        Args:
            user_id: User identifier
            days: Number of days to look back

        Returns:
            User statistics dictionary
        """
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

        try:
            # Fetch events
            response = (
                self.db.table("usage_events")
                .select("*")
                .eq("user_id", user_id)
                .gte("occurred_at", start_date)
                .execute()
            )

            events = response.data

            return {
                "total_events": len(events),
                "events_by_type": self._aggregate_by_key(events, "event_type"),
                "events_by_category": self._aggregate_by_key(events, "event_category"),
                "recent_activity": events[:10],  # Last 10 events
            }
        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            return {"total_events": 0, "error": str(e)}

    def get_daily_metrics(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily aggregated metrics."""
        start_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()

        try:
            response = (
                self.db.table("usage_aggregates_daily")
                .select("*")
                .gte("date", start_date)
                .order("date")
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"Failed to get daily metrics: {e}")
            return []

    # Helpers
    def _aggregate_by_key(self, items: List[Dict[str, Any]], key: str) -> Dict[str, int]:
        counts = defaultdict(int)
        for item in items:
            val = item.get(key, "unknown")
            counts[val] += 1
        return dict(counts)
