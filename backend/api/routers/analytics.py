from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query

from backend.api.auth.dependencies import get_current_user
from backend.models.analytics_event import AnalyticsEvent
from backend.services.analytics_service import AnalyticsService
from backend.services.cache_service import cached
from backend.services.etl_service import ETLService

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# Dependencies
def get_analytics_service():
    return AnalyticsService()

def get_etl_service():
    return ETLService()

@router.post("/track")
async def track_event(
    event_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Track a user event.
    Fire-and-forget using background tasks for performance.
    """
    user_id = current_user["id"]

    # Extract known fields
    event_type = event_data.get("event_type", "unknown")
    event_category = event_data.get("event_category", "general")
    event_name = event_data.get("event_name", "unknown")
    metadata = event_data.get("metadata", {})
    payload = event_data.get("event_data", {})
    session_id = event_data.get("session_id")

    # Run in background
    background_tasks.add_task(
        service.track_event,
        user_id=user_id,
        event_type=event_type,
        event_category=event_category,
        event_name=event_name,
        event_data=payload,
        metadata=metadata,
        session_id=session_id
    )

    return {"status": "queued"}

@router.get("/users/{user_id}/stats")
@cached(ttl=300, prefix="analytics:user_stats")
async def get_user_statistics(
    user_id: str,
    days: int = 30,
    current_user = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get analytics stats for a specific user."""
    # RBAC: Only allow admin or the user themselves
    if current_user["id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return service.get_user_stats(user_id, days=days)

@router.get("/metrics/daily")
@cached(ttl=3600, prefix="analytics:daily")
async def get_daily_metrics(
    days: int = 30,
    current_user = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get daily system-wide metrics (Admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return service.get_daily_metrics(days=days)

# --- ETL & Reporting Endpoints ---

@router.post("/etl/run")
async def run_etl_job(
    background_tasks: BackgroundTasks,
    target_date: Optional[date] = None,
    current_user = Depends(get_current_user),
    service: ETLService = Depends(get_etl_service)
):
    """Trigger daily ETL job manually (Admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Run sync for now to return result, or background for async
    # For manual trigger, sync is often better to see result immediately
    # unless it takes too long.
    result = service.run_daily_etl(target_date)
    return {"status": "success", "result": result}

@router.get("/dashboard/overview")
@cached(ttl=300, prefix="analytics:overview")
async def get_dashboard_overview(
    current_user = Depends(get_current_user),
    etl_service: ETLService = Depends(get_etl_service)
):
    """
    Get high-level dashboard metrics (MRR, Users, Churn).
    Fetches latest snapshot.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # We can reuse ETL service logic or fetch from DB directly
    # Ideally, we query the 'metrics_snapshots' table for the latest entry for each metric

    db = etl_service.db

    # Helper to get latest metric
    def get_latest(metric_name):
        res = db.table("metrics_snapshots")\
            .select("metric_value, dimensions, date")\
            .eq("metric_name", metric_name)\
            .order("date", desc=True)\
            .limit(1)\
            .execute()
        return res.data[0] if res.data else None

    return {
        "mrr": get_latest("mrr"),
        "active_users": get_latest("total_users"),
        "new_users": get_latest("new_users"),
        "churn_rate": get_latest("churn_rate_daily")
    }
