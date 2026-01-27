from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException

from backend.api.auth.dependencies import get_current_user
from backend.api.schemas.public_api import (
    ApiKeyCreate,
    ApiKeyResponse,
    ApiUsageStats,
    WebhookConfigCreate,
    WebhookConfigResponse,
    WebhookConfigUpdate,
    WebhookDeliveryLog,
)
from backend.services.api_key_service import ApiKeyService
from backend.services.api_usage_tracker import usage_tracker
from core.infrastructure.database import get_db

router = APIRouter(prefix="/developers", tags=["Developers"])

# Dependency
def get_api_key_service():
    return ApiKeyService()

# --- API Keys Management (Dashboard) ---

@router.get("/keys", response_model=List[ApiKeyResponse])
async def list_my_api_keys(
    current_user = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """List API keys for the current user."""
    return service.list_api_keys(current_user["id"])

@router.post("/keys", response_model=ApiKeyResponse)
async def create_api_key(
    data: ApiKeyCreate,
    current_user = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Create a new API key."""
    # Logic to determine tier based on user subscription could go here
    return service.generate_api_key(
        user_id=current_user["id"],
        name=data.name,
        scopes=data.scopes,
        tier="free" # Default or fetch from user plan
    )

@router.delete("/keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Revoke an API key."""
    success = service.revoke_api_key(key_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or could not be revoked")
    return {"status": "revoked"}

@router.post("/keys/{key_id}/rotate", response_model=ApiKeyResponse)
async def rotate_api_key(
    key_id: str,
    current_user = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Rotate an API key."""
    try:
        return service.rotate_api_key(key_id, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# --- Webhooks Management (Dashboard) ---

@router.get("/webhooks", response_model=List[WebhookConfigResponse])
async def list_my_webhooks(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """List webhook configs for the current user."""
    # Join with api_keys to check ownership or store user_id on webhook_configs directly?
    # Current schema: webhook_configs -> api_key_id.
    # We need to find all api keys for user, then all webhooks for those keys.
    # OR, we should have added user_id to webhook_configs?
    # Let's link via api_keys for now.

    # Get user's API keys first
    keys = db.table("api_keys").select("id").eq("user_id", current_user["id"]).execute()
    key_ids = [k["id"] for k in keys.data]

    if not key_ids:
        return []

    result = db.table("webhook_configs").select("*").in_("api_key_id", key_ids).execute()
    return [WebhookConfigResponse(**r) for r in result.data]

@router.post("/webhooks", response_model=WebhookConfigResponse)
async def create_webhook(
    config: WebhookConfigCreate,
    api_key_id: str = Body(..., embed=True), # User must select which key this webhook is for?
    # Actually, webhooks are usually per-project or per-user, not necessarily per-key.
    # But my schema linked them to API Keys. Let's stick to that or pick the first active key?
    # Better: User selects the key, or we automatically assign to a "master" key if we had one.
    # Let's require api_key_id for now.
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # Verify ownership of the key
    key_res = db.table("api_keys").select("id").eq("id", api_key_id).eq("user_id", current_user["id"]).execute()
    if not key_res.data:
        raise HTTPException(status_code=403, detail="Invalid API Key ID")

    # Create logic (duplicated from v1/webhooks.py but adapted)
    import secrets
    secret = "whsec_" + secrets.token_hex(24)

    data = {
        "api_key_id": api_key_id,
        "url": config.url,
        "events": config.events,
        "secret": secret,
        "status": "active"
    }

    result = db.table("webhook_configs").insert(data).execute()
    return WebhookConfigResponse(**result.data[0])

@router.delete("/webhooks/{config_id}")
async def delete_webhook(
    config_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # Verify ownership via join or two steps
    # Step 1: Get config
    config_res = db.table("webhook_configs").select("api_key_id").eq("id", config_id).single().execute()
    if not config_res.data:
        raise HTTPException(status_code=404, detail="Webhook not found")

    api_key_id = config_res.data["api_key_id"]

    # Step 2: Verify key ownership
    key_res = db.table("api_keys").select("id").eq("id", api_key_id).eq("user_id", current_user["id"]).execute()
    if not key_res.data:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.table("webhook_configs").delete().eq("id", config_id).execute()
    return {"status": "deleted"}

# --- Usage Stats (Dashboard) ---

@router.get("/usage/stats", response_model=ApiUsageStats)
async def get_my_usage_stats(
    days: int = 30,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # Get all keys
    keys = db.table("api_keys").select("id").eq("user_id", current_user["id"]).execute()
    key_ids = [k["id"] for k in keys.data]

    if not key_ids:
        return ApiUsageStats(
            total_requests=0,
            requests_by_endpoint={},
            requests_by_status={},
            average_response_time_ms=0
        )

    from datetime import datetime, timedelta
    start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

    # Query usage for ALL keys
    result = db.table("api_usage")\
        .select("*")\
        .in_("api_key_id", key_ids)\
        .gte("created_at", start_date)\
        .execute()

    records = result.data
    total_requests = len(records)
    requests_by_endpoint = {}
    requests_by_status = {}
    total_time_ms = 0

    # Prepare chart data structure
    from collections import defaultdict
    daily_stats = defaultdict(lambda: {"requests": 0, "errors": 0})

    # Initialize with 0s for all days to ensure continuous chart
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[d] = {"requests": 0, "errors": 0}

    for record in records:
        endpoint = record.get("endpoint", "unknown")
        status = str(record.get("status_code", 0))
        time_ms = record.get("response_time_ms", 0)

        # Parse timestamp from string if needed (PostgREST usually returns ISO strings)
        created_at_str = record.get("created_at")
        if isinstance(created_at_str, str):
            # Handle ISO format with potential timezone "2023-10-27T10:00:00+00:00"
            created_at_dt = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            date_key = created_at_dt.strftime("%Y-%m-%d")
        else:
             # Fallback or if it's already datetime
            date_key = datetime.utcnow().strftime("%Y-%m-%d")

        if date_key in daily_stats:
            daily_stats[date_key]["requests"] += 1
            if int(status) >= 400:
                daily_stats[date_key]["errors"] += 1

        requests_by_endpoint[endpoint] = requests_by_endpoint.get(endpoint, 0) + 1
        requests_by_status[status] = requests_by_status.get(status, 0) + 1
        total_time_ms += time_ms

    average_response_time = (total_time_ms / total_requests) if total_requests > 0 else 0.0

    # Convert daily_stats to sorted list
    chart_data = [
        {"date": k, "requests": v["requests"], "errors": v["errors"]}
        for k, v in sorted(daily_stats.items())
    ]

    return ApiUsageStats(
        total_requests=total_requests,
        requests_by_endpoint=requests_by_endpoint,
        requests_by_status=requests_by_status,
        average_response_time_ms=average_response_time,
        chart_data=chart_data
    )
