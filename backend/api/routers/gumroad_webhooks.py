"""
🔔 Gumroad Webhooks Handler
===========================
Uses Unified Payment Service for verification and processing.
Includes HMAC-SHA256 signature verification for security.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from backend.middleware.webhook_auth import verify_gumroad_webhook
from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/gumroad", tags=["Gumroad Webhooks"])

# Initialize Unified Service
payment_service = PaymentService()

@router.post("/")
async def handle_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    verified_body: bytes = Depends(verify_gumroad_webhook)
):
    """
    Unified Gumroad webhook handler with signature verification.

    Gumroad sends data as application/x-www-form-urlencoded.
    Signature is verified via HMAC-SHA256 before processing.

    Security:
    - X-Gumroad-Signature header required
    - HMAC-SHA256 signature verification
    - All verification attempts logged
    - Invalid signatures rejected with 401
    """
    try:
        # Gumroad sends form data
        form_data = await request.form()
        event_data = dict(form_data)

        logger.info(f"📨 GUMROAD EVENT: Purchase of {event_data.get('product_name')}")

        # Process Event via PaymentService
        # Signature already verified by dependency
        payment_service.handle_webhook_event(provider="gumroad", event=event_data)

        return {"status": "processed", "verified": True}

    except Exception as e:
        logger.error(f"❌ Gumroad Processing Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
