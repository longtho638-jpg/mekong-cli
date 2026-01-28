"""
Cohort Analysis Service
=======================

Service for calculating user retention cohorts.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

class CohortService:
    """Service for calculating retention cohorts."""

    def __init__(self):
        self.db = get_db()

    def analyze_retention(
        self,
        period_type: str = "weekly", # weekly, monthly
        periods: int = 8
    ) -> Dict[str, Any]:
        """
        Calculate retention matrix.

        Args:
            period_type: 'weekly' or 'monthly'
            periods: Number of periods to look back

        Returns:
            Retention matrix data
        """
        try:
            # Strategy:
            # 1. Determine cohort for each user (based on first seen date)
            # 2. Track activity in subsequent periods

            # Calculate start date
            if period_type == "monthly":
                days_back = periods * 30
            else:
                days_back = periods * 7

            start_date_limit = (datetime.utcnow() - timedelta(days=days_back)).isoformat()

            # Fetch all events from start date
            # Optimization: Fetch only user_id and occurred_at
            response = self.db.table("usage_events")\
                .select("user_id, occurred_at")\
                .gte("occurred_at", start_date_limit)\
                .execute()

            events = response.data

            if not events:
                return {"cohorts": []}

            # Process in memory
            # 1. Identify User Cohorts (First event date)
            user_first_seen = {}
            user_activity = {}

            for e in events:
                uid = e['user_id']
                if not uid: continue

                dt = datetime.fromisoformat(e['occurred_at'].replace('Z', '+00:00'))

                # Determine period key (e.g., Week 1 2026, Month 1 2026)
                if period_type == "monthly":
                    period_key = dt.strftime("%Y-%m")
                else:
                    # ISO Week
                    isoyear, isoweek, _ = dt.isocalendar()
                    period_key = f"{isoyear}-W{isoweek:02d}"

                if uid not in user_first_seen:
                    user_first_seen[uid] = period_key
                    # In a real system, we'd query the users table for created_at
                    # but here we approximate with first event in the window if we assume window covers lifecycle
                    # OR we should treat the first event in this dataset as "active" but not necessarily "new"
                    # For strict cohort analysis, we usually mean "Acquisition Cohort".
                    # Let's assume user_first_seen within this window defines the cohort for this report.
                else:
                    # If we saw them earlier in the loop (events not sorted?), update
                    # But if we rely on DB sort order...
                    # Let's handle it robustly:
                    if period_key < user_first_seen[uid]:
                        user_first_seen[uid] = period_key

                if uid not in user_activity:
                    user_activity[uid] = set()
                user_activity[uid].add(period_key)

            # 2. Build Cohort Matrix
            cohorts: Dict[str, Dict[str, int]] = {}

            for uid, cohort_name in user_first_seen.items():
                if cohort_name not in cohorts:
                    cohorts[cohort_name] = {
                        "total_users": 0,
                        "retention": {}
                    }

                cohorts[cohort_name]["total_users"] += 1

                # Calculate retention for subsequent periods
                # We need to calculate offset (Period 0, Period 1, ...)
                # Simplifying: Just map period keys

                for active_period in user_activity[uid]:
                    if active_period >= cohort_name:
                        # Calculate distance
                        distance = self._calculate_distance(cohort_name, active_period, period_type)
                        if distance not in cohorts[cohort_name]["retention"]:
                            cohorts[cohort_name]["retention"][distance] = 0
                        cohorts[cohort_name]["retention"][distance] += 1

            # Format result list
            result_list = []
            sorted_cohorts = sorted(cohorts.keys(), reverse=True)

            for c_name in sorted_cohorts:
                data = cohorts[c_name]
                retention_list = []
                total = data["total_users"]

                for i in range(periods + 1):
                    count = data["retention"].get(i, 0)
                    percentage = round((count / total) * 100, 1) if total > 0 else 0
                    retention_list.append({
                        "period": i,
                        "count": count,
                        "percentage": percentage
                    })

                result_list.append({
                    "cohort": c_name,
                    "users": total,
                    "data": retention_list
                })

            return {"cohorts": result_list}

        except Exception as e:
            logger.error(f"Cohort analysis failed: {e}")
            return {"error": str(e)}

    def _calculate_distance(self, start: str, end: str, period_type: str) -> int:
        """Calculate number of periods between two date strings."""
        if start == end:
            return 0

        if period_type == "monthly":
            # YYYY-MM
            y1, m1 = map(int, start.split('-'))
            y2, m2 = map(int, end.split('-'))
            return (y2 - y1) * 12 + (m2 - m1)
        else:
            # YYYY-Www
            # Approximate logic
            y1, w1 = map(int, start.split('-W'))
            y2, w2 = map(int, end.split('-W'))

            # Simple diff (ignoring week 52/53 boundaries for simplicity in this MVP)
            # Better to convert to date of monday
            d1 = datetime.strptime(start + '-1', "%G-W%V-%u")
            d2 = datetime.strptime(end + '-1', "%G-W%V-%u")

            delta = d2 - d1
            return int(delta.days / 7)
