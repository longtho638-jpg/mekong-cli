"""
💳 Unified Payments Router
==========================
Handles payments via PaymentService (PayPal, Stripe).
Exposes provider-specific endpoints for frontend integration.
"""

from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from backend.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])
service = PaymentService()


# --- Request Models ---

class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "USD"
    description: Optional[str] = None
    provider: Literal["paypal", "stripe"] = "paypal"
    # Stripe specific
    price_id: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None
    customer_email: Optional[str] = None
    tenant_id: Optional[str] = None


class CaptureRequest(BaseModel):
    order_id: str
    provider: Literal["paypal", "stripe"] = "paypal"


# --- Generic Endpoints ---

@router.get("/status")
def get_status():
    """Check payment service status."""
    return {
        "providers": ["paypal", "stripe"],
        "paypal_mode": service.paypal.mode,
        "stripe_configured": service.stripe.is_configured(),
        "status": "active"
    }


# --- PayPal Specific Endpoints (Matching Frontend) ---

@router.post("/paypal/create-order")
def create_paypal_order(request: CreateOrderRequest):
    """Create a PayPal order."""
    try:
        result = service.create_checkout_session(
            provider="paypal",
            amount=request.amount,
            currency=request.currency,
            description=request.description,
            mode="payment" # Default to one-time payment for this endpoint
        )
        # Verify result structure
        if not result or "id" not in result:
             raise ValueError("Invalid response from PayPal SDK")

        return {"orderId": result["id"], "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/paypal/capture-order")
def capture_paypal_order(request: CaptureRequest):
    """Capture a PayPal order."""
    try:
        result = service.capture_order(provider="paypal", order_id=request.order_id)
        return result
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# --- Stripe Specific Endpoints ---

@router.post("/stripe/create-checkout")
def create_stripe_checkout(request: CreateOrderRequest):
    """Create a Stripe Checkout Session."""
    if not request.price_id or not request.success_url or not request.cancel_url:
        raise HTTPException(status_code=400, detail="Missing required Stripe parameters")

    try:
        session = service.create_checkout_session(
            provider="stripe",
            amount=request.amount, # Not always needed if price_id is set
            price_id=request.price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=request.customer_email,
            tenant_id=request.tenant_id,
            mode="subscription" # Default to subscription
        )
        return {"sessionId": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

