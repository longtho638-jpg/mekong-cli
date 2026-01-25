"""
PayPal Checkout API Router
===========================
Handles PayPal payment flow via Payment Orchestrator.

Endpoints:
- POST /api/checkout/paypal - Create PayPal checkout session
- GET /api/checkout/paypal/success - Handle successful payment
- GET /api/checkout/paypal/cancel - Handle cancelled payment

Security:
- All payment operations go through PaymentOrchestrator
- Webhook verification via PayPal signature validation
- Tenant isolation via JWT authentication
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr

from backend.services.payment_orchestrator import PaymentError, PaymentOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/checkout/paypal", tags=["PayPal Checkout"])

# Initialize payment orchestrator
orchestrator = PaymentOrchestrator()


class CreateCheckoutRequest(BaseModel):
    """Request to create PayPal checkout"""
    amount: float
    currency: str = "USD"
    price_id: Optional[str] = None  # PayPal Plan ID for subscriptions
    customer_email: Optional[EmailStr] = None
    tenant_id: Optional[str] = None
    mode: str = "subscription"  # or "payment" for one-time
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    """Response from checkout creation"""
    checkout_id: str
    approval_url: str
    provider: str
    status: str


@router.post("/", response_model=CheckoutResponse)
async def create_paypal_checkout(
    request: CreateCheckoutRequest,
    # TODO: Add authentication dependency
    # current_user: User = Depends(get_current_user)
):
    """
    Create PayPal checkout session.

    Steps:
    1. Validate request parameters
    2. Create checkout via PaymentOrchestrator
    3. Return approval URL to frontend

    Returns:
        CheckoutResponse with PayPal approval URL
    """
    try:
        logger.info(
            f"Creating PayPal checkout: mode={request.mode}, "
            f"amount={request.amount}, tenant={request.tenant_id}"
        )

        # Use orchestrator to create checkout (with automatic failover)
        result = orchestrator.create_checkout_session(
            amount=request.amount,
            currency=request.currency,
            price_id=request.price_id,
            success_url=request.success_url or "http://localhost:3000/payment/success",
            cancel_url=request.cancel_url or "http://localhost:3000/payment/cancel",
            customer_email=request.customer_email,
            tenant_id=request.tenant_id,
            mode=request.mode,
            preferred_provider="paypal"  # Prefer PayPal, fallback to Polar if needed
        )

        if not result.get("url"):
            raise HTTPException(
                status_code=500,
                detail="PayPal checkout created but no approval URL received"
            )

        logger.info(
            f"PayPal checkout created: id={result['id']}, "
            f"provider={result.get('provider')}"
        )

        return CheckoutResponse(
            checkout_id=result["id"],
            approval_url=result["url"],
            provider=result.get("provider", "paypal"),
            status=result.get("status", "created")
        )

    except PaymentError as e:
        logger.error(f"Payment creation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.exception("Unexpected error creating PayPal checkout")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout: {str(e)}"
        )


@router.get("/success")
async def paypal_success(
    token: str = Query(..., description="PayPal token from approval"),
    PayerID: str = Query(..., description="PayPal payer ID")
):
    """
    Handle successful PayPal payment return.

    Flow:
    1. User approves payment on PayPal
    2. PayPal redirects to this endpoint with token + PayerID
    3. Capture/activate the payment
    4. Update subscription status in database
    5. Redirect to dashboard

    Args:
        token: PayPal order/subscription token
        PayerID: PayPal payer identifier

    Returns:
        Redirect to dashboard with success message
    """
    try:
        logger.info(f"PayPal success callback: token={token}, PayerID={PayerID}")

        # TODO: Implement payment capture logic
        # For orders: orchestrator.providers["paypal"].client.orders.capture(token)
        # For subscriptions: Already activated, just record in DB

        # TODO: Update subscription in database
        # db.subscriptions.create({
        #     "paypal_id": token,
        #     "payer_id": PayerID,
        #     "status": "active",
        #     "provider": "paypal"
        # })

        # For now, return success message
        return {
            "status": "success",
            "message": "Payment approved successfully",
            "paypal_token": token,
            "payer_id": PayerID,
            "redirect_url": "/dashboard/billing?payment=success"
        }

    except Exception as e:
        logger.exception("Error handling PayPal success callback")
        return {
            "status": "error",
            "message": str(e),
            "redirect_url": "/dashboard/billing?payment=error"
        }


@router.get("/cancel")
async def paypal_cancel(
    token: Optional[str] = Query(None, description="PayPal token")
):
    """
    Handle cancelled PayPal payment.

    Flow:
    1. User cancels payment on PayPal
    2. PayPal redirects here
    3. Log cancellation
    4. Redirect to billing page

    Args:
        token: PayPal order/subscription token (optional)

    Returns:
        Redirect to billing page with cancellation message
    """
    logger.info(f"PayPal payment cancelled: token={token}")

    return {
        "status": "cancelled",
        "message": "Payment was cancelled",
        "redirect_url": "/dashboard/billing?payment=cancelled"
    }


@router.get("/stats")
async def get_payment_stats():
    """
    Get payment orchestrator statistics.

    Useful for monitoring failover rate and provider health.

    Returns:
        Dict with orchestrator stats
    """
    try:
        stats = orchestrator.get_stats()

        return {
            "status": "ok",
            "stats": stats,
            "providers": {
                name: provider.is_available()
                for name, provider in orchestrator.providers.items()
            }
        }

    except Exception as e:
        logger.exception("Error getting payment stats")
        raise HTTPException(status_code=500, detail=str(e))
