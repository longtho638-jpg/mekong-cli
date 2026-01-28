"""
Stripe Production Router
========================
API endpoints for Stripe checkout, portal, and webhooks.
Designed for production use with proper validation and error handling.
"""

import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from backend.api.dependencies.database import get_db
from backend.core.payments.invoice_manager import InvoiceManager
from backend.core.payments.stripe_client import StripeClient
from backend.core.payments.subscription_manager import SubscriptionManager
from backend.core.payments.webhook_handler import WebhookHandler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/stripe", tags=["Payments (Stripe)"])

# Request Models
class CheckoutRequest(BaseModel):
    plan_id: str
    tenant_id: str
    success_url: str
    cancel_url: str
    customer_email: Optional[str] = None
    trial_days: Optional[int] = None

class PortalRequest(BaseModel):
    customer_id: str
    return_url: str

class WebhookResponse(BaseModel):
    status: str
    type: str

# Dependencies
def get_subscription_manager():
    db = get_db()
    return SubscriptionManager(db)

def get_webhook_handler(db=Depends(get_db)):
    return WebhookHandler(db)

@router.post("/checkout", response_model=Dict[str, Any])
async def create_checkout_session(
    request: CheckoutRequest,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    Create a Stripe Checkout session for a subscription.
    """
    try:
        session = manager.create_subscription_checkout(
            tenant_id=request.tenant_id,
            plan_id=request.plan_id,
            customer_email=request.customer_email,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            trial_days=request.trial_days
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail="Checkout creation failed")

@router.post("/portal", response_model=Dict[str, Any])
async def create_portal_session(
    request: PortalRequest,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    Create a Stripe Billing Portal session for customer self-service.
    """
    try:
        session = manager.create_portal_session(
            customer_id=request.customer_id,
            return_url=request.return_url
        )
        return session
    except Exception as e:
        logger.error(f"Portal session creation failed: {e}")
        raise HTTPException(status_code=500, detail="Portal session creation failed")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    handler: WebhookHandler = Depends(get_webhook_handler)
):
    """
    Stripe Webhook Endpoint.
    Verifies signature and processes events.
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        payload = await request.body()
        result = await handler.verify_and_process_stripe(payload, stripe_signature)
        return result
    except ValueError as e:
        # Signature verification failed
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Processing failed
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Internal processing error")

@router.post("/subscription/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    immediately: bool = False,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    Cancel a subscription.
    """
    try:
        return manager.cancel_subscription(subscription_id, immediately)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Cancellation failed: {str(e)}")

@router.get("/subscription/{subscription_id}")
async def get_subscription(
    subscription_id: str,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    Get subscription details.
    """
    try:
        return manager.get_subscription_details(subscription_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

@router.get("/customer/{customer_id}/payment_methods")
async def list_payment_methods(
    customer_id: str,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    List payment methods for a customer.
    """
    try:
        return manager.stripe.list_payment_methods(customer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Listing payment methods failed: {str(e)}")

@router.get("/customer/{customer_id}/invoices")
async def list_invoices(
    customer_id: str,
    limit: int = 10,
    manager: SubscriptionManager = Depends(get_subscription_manager)
):
    """
    List invoices for a customer.
    """
    try:
        invoice_manager = InvoiceManager(manager.db)
        return invoice_manager.list_customer_invoices(customer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Listing invoices failed: {str(e)}")
