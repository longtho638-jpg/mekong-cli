"""
ETL Service - Business Intelligence Aggregation
===============================================

Extracts, Transforms, and Loads data into metrics snapshots.
Runs daily via cron/scheduler to populate 'metrics_snapshots'.

Metrics calculated:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Active Subscriptions
- Churn Rate (Monthly)
- New Users (Daily)
- Active Users (Daily)
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from backend.models.metrics_snapshot import MetricsSnapshot
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

class ETLService:
    """Service for aggregating business metrics."""

    def __init__(self):
        self.db = get_db()

    def run_daily_etl(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Run all daily ETL jobs.

        Args:
            target_date: Date to calculate metrics for (defaults to yesterday)
        """
        if target_date is None:
            # Default to yesterday as we calculate full day metrics
            target_date = datetime.utcnow().date() - timedelta(days=1)

        logger.info(f"Starting ETL for date: {target_date}")

        results = {
            "mrr": self.calculate_mrr(target_date),
            "users": self.calculate_user_growth(target_date),
            "churn": self.calculate_churn(target_date)
        }

        logger.info(f"ETL Completed: {results}")
        return results

    def calculate_mrr(self, target_date: date) -> float:
        """Calculate MRR for a specific date."""
        try:
            # Sum amount of all active subscriptions
            # Logic: status=active/trialing
            # Convert yearly to monthly (/12)

            # Note: Supabase/PostgREST doesn't support complex aggregation easily in one call
            # without a stored procedure or view.
            # For MVP, we fetch active subscriptions.
            # For scale, this should be a SQL View or RPC.

            response = self.db.table("subscriptions")\
                .select("amount_cents, billing_cycle")\
                .in_("status", ["active", "trialing"])\
                .execute()

            total_mrr_cents = 0
            for sub in response.data:
                amount = sub.get("amount_cents", 0)
                cycle = sub.get("billing_cycle", "monthly")

                if cycle == "yearly":
                    total_mrr_cents += amount / 12
                else:
                    total_mrr_cents += amount

            mrr_value = total_mrr_cents / 100.0

            self._save_snapshot(
                date_obj=target_date,
                name="mrr",
                value=mrr_value,
                dimensions={"currency": "USD"}
            )

            return mrr_value

        except Exception as e:
            logger.error(f"Failed to calculate MRR: {e}")
            return 0.0

    def calculate_user_growth(self, target_date: date) -> int:
        """Calculate new users for the date."""
        try:
            start_dt = target_date.isoformat()
            end_dt = (target_date + timedelta(days=1)).isoformat()

            response = self.db.table("users")\
                .select("*", count="exact", head=True)\
                .gte("created_at", start_dt)\
                .lt("created_at", end_dt)\
                .execute()

            new_users = response.count or 0

            self._save_snapshot(
                date_obj=target_date,
                name="new_users",
                value=float(new_users)
            )

            # Also get total users
            total_response = self.db.table("users")\
                .select("*", count="exact", head=True)\
                .lt("created_at", end_dt)\
                .execute()

            total_users = total_response.count or 0

            self._save_snapshot(
                date_obj=target_date,
                name="total_users",
                value=float(total_users)
            )

            return new_users

        except Exception as e:
            logger.error(f"Failed to calculate user growth: {e}")
            return 0

    def calculate_churn(self, target_date: date) -> float:
        """Calculate churn rate (canceled subscriptions / total active at start)."""
        try:
            # 1. Get cancellations on this date
            start_dt = target_date.isoformat()
            end_dt = (target_date + timedelta(days=1)).isoformat()

            cancel_response = self.db.table("subscriptions")\
                .select("*", count="exact", head=True)\
                .gte("canceled_at", start_dt)\
                .lt("canceled_at", end_dt)\
                .execute()

            churned_count = cancel_response.count or 0

            # 2. Get active subscriptions count at start of day (approximate with current for MVP or query historic if stored)
            # For simple daily churn: cancellations / (active + cancellations)
            active_response = self.db.table("subscriptions")\
                .select("*", count="exact", head=True)\
                .in_("status", ["active", "trialing"])\
                .execute()

            active_count = active_response.count or 1 # Avoid div by zero

            churn_rate = (churned_count / (active_count + churned_count)) * 100 if (active_count + churned_count) > 0 else 0.0

            self._save_snapshot(
                date_obj=target_date,
                name="churn_rate_daily",
                value=churn_rate,
                dimensions={"type": "subscription"}
            )

            return churn_rate

        except Exception as e:
            logger.error(f"Failed to calculate churn: {e}")
            return 0.0

    def _save_snapshot(self, date_obj: date, name: str, value: float, dimensions: Dict = {}):
        """Save metric to database."""
        try:
            data = {
                "date": date_obj.isoformat(),
                "metric_name": name,
                "metric_value": value,
                "dimensions": dimensions,
                "created_at": datetime.utcnow().isoformat()
            }

            # Upsert based on unique constraint (date, metric_name, dimensions)
            # Note: Supabase upsert requires specifying conflict columns if not PK
            # But postgrest-py upsert usually handles PK.
            # We defined UNIQUE(date, metric_name, dimensions) in SQL.
            # We'll use 'on_conflict' param if supported, or just insert and ignore error for MVP

            self.db.table("metrics_snapshots").upsert(
                data,
                on_conflict="date, metric_name, dimensions"
            ).execute()

        except Exception as e:
            logger.error(f"Failed to save snapshot {name}: {e}")
