"""
🔔 Gumroad Webhooks Handler
===========================
Uses Unified Payment Service for verification and processing.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from backend.services.payment_service import PaymentService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/gumroad", tags=["Gumroad Webhooks"])

# Initialize Unified Service
payment_service = PaymentService()

@router.post("/")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Unified Gumroad webhook handler.
    Gumroad sends data as application/x-www-form-urlencoded.
    """
    try:
        # Gumroad sends form data
        form_data = await request.form()
        event_data = dict(form_data)

        # Verify (Basic check via Service)
        # Note: Gumroad doesn't have a signature header like Stripe
        verified_event = payment_service.verify_webhook(
            provider="gumroad",
            headers={},
            body=event_data
        )

        logger.info(f"📨 GUMROAD EVENT: Purchase of {verified_event.get('product_name')}")

        # Process Event via PaymentService
        # Run in background if it takes time, but PaymentService is currently sync-ish for DB ops.
        # We can wrap it if needed, but for consistency with other routers we call it directly
        # or use background_tasks if we want to add email sending later.

        payment_service.handle_webhook_event(provider="gumroad", event=verified_event)

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"❌ Gumroad Processing Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
