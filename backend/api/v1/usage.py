from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query

from backend.api.schemas.public_api import ApiUsageRecord, ApiUsageStats
from backend.middleware.api_auth import get_current_api_key, require_scope
from core.infrastructure.database import get_db

router = APIRouter(prefix="/usage", tags=["Public API - Usage"])


@router.get("/metrics", response_model=ApiUsageStats)
async def get_usage_metrics(
    days: int = Query(30, ge=1, le=90),
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:usage")),
):
    """
    Get API usage statistics for the current API Key.
    """
    db = get_db()
    key_id = api_key["id"]

    start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

    # Query usage records
    result = (
        db.table("api_usage")
        .select("*")
        .eq("api_key_id", key_id)
        .gte("created_at", start_date)
        .execute()
    )

    records = result.data
    total_requests = len(records)

    requests_by_endpoint = {}
    requests_by_status = {}
    total_time_ms = 0

    for record in records:
        endpoint = record.get("endpoint", "unknown")
        status = str(record.get("status_code", 0))
        time_ms = record.get("response_time_ms", 0)

        requests_by_endpoint[endpoint] = requests_by_endpoint.get(endpoint, 0) + 1
        requests_by_status[status] = requests_by_status.get(status, 0) + 1
        total_time_ms += time_ms

    average_response_time = (total_time_ms / total_requests) if total_requests > 0 else 0.0

    return ApiUsageStats(
        total_requests=total_requests,
        requests_by_endpoint=requests_by_endpoint,
        requests_by_status=requests_by_status,
        average_response_time_ms=average_response_time,
    )


@router.get("/logs", response_model=List[ApiUsageRecord])
async def get_usage_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:usage")),
):
    """
    Get detailed usage logs.
    """
    db = get_db()
    key_id = api_key["id"]

    result = (
        db.table("api_usage")
        .select("*")
        .eq("api_key_id", key_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return [
        ApiUsageRecord(
            endpoint=r.get("endpoint"),
            method=r.get("method"),
            status_code=r.get("status_code"),
            response_time_ms=r.get("response_time_ms"),
            created_at=r.get("created_at"),
        )
        for r in result.data
    ]
