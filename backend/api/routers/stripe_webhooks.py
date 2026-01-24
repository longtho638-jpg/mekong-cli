"""
🔔 Stripe Webhooks Handler
==========================
Uses Unified Payment Service for verification and processing.
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request

from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/stripe", tags=["Stripe Webhooks"])

# Initialize Unified Service
payment_service = PaymentService()

@router.post("/")
async def handle_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
):
    """
    Unified Stripe webhook handler.
    """
    body_bytes = await request.body()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        logger.warning("⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping verification.")
        # In strict mode, we should fail.

    if not stripe_signature:
         raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        # Verify
        event = payment_service.verify_webhook(
            provider="stripe",
            headers={"stripe-signature": stripe_signature},
            body=body_bytes,
            webhook_secret=webhook_secret
        )
    except Exception as e:
        logger.error(f"❌ Stripe Verification Failed: {e}")
        raise HTTPException(status_code=400, detail=f"Verification error: {str(e)}")

    logger.info(f"📨 STRIPE EVENT: {event.get('type')}")

    # Process
    try:
        payment_service.handle_webhook_event(provider="stripe", event=event)
        return {"status": "processed", "event": event.get("type")}
    except Exception as e:
        logger.error(f"❌ Stripe Processing Error: {e}")
        return {"status": "error", "message": str(e)}
