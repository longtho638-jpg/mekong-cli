"""
🔔 Stripe Webhooks Handler
==========================
Uses Unified Payment Service for verification and processing.
Includes Stripe SDK signature verification for security.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.middleware.webhook_auth import verify_stripe_webhook
from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/stripe", tags=["Stripe Webhooks"])

# Initialize Unified Service
payment_service = PaymentService()


@router.post("/")
async def handle_webhook(request: Request, event: dict = Depends(verify_stripe_webhook)):
    """
    Unified Stripe webhook handler with signature verification.

    Security:
    - Stripe-Signature header required
    - Signature verified using Stripe SDK
    - Timestamp validation prevents replay attacks
    - All verification attempts logged
    - Invalid signatures rejected with 401
    """
    logger.info(f"📨 STRIPE EVENT: {event.get('type')}")

    # Process event (signature already verified by dependency)
    try:
        payment_service.handle_webhook_event(provider="stripe", event=event)
        return {"status": "processed", "event": event.get("type"), "verified": True}
    except Exception as e:
        logger.error(f"❌ Stripe Processing Error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
