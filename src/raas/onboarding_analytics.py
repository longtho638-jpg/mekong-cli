"""Onboarding analytics engine for RaaS.

Provides conversion rate analysis, drop-off detection, time-to-complete metrics,
and cohort analysis for the onboarding funnel.

Usage:
    analytics = OnboardingAnalytics()
    rates = analytics.get_conversion_rates(days=30)
    drops = analytics.get_drop_off_points(days=30)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.raas.onboarding_funnel_store import OnboardingFunnelStore

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"


@dataclass
class ConversionRate:
    """Conversion rate between two funnel steps."""

    from_step: str
    to_step: str
    from_count: int
    to_count: int
    conversion_rate: float  # Percentage (0-100)
    drop_off_count: int
    drop_off_rate: float  # Percentage (0-100)


@dataclass
class DropOffPoint:
    """A point where users drop off from the funnel."""

    step_name: str
    step_order: int
    users_reached: int
    users_dropped: int
    drop_off_rate: float  # Percentage of users who dropped at this step
    drop_off_severity: str  # "critical" | "high" | "medium" | "low"


@dataclass
class TimeToComplete:
    """Time metrics for completing funnel steps."""

    step_name: str
    avg_hours: float
    median_hours: float
    min_hours: float
    max_hours: float
    sample_count: int


@dataclass
class CohortData:
    """Cohort analysis data."""

    period: str  # e.g., "2025-01-15" for daily, "2025-W03" for weekly
    period_type: str  # "daily" | "weekly" | "monthly"
    users_started: int
    users_completed: int
    conversion_rate: float
    avg_time_to_complete_hours: float
    users_by_step: Dict[str, int] = field(default_factory=dict)


class OnboardingAnalytics:
    """
    Analytics engine for onboarding funnel analysis.

    Provides:
    - Step-to-step conversion rates
    - Drop-off point identification
    - Average time to complete metrics
    - Cohort analysis (daily/weekly/monthly)

    Usage:
        analytics = OnboardingAnalytics()
        rates = analytics.get_conversion_rates(days=30)
    """

    def __init__(self, store: Optional[OnboardingFunnelStore] = None) -> None:
        """
        Initialize analytics engine.

        Args:
            store: Optional OnboardingFunnelStore instance. Creates default if None.
        """
        self._store = store or OnboardingFunnelStore(db_path=_DB_PATH)
        self._funnel_steps = OnboardingFunnelStore.FUNNEL_STEPS

    def get_conversion_rates(self, days: int = 30) -> List[ConversionRate]:
        """
        Calculate step-to-step conversion rates.

        Args:
            days: Look-back window in days (default 30).

        Returns:
            List of ConversionRate objects for each consecutive step pair.
        """
        funnel_data = self._store.get_funnel_data(days=days)
        steps = funnel_data.steps

        if len(steps) < 2:
            return []

        rates: List[ConversionRate] = []

        for i in range(len(steps) - 1):
            current_step = steps[i]
            next_step = steps[i + 1]

            from_count = current_step.count
            to_count = next_step.count

            if from_count == 0:
                conversion_rate = 0.0
            else:
                conversion_rate = (to_count / from_count) * 100

            drop_off_count = from_count - to_count
            drop_off_rate = (drop_off_count / from_count) * 100 if from_count > 0 else 0.0

            rates.append(
                ConversionRate(
                    from_step=current_step.step_name,
                    to_step=next_step.step_name,
                    from_count=from_count,
                    to_count=to_count,
                    conversion_rate=round(conversion_rate, 2),
                    drop_off_count=drop_off_count,
                    drop_off_rate=round(drop_off_rate, 2),
                )
            )

        logger.info(f"Calculated {len(rates)} conversion rates for last {days} days")
        return rates

    def get_drop_off_points(self, days: int = 30) -> List[DropOffPoint]:
        """
        Identify biggest drop-off points in the funnel.

        Args:
            days: Look-back window in days (default 30).

        Returns:
            List of DropOffPoint objects sorted by drop-off severity.
        """
        funnel_data = self._store.get_funnel_data(days=days)
        steps = funnel_data.steps

        if len(steps) < 2:
            return []

        drop_offs: List[DropOffPoint] = []
        initial_count = steps[0].count if steps else 0

        for i, step in enumerate(steps):
            # Calculate how many users dropped at this step
            # (users who reached this step but didn't reach the next)
            if i < len(steps) - 1:
                next_step_count = steps[i + 1].count
                users_dropped = step.count - next_step_count
            else:
                # Last step - no drop-off here (they completed)
                users_dropped = 0

            if initial_count > 0:
                drop_off_rate = (users_dropped / initial_count) * 100
            else:
                drop_off_rate = 0.0

            # Classify severity
            severity = self._classify_drop_off_severity(drop_off_rate)

            if users_dropped > 0:
                drop_offs.append(
                    DropOffPoint(
                        step_name=step.step_name,
                        step_order=step.step_order,
                        users_reached=step.count,
                        users_dropped=users_dropped,
                        drop_off_rate=round(drop_off_rate, 2),
                        drop_off_severity=severity,
                    )
                )

        # Sort by drop-off rate descending (biggest drop-offs first)
        drop_offs.sort(key=lambda x: x.drop_off_rate, reverse=True)

        logger.info(f"Identified {len(drop_offs)} drop-off points for last {days} days")
        return drop_offs

    def get_avg_time_to_complete(self, days: int = 30) -> List[TimeToComplete]:
        """
        Calculate average time from signup to each step completion.

        Args:
            days: Look-back window in days (default 30).

        Returns:
            List of TimeToComplete objects for each step.
        """
        try:
            with self._store._connect() as conn:
                cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

                time_metrics: List[TimeToComplete] = []

                # For each step, calculate time from first user event (signup) to that step
                for step_idx, step_name in enumerate(self._funnel_steps):
                    if step_idx == 0:
                        # First step - time is 0 by definition
                        continue

                    # Get all users who completed this step
                    rows = conn.execute(
                        """
                        SELECT
                            e1.user_id,
                            e1.created_at as signup_time,
                            e2.created_at as step_time
                        FROM onboarding_events e1
                        JOIN onboarding_events e2
                            ON e1.user_id = e2.user_id
                        WHERE e1.event_type = 'signup_started'
                          AND e2.event_type = ?
                          AND e1.created_at >= ?
                        ORDER BY e2.created_at
                        """,
                        (step_name, cutoff),
                    ).fetchall()

                    if not rows:
                        continue

                    # Calculate time differences in hours
                    hours_list: List[float] = []
                    for row in rows:
                        try:
                            signup = datetime.fromisoformat(row["signup_time"])
                            step_time = datetime.fromisoformat(row["step_time"])
                            delta_hours = (step_time - signup).total_seconds() / 3600
                            if delta_hours >= 0:  # Sanity check
                                hours_list.append(delta_hours)
                        except (ValueError, TypeError):
                            continue

                    if not hours_list:
                        continue

                    hours_list.sort()
                    n = len(hours_list)

                    time_metrics.append(
                        TimeToComplete(
                            step_name=step_name,
                            avg_hours=round(sum(hours_list) / n, 2),
                            median_hours=round(hours_list[n // 2], 2),
                            min_hours=round(min(hours_list), 2),
                            max_hours=round(max(hours_list), 2),
                            sample_count=n,
                        )
                    )

                logger.info(f"Calculated time-to-complete for {len(time_metrics)} steps")
                return time_metrics

        except Exception as e:
            logger.error(f"Failed to calculate time-to-complete: {e}")
            return []

    def get_cohort_data(
        self,
        period: str = "daily",
        days: int = 30,
    ) -> List[CohortData]:
        """
        Perform cohort analysis by period.

        Args:
            period: Cohort period - "daily", "weekly", or "monthly".
            days: Look-back window in days (default 30).

        Returns:
            List of CohortData objects for each period.
        """
        try:
            with self._store._connect() as conn:
                cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

                # Get all signup events in the period
                rows = conn.execute(
                    """
                    SELECT user_id, created_at
                    FROM onboarding_events
                    WHERE event_type = 'signup_started'
                      AND created_at >= ?
                    ORDER BY created_at
                    """,
                    (cutoff,),
                ).fetchall()

                if not rows:
                    return []

                # Group users by cohort period
                cohorts: Dict[str, List[str]] = {}

                for row in rows:
                    user_id = row["user_id"]
                    created_at = datetime.fromisoformat(row["created_at"])

                    # Determine period key
                    if period == "daily":
                        period_key = created_at.strftime("%Y-%m-%d")
                    elif period == "weekly":
                        period_key = created_at.strftime("%Y-W%W")
                    elif period == "monthly":
                        period_key = created_at.strftime("%Y-%m")
                    else:
                        period_key = created_at.strftime("%Y-%m-%d")

                    if period_key not in cohorts:
                        cohorts[period_key] = []
                    if user_id not in cohorts[period_key]:
                        cohorts[period_key].append(user_id)

                # Build cohort data
                cohort_data_list: List[CohortData] = []

                for period_key, user_ids in sorted(cohorts.items()):
                    cohort = self._build_cohort_data(
                        conn=conn,
                        period_key=period_key,
                        user_ids=user_ids,
                        period_type=period,
                    )
                    cohort_data_list.append(cohort)

                logger.info(f"Built cohort data for {len(cohort_data_list)} periods")
                return cohort_data_list

        except Exception as e:
            logger.error(f"Failed to build cohort data: {e}")
            return []

    def _build_cohort_data(
        self,
        conn: Any,
        period_key: str,
        user_ids: List[str],
        period_type: str,
    ) -> CohortData:
        """Build cohort data for a specific period."""
        if not user_ids:
            return CohortData(
                period=period_key,
                period_type=period_type,
                users_started=0,
                users_completed=0,
                conversion_rate=0.0,
                avg_time_to_complete_hours=0.0,
            )

        placeholders = ",".join("?" * len(user_ids))

        # Count users by step
        users_by_step: Dict[str, int] = {}
        for step in self._funnel_steps:
            row = conn.execute(
                f"""
                SELECT COUNT(DISTINCT user_id) as cnt
                FROM onboarding_events
                WHERE event_type = ?
                  AND user_id IN ({placeholders})
                """,
                [step] + user_ids,
            ).fetchone()
            users_by_step[step] = row["cnt"] if row else 0

        users_started = users_by_step.get("signup_started", 0)
        users_completed = users_by_step.get("first_mission_completed", 0)

        conversion_rate = 0.0
        if users_started > 0:
            conversion_rate = (users_completed / users_started) * 100

        # Calculate avg time to complete for this cohort
        avg_time = self._calculate_cohort_avg_time(conn, user_ids)

        return CohortData(
            period=period_key,
            period_type=period_type,
            users_started=users_started,
            users_completed=users_completed,
            conversion_rate=round(conversion_rate, 2),
            avg_time_to_complete_hours=round(avg_time, 2),
            users_by_step=users_by_step,
        )

    def _calculate_cohort_avg_time(
        self,
        conn: Any,
        user_ids: List[str],
    ) -> float:
        """Calculate average time to complete for a cohort."""
        if not user_ids:
            return 0.0

        placeholders = ",".join("?" * len(user_ids))

        rows = conn.execute(
            f"""
            SELECT
                e1.user_id,
                e1.created_at as signup_time,
                e2.created_at as complete_time
            FROM onboarding_events e1
            JOIN onboarding_events e2 ON e1.user_id = e2.user_id
            WHERE e1.event_type = 'signup_started'
              AND e2.event_type = 'first_mission_completed'
              AND e1.user_id IN ({placeholders})
            """,
            user_ids,
        ).fetchall()

        hours_list: List[float] = []
        for row in rows:
            try:
                signup = datetime.fromisoformat(row["signup_time"])
                complete = datetime.fromisoformat(row["complete_time"])
                delta_hours = (complete - signup).total_seconds() / 3600
                if delta_hours >= 0:
                    hours_list.append(delta_hours)
            except (ValueError, TypeError):
                continue

        if not hours_list:
            return 0.0

        return sum(hours_list) / len(hours_list)

    def _classify_drop_off_severity(self, drop_off_rate: float) -> str:
        """Classify drop-off severity based on rate."""
        if drop_off_rate >= 50:
            return "critical"
        elif drop_off_rate >= 30:
            return "high"
        elif drop_off_rate >= 15:
            return "medium"
        else:
            return "low"

    def get_summary(self, days: int = 30) -> Dict[str, Any]:
        """
        Get a comprehensive analytics summary.

        Args:
            days: Look-back window in days.

        Returns:
            Dictionary with all analytics metrics.
        """
        conversion_rates = self.get_conversion_rates(days=days)
        drop_offs = self.get_drop_off_points(days=days)
        time_metrics = self.get_avg_time_to_complete(days=days)

        # Find biggest drop-off point
        biggest_drop_off = drop_offs[0] if drop_offs else None

        return {
            "period_days": days,
            "conversion_rates": [
                {
                    "from": cr.from_step,
                    "to": cr.to_step,
                    "rate": cr.conversion_rate,
                    "drop_off_rate": cr.drop_off_rate,
                }
                for cr in conversion_rates
            ],
            "biggest_drop_off": {
                "step": biggest_drop_off.step_name,
                "rate": biggest_drop_off.drop_off_rate,
                "severity": biggest_drop_off.drop_off_severity,
            }
            if biggest_drop_off
            else None,
            "critical_drop_offs": [
                {"step": d.step_name, "rate": d.drop_off_rate}
                for d in drop_offs
                if d.drop_off_severity in ("critical", "high")
            ],
            "avg_time_to_complete": [
                {
                    "step": t.step_name,
                    "avg_hours": t.avg_hours,
                    "median_hours": t.median_hours,
                }
                for t in time_metrics
            ],
        }
