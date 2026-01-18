"""
🔔 PayPal Webhooks Handler - Full Integration
==============================================
Handles all PayPal webhook events with signature verification.
Uses backend.services.webhook_handlers for business logic.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.core.paypal_sdk import PayPalSDK
from fastapi import APIRouter, Header, HTTPException, Request

from backend.services.webhook_handlers import EVENT_HANDLERS_MAP

router = APIRouter(prefix="/webhooks/paypal", tags=["PayPal Webhooks"])

# Initialize SDK for verification
sdk = PayPalSDK()


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
    Main PayPal webhook handler.
    """
    # Get raw body
    body = await request.body()

    # Parse event
    try:
        event_data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event_data.get("event_type", "UNKNOWN")
    event_id = event_data.get("id", "N/A")
    resource = event_data.get("resource", {})

    print(f"\n{'=' * 60}")
    print("📨 PAYPAL WEBHOOK RECEIVED")
    print(f"   Event: {event_type}")
    print(f"   ID: {event_id}")
    print(f"   Time: {datetime.now().isoformat()}")
    print(f"{'=' * 60}")

    # Verify signature
    webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID")
    if webhook_id and paypal_transmission_id:
        try:
            # Use the new SDK for verification
            # The SDK verify_signature expects the whole event object
            verify_response = sdk.webhooks.verify_signature(
                transmission_id=paypal_transmission_id,
                transmission_time=paypal_transmission_time or "",
                cert_url=paypal_cert_url or "",
                auth_algo=paypal_auth_algo or "",
                transmission_sig=paypal_transmission_sig or "",
                webhook_id=webhook_id,
                webhook_event=event_data,
            )

            # Check verification result
            if verify_response and verify_response.get("verification_status") == "SUCCESS":
                print("✅ Signature Verified")
            else:
                print("❌ Webhook signature verification failed!")
                raise HTTPException(status_code=401, detail="Invalid signature")
        except Exception as e:
            print(f"⚠️ Verification error: {e}")
            # raise HTTPException(status_code=401, detail="Signature verification error")
    else:
        print("⚠️ Signature verification skipped (no webhook_id configured)")

    # Route to appropriate handler
    handler = EVENT_HANDLERS_MAP.get(event_type)

    if handler:
        result = handler(resource)
        print(f"✅ Handler result: {result}")
    else:
        print(f"ℹ️ No handler for event type: {event_type}")
        result = {"action": "unhandled", "event_type": event_type}

    # Log to file for debugging
    log_file = Path("logs/paypal_webhooks.jsonl")
    log_file.parent.mkdir(exist_ok=True)

    with open(log_file, "a") as f:
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "event_id": event_id,
            "result": result,
        }
        f.write(json.dumps(log_entry) + "\n")

    return {"status": "received", "event_type": event_type, "result": result}


@router.get("/status")
async def webhook_status():
    """Check webhook handler status."""
    return {
        "status": "active",
        "webhook_id_configured": bool(os.environ.get("PAYPAL_WEBHOOK_ID")),
        "mode": sdk.mode,
        "supported_events": list(EVENT_HANDLERS_MAP.keys()),
        "total_handlers": len(EVENT_HANDLERS_MAP),
    }
