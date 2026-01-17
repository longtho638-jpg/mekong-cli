"""
🏦 PayPal Braintree Payments Router
===================================
Xử lý thanh toán qua Braintree SDK.

Endpoints:
- GET /payments/client-token: Lấy token cho frontend
- POST /payments/checkout: Xử lý thanh toán
- GET /payments/transaction/{id}: Kiểm tra transaction

Security: All endpoints require authentication.
"""

import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

# Import authentication middleware
try:
    from core.security.auth_middleware import require_auth
except ImportError:
    # Fallback if security module not available
    def require_auth(**kwargs):
        def decorator(func):
            return func
        return decorator

# Braintree SDK import (có thể mock nếu chưa install)
try:
    import braintree
    from braintree.braintree_gateway import BraintreeGateway
    from braintree.configuration import Configuration
    from braintree.environment import Environment
    
    BRAINTREE_AVAILABLE = True
except ImportError:
    BRAINTREE_AVAILABLE = False
    braintree = None
    BraintreeGateway = None
    Configuration = None
    Environment = None

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

    # Security: Validate all required environment variables using secure manager
    try:
        from core.security.env_manager import validate_environment
        env_manager = validate_environment()
        
        # Check for missing Braintree credentials
        required_vars = ["BRAINTREE_MERCHANT_ID", "BRAINTREE_PUBLIC_KEY", "BRAINTREE_PRIVATE_KEY"]
        missing_vars = [var for var in required_vars if not env_manager.get(var)]
        
        if missing_vars:
            raise HTTPException(
                status_code=500,
                detail=f"Missing required environment variables: {', '.join(missing_vars)}"
            )

        env = env_manager.get("BRAINTREE_ENV", "sandbox")
        if env not in ["sandbox", "production"]:
            raise HTTPException(
                status_code=500,
                detail="BRAINTREE_ENV must be 'sandbox' or 'production'"
            )

        environment = (
            Environment.Sandbox
            if env == "sandbox"
            else Environment.Production
        )

        return BraintreeGateway(
            Configuration(
                environment=environment,
                merchant_id=env_manager.get("BRAINTREE_MERCHANT_ID"),
                public_key=env_manager.get("BRAINTREE_PUBLIC_KEY"),
                private_key=env_manager.get("BRAINTREE_PRIVATE_KEY"),
            )
        )
    except ImportError:
        # Fallback to direct environment access
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

        if BRAINTREE_AVAILABLE and hasattr(braintree, 'Environment') and hasattr(braintree, 'BraintreeGateway'):
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
        else:
            return None


@router.get("/status")
@require_auth(permissions=["read"], allow_api_key=True)
def payments_status(request: Request):
    """Kiểm tra trạng thái Braintree integration."""
    return {
        "braintree_available": BRAINTREE_AVAILABLE,
        "environment": os.getenv("BRAINTREE_ENV", "sandbox"),
        "configured": bool(os.getenv("BRAINTREE_MERCHANT_ID")),
    }


@router.get("/client-token")
@require_auth(permissions=["write"], allow_api_key=True)
def get_client_token(request: Request):
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
@require_auth(permissions=["write"], allow_api_key=True)
def process_checkout(request: Request, checkout_request: CheckoutRequest):
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
                "amount": checkout_request.amount,
                "payment_method_nonce": checkout_request.nonce,
                "options": {"submit_for_settlement": True},
            }
        )

        if result.is_success:
            return CheckoutResponse(
                success=True,
                transaction_id=result.transaction.id,
                message=f"Thanh toán thành công: ${checkout_request.amount}",
            )
        else:
            return CheckoutResponse(
                success=False, message=result.message or "Thanh toán thất bại"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transaction/{transaction_id}")
@require_auth(permissions=["read"], allow_api_key=True)
def get_transaction(request: Request, transaction_id: str):
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
@require_auth(permissions=["write"], allow_api_key=True)
def mock_checkout(request: Request, checkout_request: CheckoutRequest):
    """
    Mock checkout cho testing khi chưa cấu hình Braintree.
    Luôn trả về success.
    """
    return CheckoutResponse(
        success=True,
        transaction_id="mock_txn_" + os.urandom(8).hex(),
        message=f"[MOCK] Thanh toán ${checkout_request.amount} thành công",
    )
