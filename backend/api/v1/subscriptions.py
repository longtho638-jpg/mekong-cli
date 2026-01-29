from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from backend.api.schemas.public_api import SubscriptionPublic
from backend.middleware.api_auth import get_current_api_key, require_scope
from backend.services.provisioning_service import ProvisioningService
from core.infrastructure.database import get_db

router = APIRouter(prefix="/subscriptions", tags=["Public API - Subscriptions"])


@router.get("/", response_model=List[SubscriptionPublic])
async def list_subscriptions(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:subscriptions")),
):
    """
    List subscriptions for the authenticated user/tenant.
    """
    db = get_db()
    user_id = api_key["user_id"]

    # Assuming user_id maps to tenant_id or we filter by user_id owner
    # For now, let's assume the API Key user_id IS the tenant_id or linked to it.
    # We query the `subscriptions` table.

    query = db.table("subscriptions").select("*").eq("tenant_id", user_id)

    if status:
        query = query.eq("status", status)

    query = query.range(offset, offset + limit - 1)

    result = query.execute()

    subs = []
    for record in result.data:
        subs.append(
            SubscriptionPublic(
                id=record.get(
                    "id", "sub_" + record.get("tenant_id", "unknown")
                ),  # Handle if ID missing
                plan_id=record.get("plan", "FREE"),
                status=record.get("status", "active"),
                current_period_start=record.get("updated_at"),  # Approximation if fields missing
                current_period_end=record.get("current_period_end"),
                cancel_at_period_end=False,  # Need to add this column if not exists
            )
        )

    return subs


@router.get("/{subscription_id}", response_model=SubscriptionPublic)
async def get_subscription(
    subscription_id: str,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:subscriptions")),
):
    """
    Get a specific subscription.
    """
    db = get_db()
    user_id = api_key["user_id"]

    # We allow getting by internal ID or provider ID
    # Here assuming internal ID or tenant_id logic?
    # Usually public APIs expose an internal stable ID.

    result = (
        db.table("subscriptions")
        .select("*")
        .eq("tenant_id", user_id)
        .or_(
            f"id.eq.{subscription_id},stripe_subscription_id.eq.{subscription_id},paypal_subscription_id.eq.{subscription_id}"
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    record = result.data[0]

    return SubscriptionPublic(
        id=record.get("id", "sub_" + record.get("tenant_id", "unknown")),
        plan_id=record.get("plan", "FREE"),
        status=record.get("status", "active"),
        current_period_start=record.get("updated_at"),
        current_period_end=record.get("current_period_end"),
        cancel_at_period_end=False,
    )


@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    reason: Optional[str] = None,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("write:subscriptions")),
):
    """
    Cancel a subscription.
    """
    # Use ProvisioningService to cancel
    provisioning = ProvisioningService()

    # We need to resolve provider and provider_sub_id first
    db = get_db()
    user_id = api_key["user_id"]

    result = (
        db.table("subscriptions")
        .select("*")
        .eq("tenant_id", user_id)
        .or_(
            f"id.eq.{subscription_id},stripe_subscription_id.eq.{subscription_id},paypal_subscription_id.eq.{subscription_id}"
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    record = result.data[0]

    provider = "stripe" if record.get("stripe_subscription_id") else "paypal"
    provider_sub_id = record.get("stripe_subscription_id") or record.get("paypal_subscription_id")

    if not provider_sub_id:
        raise HTTPException(
            status_code=400, detail="Subscription does not have a valid provider ID"
        )

    # Provisioning service takes (provider_sub_id, provider)
    response = provisioning.cancel_subscription(provider_sub_id, provider)

    if "error" in response:
        raise HTTPException(status_code=400, detail=response["error"])

    return {"status": "cancelled", "subscription_id": subscription_id}
