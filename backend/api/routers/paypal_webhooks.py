"""
🔔 PayPal Webhooks Handler
==========================
Uses Unified Payment Service for verification and processing.
"""

import json
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request

from backend.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/paypal", tags=["PayPal Webhooks"])

# Initialize Unified Service
payment_service = PaymentService()


@router.post("/")
async def handle_webhook(
    request: Request,
    paypal_transmission_id: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-ID"),
    paypal_transmission_time: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-TIME"),
    paypal_cert_url: Optional[str] = Header(None, alias="PAYPAL-CERT-URL"),
    paypal_auth_algo: Optional[str] = Header(None, alias="PAYPAL-AUTH-ALGO"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-SIG"),
):
    """
    Unified PayPal webhook handler.
    """
    # Get raw body for verification
    body_bytes = await request.body()

    try:
        # Parse for event type logging
        event_data = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event_data.get("event_type", "UNKNOWN")
    logger.info(f"📨 PAYPAL EVENT: {event_type}")

    # Prepare headers for verification
    headers = {
        "paypal-transmission-id": paypal_transmission_id,
        "paypal-transmission-time": paypal_transmission_time,
        "paypal-cert-url": paypal_cert_url,
        "paypal-auth-algo": paypal_auth_algo,
        "paypal-transmission-sig": paypal_transmission_sig,
    }

    # Verify Signature via PaymentService
    webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID")
    if not webhook_id:
        logger.warning("⚠️ PAYPAL_WEBHOOK_ID not set. Skipping verification (Dev Mode?)")
        # In production, this should likely be strict

    try:
        if webhook_id:
            # Note: The PaymentService.verify_webhook handles the logic.
            # It wraps the SDK call.
            verify_response = payment_service.verify_webhook(
                provider="paypal",
                headers=headers,
                body=event_data,  # SDK expects dict
                webhook_secret=webhook_id,
            )

            if verify_response.get("verification_status") != "SUCCESS":
                logger.error("❌ Signature Verification Failed")
                raise HTTPException(status_code=401, detail="Invalid signature")

            logger.info("✅ Signature Verified")

    except Exception as e:
        logger.error(f"⚠️ Verification Error: {e}")
        # Fail open or closed depending on security posture.
        # Usually fail closed (raise 401).
        raise HTTPException(status_code=401, detail=f"Verification error: {str(e)}")

    # Process Event via PaymentService
    try:
        payment_service.handle_webhook_event(provider="paypal", event=event_data)
        return {"status": "processed", "event": event_type}
    except Exception as e:
        logger.error(f"❌ Processing Error: {e}")
        # Return 200 to acknowledge receipt but log error, otherwise PayPal retries indefinitely
        return {"status": "error", "message": str(e)}


@router.get("/status")
async def webhook_status():
    """Check webhook handler status."""
    return {"status": "active", "provider": "paypal", "unified_service": True}
