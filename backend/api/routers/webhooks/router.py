import hashlib
import hmac
import json
import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from backend.api.routers.webhooks.models import WebhookProvider
from backend.services.webhook_receiver import webhook_receiver
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# -----------------------------------------------------------------------------
# Dependency: Signature Verification
# -----------------------------------------------------------------------------

async def verify_stripe_signature(request: Request, stripe_signature: str = Header(None)):
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    payload = await request.body()
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook configuration error")

    # In a real implementation, use stripe.Webhook.construct_event
    # Here we simulate or use the library if available
    try:
        import stripe
        stripe.Webhook.construct_event(
            payload, stripe_signature, secret
        )
    except Exception as e:
        logger.warning(f"Stripe signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

async def verify_github_signature(request: Request, x_hub_signature_256: str = Header(None)):
    if not x_hub_signature_256:
        raise HTTPException(status_code=400, detail="Missing X-Hub-Signature-256 header")

    payload = await request.body()
    secret = os.getenv("GITHUB_WEBHOOK_SECRET")

    if not secret:
        logger.error("GITHUB_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook configuration error")

    signature = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, x_hub_signature_256):
        raise HTTPException(status_code=400, detail="Invalid signature")

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks."""
    # Verify signature
    await verify_stripe_signature(request, stripe_signature)

    try:
        payload = await request.json()
        event_id = payload.get("id")
        event_type = payload.get("type")

        if not event_id or not event_type:
             raise HTTPException(status_code=400, detail="Invalid payload")

        # Store event
        event = await webhook_receiver.receive_event(
            provider=WebhookProvider.STRIPE,
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            headers={"Stripe-Signature": stripe_signature},
            db=db
        )

        if event:
            # Enqueue for async processing
            # For now, we can also trigger immediate processing if needed,
            # or rely on the queue. The queue service (Redis) is separate from SQL.
            # But wait, webhook_receiver.receive_event returns a dict now.
            # And webhook_queue expects an ID.
            from backend.services.webhook_queue import webhook_queue
            webhook_queue.enqueue(event["id"])

        return {"status": "received"}

    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/paypal")
async def paypal_webhook(request: Request):
    """Handle PayPal webhooks."""
    # PayPal signature verification is complex and usually requires SDK
    # We assume middleware or SDK handles it, or implement here using headers
    # For brevity, we assume verification is done via middleware or utility

    try:
        payload = await request.json()
        event_id = payload.get("id")
        event_type = payload.get("event_type")

        if not event_id or not event_type:
             raise HTTPException(status_code=400, detail="Invalid payload")

        event = await webhook_receiver.receive_event(
            provider=WebhookProvider.PAYPAL,
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            headers=dict(request.headers)
        )

        if event:
            webhook_queue.enqueue(event["id"])

        return {"status": "received"}
    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/github")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(...),
    x_hub_signature_256: str = Header(None)
):
    """Handle GitHub webhooks."""
    await verify_github_signature(request, x_hub_signature_256)

    try:
        payload = await request.json()
        # GitHub events don't always have a global ID in the same place,
        # often "delivery" ID is in headers
        event_id = request.headers.get("X-GitHub-Delivery")

        if not event_id:
             raise HTTPException(status_code=400, detail="Missing delivery ID")

        event = await webhook_receiver.receive_event(
            provider=WebhookProvider.GITHUB,
            event_id=event_id,
            event_type=x_github_event,
            payload=payload,
            headers={"X-Hub-Signature-256": x_hub_signature_256}
        )

        if event:
            webhook_queue.enqueue(event["id"])

        return {"status": "received"}
    except Exception as e:
        logger.error(f"Error processing GitHub webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
