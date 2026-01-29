import secrets
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from backend.api.schemas.public_api import (
    WebhookConfigCreate,
    WebhookConfigResponse,
    WebhookConfigUpdate,
    WebhookDeliveryLog,
)
from backend.middleware.api_auth import get_current_api_key, require_scope
from core.infrastructure.database import get_db

router = APIRouter(prefix="/webhooks", tags=["Public API - Webhooks"])


@router.post("/", response_model=WebhookConfigResponse)
async def create_webhook_config(
    config: WebhookConfigCreate,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    Register a new webhook endpoint.
    """
    db = get_db()
    key_id = api_key["id"]

    # Generate a signing secret
    secret = "whsec_" + secrets.token_hex(24)

    data = {
        "api_key_id": key_id,
        "url": config.url,
        "events": config.events,
        "secret": secret,
        "status": "active",
    }

    result = db.table("webhook_configs").insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create webhook config")

    return WebhookConfigResponse(**result.data[0])


@router.get("/", response_model=List[WebhookConfigResponse])
async def list_webhook_configs(
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    List all webhook configurations.
    """
    db = get_db()
    key_id = api_key["id"]

    result = db.table("webhook_configs").select("*").eq("api_key_id", key_id).execute()

    return [WebhookConfigResponse(**r) for r in result.data]


@router.get("/{config_id}", response_model=WebhookConfigResponse)
async def get_webhook_config(
    config_id: str,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    Get a specific webhook configuration.
    """
    db = get_db()
    key_id = api_key["id"]

    result = (
        db.table("webhook_configs")
        .select("*")
        .eq("id", config_id)
        .eq("api_key_id", key_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    return WebhookConfigResponse(**result.data[0])


@router.patch("/{config_id}", response_model=WebhookConfigResponse)
async def update_webhook_config(
    config_id: str,
    update_data: WebhookConfigUpdate,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    Update a webhook configuration.
    """
    db = get_db()
    key_id = api_key["id"]

    # Verify ownership
    existing = (
        db.table("webhook_configs")
        .select("id")
        .eq("id", config_id)
        .eq("api_key_id", key_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    data = update_data.dict(exclude_unset=True)
    if not data:
        return WebhookConfigResponse(
            **db.table("webhook_configs").select("*").eq("id", config_id).single().execute().data
        )

    data["updated_at"] = "now()"

    result = db.table("webhook_configs").update(data).eq("id", config_id).execute()

    return WebhookConfigResponse(**result.data[0])


@router.delete("/{config_id}")
async def delete_webhook_config(
    config_id: str,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    Delete (or disable) a webhook configuration.
    """
    db = get_db()
    key_id = api_key["id"]

    # Verify ownership
    existing = (
        db.table("webhook_configs")
        .select("id")
        .eq("id", config_id)
        .eq("api_key_id", key_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    # Hard delete for now
    db.table("webhook_configs").delete().eq("id", config_id).execute()

    return {"status": "deleted", "id": config_id}


@router.get("/{config_id}/deliveries", response_model=List[WebhookDeliveryLog])
async def list_deliveries(
    config_id: str,
    limit: int = 20,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("webhook:manage")),
):
    """
    List delivery logs for a webhook.
    """
    db = get_db()
    key_id = api_key["id"]

    # Verify ownership
    existing = (
        db.table("webhook_configs")
        .select("id")
        .eq("id", config_id)
        .eq("api_key_id", key_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    result = (
        db.table("webhook_deliveries")
        .select("*")
        .eq("webhook_config_id", config_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return [WebhookDeliveryLog(**r) for r in result.data]
