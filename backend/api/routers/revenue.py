"""
Revenue API Router - Financial Metrics and Operations.

Real-time revenue dashboard with MRR, ARR, Churn, and LTV metrics.
"""

from datetime import date, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from backend.api.security.rbac import require_admin, require_viewer
from backend.api.services.revenue_service import RevenueService
from backend.services.cache.decorators import cache

router = APIRouter(prefix="/revenue", tags=["revenue"])

# --- Schemas ---


class RevenueMetrics(BaseModel):
    """Current revenue metrics."""

    mrr: float
    arr: float
    customer_churn_rate: float
    revenue_churn_rate: float
    avg_ltv: float
    active_subscribers: int
    trial_subscribers: int
    churned_subscribers: int
    free_users: int
    pro_users: int
    enterprise_users: int


class PaymentRecord(BaseModel):
    """Payment transaction record."""

    id: str
    amount: float
    currency: str
    status: str
    payment_method: Optional[str] = None
    created_at: str


class RevenueTrendPoint(BaseModel):
    """Single point in revenue trend chart."""

    snapshot_date: str
    total_revenue: float
    mrr: float
    active_subscribers: int


class DashboardResponse(BaseModel):
    """Complete revenue dashboard data."""

    metrics: RevenueMetrics
    recent_payments: List[PaymentRecord]
    trend: List[RevenueTrendPoint]


# --- Dependency ---


def get_revenue_service() -> RevenueService:
    """Get RevenueService instance."""
    return RevenueService()


# --- Endpoints ---


@router.get("/dashboard", response_model=DashboardResponse)
@cache(
    ttl=300,
    prefix="revenue:dashboard",
    key_func=lambda tenant_id=None, **kwargs: f"tenant:{tenant_id}",
    tags=["revenue"],
)
async def get_revenue_dashboard(
    tenant_id: Optional[str] = Query(None), service: RevenueService = Depends(get_revenue_service)
):
    """
    Get complete revenue dashboard data.

    Returns:
        - Current MRR, ARR, churn rates, LTV
        - Recent payment transactions
        - 30-day revenue trend
    """
    try:
        # Get core metrics
        metrics_data = service.get_revenue_stats(tenant_id)
        metrics = RevenueMetrics(**metrics_data)

        # Get recent payments
        payments_data = service.get_recent_payments(tenant_id, limit=10)
        recent_payments = [
            PaymentRecord(
                id=p["id"],
                amount=p["amount"],
                currency=p["currency"],
                status=p["status"],
                payment_method=p.get("payment_method"),
                created_at=p["created_at"],
            )
            for p in payments_data
        ]

        # Get revenue trend
        trend_data = service.get_revenue_trend(tenant_id, days=30)
        trend = [
            RevenueTrendPoint(
                snapshot_date=t["snapshot_date"],
                total_revenue=t["total_revenue"],
                mrr=t["mrr"],
                active_subscribers=t["active_subscribers"],
            )
            for t in trend_data
        ]

        return DashboardResponse(metrics=metrics, recent_payments=recent_payments, trend=trend)
    except Exception as e:
        # Log error and return default values
        print(f"Error in revenue dashboard: {e}")
        return DashboardResponse(
            metrics=RevenueMetrics(
                mrr=0,
                arr=0,
                customer_churn_rate=0,
                revenue_churn_rate=0,
                avg_ltv=0,
                active_subscribers=0,
                trial_subscribers=0,
                churned_subscribers=0,
                free_users=0,
                pro_users=0,
                enterprise_users=0,
            ),
            recent_payments=[],
            trend=[],
        )


@router.get("/metrics", response_model=RevenueMetrics)
@cache(
    ttl=300,
    prefix="revenue:metrics",
    key_func=lambda tenant_id=None, **kwargs: f"tenant:{tenant_id}",
    tags=["revenue"],
)
async def get_revenue_metrics(
    tenant_id: Optional[str] = Query(None), service: RevenueService = Depends(get_revenue_service)
):
    """
    Get current revenue metrics only.

    Returns MRR, ARR, churn rates, LTV, and subscriber counts.
    """
    try:
        data = service.get_revenue_stats(tenant_id)
        return RevenueMetrics(**data)
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return RevenueMetrics(
            mrr=0,
            arr=0,
            customer_churn_rate=0,
            revenue_churn_rate=0,
            avg_ltv=0,
            active_subscribers=0,
            trial_subscribers=0,
            churned_subscribers=0,
            free_users=0,
            pro_users=0,
            enterprise_users=0,
        )


@router.get("/trend")
@cache(
    ttl=600,
    prefix="revenue:trend",
    key_func=lambda tenant_id=None, days=30, **kwargs: f"tenant:{tenant_id}:days:{days}",
    tags=["revenue"],
)
async def get_revenue_trend(
    tenant_id: Optional[str] = Query(None),
    days: int = Query(30, ge=7, le=365),
    service: RevenueService = Depends(get_revenue_service),
):
    """
    Get revenue trend data for charting.

    Args:
        days: Number of days to look back (7-365)

    Returns:
        List of daily revenue snapshots
    """
    try:
        return service.get_revenue_trend(tenant_id, days)
    except Exception as e:
        print(f"Error fetching trend: {e}")
        return []


@router.get("/payments/recent")
async def get_recent_payments(
    tenant_id: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    service: RevenueService = Depends(get_revenue_service),
):
    """
    Get recent payment transactions.

    Args:
        limit: Number of payments to return (1-100)

    Returns:
        List of payment records
    """
    try:
        return service.get_recent_payments(tenant_id, limit)
    except Exception as e:
        print(f"Error fetching payments: {e}")
        return []


@router.post("/snapshot", dependencies=[Depends(require_admin)])
async def create_revenue_snapshot(
    tenant_id: str = Query(...), service: RevenueService = Depends(get_revenue_service)
):
    """
    Create a revenue snapshot for today (admin only).

    This endpoint is typically called by a scheduled job.

    Returns:
        Created snapshot record
    """
    try:
        snapshot = service.create_snapshot(tenant_id)
        return {"status": "created", "snapshot": snapshot}
    except Exception as e:
        print(f"Error creating snapshot: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/mrr")
async def get_mrr(
    tenant_id: Optional[str] = Query(None), service: RevenueService = Depends(get_revenue_service)
):
    """Get current Monthly Recurring Revenue."""
    try:
        mrr = service.get_current_mrr(tenant_id)
        return {"mrr": float(mrr)}
    except Exception as e:
        print(f"Error fetching MRR: {e}")
        return {"mrr": 0}


@router.get("/arr")
async def get_arr(
    tenant_id: Optional[str] = Query(None), service: RevenueService = Depends(get_revenue_service)
):
    """Get current Annual Recurring Revenue."""
    try:
        arr = service.get_current_arr(tenant_id)
        return {"arr": float(arr)}
    except Exception as e:
        print(f"Error fetching ARR: {e}")
        return {"arr": 0}
