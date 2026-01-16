"""
🏦 PayPal Braintree Payments Router
====================================
Xử lý thanh toán qua Braintree SDK.

Endpoints:
- GET /payments/client-token: Lấy token cho frontend
- POST /payments/checkout: Xử lý thanh toán
- GET /payments/transaction/{id}: Kiểm tra transaction
"""

import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Braintree SDK import (có thể mock nếu chưa install)
try:
    import braintree

    BRAINTREE_AVAILABLE = True
except ImportError:
    BRAINTREE_AVAILABLE = False
    braintree = None

router = APIRouter(prefix="/payments", tags=["Payments"])


# Schemas
class CheckoutRequest(BaseModel):
    """Request body cho checkout."""

    nonce: str
    amount: str
    description: Optional[str] = None


class CheckoutResponse(BaseModel):
    """Response từ checkout."""

    success: bool
    transaction_id: Optional[str] = None
    message: str


# Braintree Gateway Configuration - Security fix: Validate all credentials
def get_gateway():
    """Tạo Braintree gateway từ environment variables."""
    if not BRAINTREE_AVAILABLE:
        return None

    # Security: Validate all required environment variables
    required_vars = ["BRAINTREE_MERCHANT_ID", "BRAINTREE_PUBLIC_KEY", "BRAINTREE_PRIVATE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise HTTPException(
            status_code=500,
            detail=f"Missing required environment variables: {', '.join(missing_vars)}"
        )

    env = os.getenv("BRAINTREE_ENV", "sandbox")
    if env not in ["sandbox", "production"]:
        raise HTTPException(
            status_code=500,
            detail="BRAINTREE_ENV must be 'sandbox' or 'production'"
        )

    environment = (
        braintree.Environment.Sandbox
        if env == "sandbox"
        else braintree.Environment.Production
    )

    return braintree.BraintreeGateway(
        braintree.Configuration(
            environment=environment,
            merchant_id=os.getenv("BRAINTREE_MERCHANT_ID"),
            public_key=os.getenv("BRAINTREE_PUBLIC_KEY"),
            private_key=os.getenv("BRAINTREE_PRIVATE_KEY"),
        )
    )


@router.get("/status")
def payments_status():
    """Kiểm tra trạng thái Braintree integration."""
    return {
        "braintree_available": BRAINTREE_AVAILABLE,
        "environment": os.getenv("BRAINTREE_ENV", "sandbox"),
        "configured": bool(os.getenv("BRAINTREE_MERCHANT_ID")),
    }


@router.get("/client-token")
def get_client_token():
    """
    Tạo client token cho frontend Drop-in UI.

    Frontend sẽ dùng token này để khởi tạo Braintree Drop-in.
    """
    gateway = get_gateway()

    if not gateway:
        raise HTTPException(
            status_code=503,
            detail="Braintree SDK chưa được cài đặt. Chạy: pip install braintree",
        )

    if not os.getenv("BRAINTREE_MERCHANT_ID"):
        raise HTTPException(
            status_code=503,
            detail="Braintree chưa được cấu hình. Check environment variables.",
        )

    try:
        token = gateway.client_token.generate()
        return {"token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkout", response_model=CheckoutResponse)
def process_checkout(request: CheckoutRequest):
    """
    Xử lý thanh toán.

    - nonce: Payment method nonce từ frontend
    - amount: Số tiền (USD)
    - description: Mô tả giao dịch (optional)
    """
    gateway = get_gateway()

    if not gateway:
        raise HTTPException(status_code=503, detail="Braintree SDK chưa được cài đặt")

    try:
        result = gateway.transaction.sale(
            {
                "amount": request.amount,
                "payment_method_nonce": request.nonce,
                "options": {"submit_for_settlement": True},
            }
        )

        if result.is_success:
            return CheckoutResponse(
                success=True,
                transaction_id=result.transaction.id,
                message=f"Thanh toán thành công: ${request.amount}",
            )
        else:
            return CheckoutResponse(
                success=False, message=result.message or "Thanh toán thất bại"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transaction/{transaction_id}")
def get_transaction(transaction_id: str):
    """Lấy thông tin transaction."""
    gateway = get_gateway()

    if not gateway:
        raise HTTPException(status_code=503, detail="Braintree chưa sẵn sàng")

    try:
        transaction = gateway.transaction.find(transaction_id)
        return {
            "id": transaction.id,
            "status": transaction.status,
            "amount": transaction.amount,
            "created_at": str(transaction.created_at),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Transaction không tìm thấy: {e}")


# Mock endpoint cho testing khi chưa có Braintree
@router.post("/mock-checkout")
def mock_checkout(request: CheckoutRequest):
    """
    Mock checkout cho testing khi chưa cấu hình Braintree.
    Luôn trả về success.
    """
    return CheckoutResponse(
        success=True,
        transaction_id="mock_txn_" + os.urandom(8).hex(),
        message=f"[MOCK] Thanh toán ${request.amount} thành công",
    )
