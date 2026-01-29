"""
Revenue Service - Real-time calculation of MRR, ARR, Churn, and LTV.

This service connects to Supabase and uses the database functions
created in the revenue dashboard schema migration.
"""

import os
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from supabase import Client, create_client


class RevenueService:
    """Service for calculating revenue metrics using Supabase."""

    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        self.client: Client = create_client(supabase_url, supabase_key)

    def get_current_mrr(self, tenant_id: Optional[str] = None) -> Decimal:
        """
        Get current Monthly Recurring Revenue.

        Args:
            tenant_id: Optional tenant filter

        Returns:
            Current MRR as Decimal
        """
        try:
            result = self.client.rpc("calculate_current_mrr", {"p_tenant_id": tenant_id}).execute()

            return Decimal(str(result.data)) if result.data else Decimal("0")
        except Exception as e:
            print(f"Error calculating MRR: {e}")
            return Decimal("0")

    def get_current_arr(self, tenant_id: Optional[str] = None) -> Decimal:
        """
        Get current Annual Recurring Revenue (MRR × 12).

        Args:
            tenant_id: Optional tenant filter

        Returns:
            Current ARR as Decimal
        """
        try:
            result = self.client.rpc("calculate_current_arr", {"p_tenant_id": tenant_id}).execute()

            return Decimal(str(result.data)) if result.data else Decimal("0")
        except Exception as e:
            print(f"Error calculating ARR: {e}")
            return Decimal("0")

    def get_churn_rate(
        self, tenant_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Decimal]:
        """
        Calculate customer and revenue churn rates for a period.

        Args:
            tenant_id: Tenant ID
            start_date: Period start (defaults to 30 days ago)
            end_date: Period end (defaults to today)

        Returns:
            Dict with customer_churn_rate and revenue_churn_rate
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        try:
            result = self.client.rpc(
                "calculate_churn_rate",
                {
                    "p_tenant_id": tenant_id,
                    "p_start_date": start_date.isoformat(),
                    "p_end_date": end_date.isoformat(),
                },
            ).execute()

            if result.data and len(result.data) > 0:
                row = result.data[0]
                return {
                    "customer_churn_rate": Decimal(str(row.get("customer_churn_rate", 0))),
                    "revenue_churn_rate": Decimal(str(row.get("revenue_churn_rate", 0))),
                }

            return {"customer_churn_rate": Decimal("0"), "revenue_churn_rate": Decimal("0")}
        except Exception as e:
            print(f"Error calculating churn: {e}")
            return {"customer_churn_rate": Decimal("0"), "revenue_churn_rate": Decimal("0")}

    def get_avg_ltv(self, tenant_id: str) -> Decimal:
        """
        Calculate average customer Lifetime Value.

        Args:
            tenant_id: Tenant ID

        Returns:
            Average LTV as Decimal
        """
        try:
            result = self.client.rpc("calculate_avg_ltv", {"p_tenant_id": tenant_id}).execute()

            return Decimal(str(result.data)) if result.data else Decimal("0")
        except Exception as e:
            print(f"Error calculating LTV: {e}")
            return Decimal("0")

    def get_revenue_stats(self, tenant_id: Optional[str] = None) -> Dict:
        """
        Get comprehensive revenue statistics.

        Args:
            tenant_id: Optional tenant filter

        Returns:
            Dict with all revenue metrics
        """
        # Get MRR and ARR
        mrr = self.get_current_mrr(tenant_id)
        arr = self.get_current_arr(tenant_id)

        # Get churn rates (last 30 days)
        churn = (
            self.get_churn_rate(tenant_id)
            if tenant_id
            else {"customer_churn_rate": Decimal("0"), "revenue_churn_rate": Decimal("0")}
        )

        # Get LTV
        ltv = self.get_avg_ltv(tenant_id) if tenant_id else Decimal("0")

        # Get subscriber counts from revenue_stats_view
        try:
            query = self.client.table("revenue_stats_view").select("*")
            if tenant_id:
                query = query.eq("tenant_id", tenant_id)

            result = query.execute()

            if result.data and len(result.data) > 0:
                stats = result.data[0]
            else:
                stats = {
                    "active_subscribers": 0,
                    "trial_subscribers": 0,
                    "churned_subscribers": 0,
                    "free_users": 0,
                    "pro_users": 0,
                    "enterprise_users": 0,
                }
        except Exception as e:
            print(f"Error fetching subscriber stats: {e}")
            stats = {
                "active_subscribers": 0,
                "trial_subscribers": 0,
                "churned_subscribers": 0,
                "free_users": 0,
                "pro_users": 0,
                "enterprise_users": 0,
            }

        return {
            "mrr": float(mrr),
            "arr": float(arr),
            "customer_churn_rate": float(churn["customer_churn_rate"]),
            "revenue_churn_rate": float(churn["revenue_churn_rate"]),
            "avg_ltv": float(ltv),
            "active_subscribers": stats.get("active_subscribers", 0),
            "trial_subscribers": stats.get("trial_subscribers", 0),
            "churned_subscribers": stats.get("churned_subscribers", 0),
            "free_users": stats.get("free_users", 0),
            "pro_users": stats.get("pro_users", 0),
            "enterprise_users": stats.get("enterprise_users", 0),
        }

    def get_recent_payments(self, tenant_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """
        Get recent payments for the dashboard.

        Args:
            tenant_id: Optional tenant filter
            limit: Number of payments to return

        Returns:
            List of payment records
        """
        try:
            query = (
                self.client.table("payments")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
            )

            if tenant_id:
                query = query.eq("tenant_id", tenant_id)

            result = query.execute()

            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent payments: {e}")
            return []

    def get_revenue_trend(self, tenant_id: Optional[str] = None, days: int = 30) -> List[Dict]:
        """
        Get revenue trend data for charting.

        Args:
            tenant_id: Optional tenant filter
            days: Number of days to look back

        Returns:
            List of daily revenue snapshots
        """
        try:
            start_date = date.today() - timedelta(days=days)

            query = (
                self.client.table("revenue_snapshots")
                .select("snapshot_date, total_revenue, mrr, active_subscribers")
                .gte("snapshot_date", start_date.isoformat())
                .order("snapshot_date", desc=False)
            )

            if tenant_id:
                query = query.eq("tenant_id", tenant_id)

            result = query.execute()

            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching revenue trend: {e}")
            return []

    def create_snapshot(self, tenant_id: str) -> Dict:
        """
        Create a revenue snapshot for today.

        Args:
            tenant_id: Tenant ID

        Returns:
            Created snapshot record
        """
        try:
            stats = self.get_revenue_stats(tenant_id)
            churn = self.get_churn_rate(tenant_id)

            # Calculate total revenue (all time)
            revenue_query = (
                self.client.table("payments")
                .select("amount")
                .eq("tenant_id", tenant_id)
                .eq("status", "succeeded")
            )
            revenue_result = revenue_query.execute()
            total_revenue = (
                sum(item["amount"] for item in revenue_result.data) if revenue_result.data else 0
            )

            # Calculate new subscribers (today)
            today_start = date.today().isoformat()
            new_subs_query = (
                self.client.table("subscriptions")
                .select("id", count="exact")
                .eq("tenant_id", tenant_id)
                .gte("created_at", today_start)
            )
            new_subs_result = new_subs_query.execute()
            new_subscribers = new_subs_result.count if new_subs_result.count is not None else 0

            snapshot_data = {
                "tenant_id": tenant_id,
                "snapshot_date": date.today().isoformat(),
                "total_revenue": float(total_revenue),
                "mrr": stats["mrr"],
                "arr": stats["arr"],
                "active_subscribers": stats["active_subscribers"],
                "new_subscribers": new_subscribers,
                "churned_subscribers": stats["churned_subscribers"],
                "revenue_churn_rate": float(churn["revenue_churn_rate"]),
                "customer_churn_rate": float(churn["customer_churn_rate"]),
                "avg_ltv": stats["avg_ltv"],
            }

            result = self.client.table("revenue_snapshots").upsert(snapshot_data).execute()

            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Error creating snapshot: {e}")
            return {}
