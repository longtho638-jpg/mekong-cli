"""
💳 Unified Payments Router
==========================
Handles payments via PaymentService (PayPal v6).
Replaces legacy Braintree router.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])
service = PaymentService()


class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "USD"
    description: Optional[str] = None


class CaptureRequest(BaseModel):
    order_id: str


@router.get("/status")
def get_status():
    """Check payment service status."""
    return {"provider": "PayPal v6", "mode": service.sdk.mode, "status": "active"}


@router.post("/create-order")
def create_order(request: CreateOrderRequest):
    """Create a new payment order."""
    result = service.create_order(
        amount=request.amount, currency=request.currency, description=request.description
    )
    if not result or "error" in result:
        raise HTTPException(status_code=500, detail=result or "Failed to create order")
    return result


@router.post("/capture-order")
def capture_order(request: CaptureRequest):
    """Capture an approved order."""
    result = service.capture_order(request.order_id)
    if not result or "error" in result:
        raise HTTPException(status_code=500, detail=result or "Failed to capture order")
    return result


@router.get("/order/{order_id}")
def get_order(order_id: str):
    """Get order details."""
    result = service.get_order(order_id)
    if not result or "error" in result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result
