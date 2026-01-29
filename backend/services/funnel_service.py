"""
Funnel Analysis Service
=======================

Service for analyzing conversion funnels to track user journey through defined steps.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)


class FunnelService:
    """Service for calculating conversion funnels."""

    def __init__(self):
        self.db = get_db()

    def analyze_funnel(self, steps: List[str], start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Analyze a conversion funnel.

        Args:
            steps: List of event_name strings defining the funnel steps.
            start_date: ISO start date string.
            end_date: ISO end date string.

        Returns:
            Dictionary containing funnel metrics.
        """
        if not steps:
            return {"error": "No steps provided"}

        try:
            # For a proper production implementation, this should ideally be done
            # via a specialized ClickHouse DB or optimized SQL query.
            # For VIBE/MVP, we will fetch relevant events and process in Python
            # or make sequential queries (careful with N+1).

            # Implementation Strategy:
            # 1. Fetch all unique users who completed the first step in the time range.
            # 2. For each subsequent step, filter the users from the previous step
            #    who completed the next step *after* the previous step.

            # results = []

            # Step 1: Base Cohort
            # step1_event = steps[0]

            # Supabase/PostgREST doesn't support complex self-joins easily via the client
            # without RPC. We'll use a simplified approach:
            # Count unique users for each step, but strictly this isn't a "funnel"
            # (which requires sequence).
            # To do sequence properly without SQL access, we need to fetch events.

            # Let's try to get a sequence.
            # We will use a simplified "Step-by-Step" filtering approach.

            # Get all events for the steps in the date range
            # Warning: extensive data fetch. Limit to reasonable amount or use RPC.
            response = (
                self.db.table("usage_events")
                .select("user_id, event_name, occurred_at")
                .in_("event_name", steps)
                .gte("occurred_at", start_date)
                .lte("occurred_at", end_date)
                .order("occurred_at")
                .execute()
            )

            events = response.data

            # Process in memory (VIBE/MVP scale)
            # Group by user
            user_events: Dict[str, List[Dict]] = {}
            for e in events:
                uid = e["user_id"]
                if not uid:
                    continue
                if uid not in user_events:
                    user_events[uid] = []
                user_events[uid].append(e)

            # Calculate funnel
            # step_counts = [0] * len(steps)
            step_users: List[Set[str]] = [set() for _ in steps]

            for uid, u_events in user_events.items():
                # Check steps sequence
                current_step_idx = 0
                last_time = None

                # Sort user events by time (already sorted from DB, but ensure)
                # u_events.sort(key=lambda x: x['occurred_at'])

                for event in u_events:
                    if current_step_idx >= len(steps):
                        break

                    target_step = steps[current_step_idx]

                    if event["event_name"] == target_step:
                        # Time check? We usually just want sequence
                        # If strict time ordering needed:
                        if last_time and event["occurred_at"] < last_time:
                            continue

                        # Step completed
                        step_users[current_step_idx].add(uid)
                        current_step_idx += 1
                        last_time = event["occurred_at"]

            # Compile results
            funnel_data = []
            previous_count = 0

            for i, step in enumerate(steps):
                count = len(step_users[i])
                drop_off = 0
                conversion_rate = 0.0

                if i > 0:
                    previous_count = len(step_users[i - 1])
                    if previous_count > 0:
                        conversion_rate = (count / previous_count) * 100
                        drop_off = 100 - conversion_rate
                elif count > 0:
                    conversion_rate = 100.0  # First step is 100% of itself

                funnel_data.append(
                    {
                        "step": step,
                        "count": count,
                        "conversion_rate": round(conversion_rate, 2),
                        "drop_off_rate": round(drop_off, 2),
                    }
                )

            return {
                "funnel": funnel_data,
                "total_entries": len(step_users[0]) if step_users else 0,
                "overall_conversion": round((len(step_users[-1]) / len(step_users[0]) * 100), 2)
                if step_users and len(step_users[0]) > 0
                else 0,
            }

        except Exception as e:
            logger.error(f"Funnel analysis failed: {e}")
            return {"error": str(e)}
