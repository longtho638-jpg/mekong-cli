"""
💳 PayPal Payments Router (SDK v6)
==================================
Modern PayPal checkout replacing Braintree.
Lower fees: ~5% vs ~6% Polar.

Endpoints:
- POST /payments/paypal/create-order: Create PayPal order
- POST /payments/paypal/capture-order: Capture after approval
- GET /payments/paypal/order/{id}: Get order status
"""

import base64
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/payments/paypal", tags=["PayPal Payments"])


# Schemas
class CreateOrderRequest(BaseModel):
    """Request for creating PayPal order."""

    amount: str
    currency: str = "USD"
    description: Optional[str] = None


class CaptureOrderRequest(BaseModel):
    """Request for capturing PayPal order."""

    orderId: str


class OrderResponse(BaseModel):
    """Response with order details."""

    orderId: str
    status: str
    approvalUrl: Optional[str] = None


class CaptureResponse(BaseModel):
    """Response after capture."""

    transactionId: str
    status: str
    amount: str


# PayPal API Configuration
def get_paypal_config():
    """Get PayPal API configuration."""
    mode = os.getenv("PAYPAL_MODE", "sandbox")

    if mode == "live":
        base_url = "https://api-m.paypal.com"
    else:
        base_url = "https://api-m.sandbox.paypal.com"

    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET")

    return {
        "base_url": base_url,
        "client_id": client_id,
        "client_secret": client_secret,
        "mode": mode,
    }


async def get_access_token() -> str:
    """Get PayPal access token."""
    config = get_paypal_config()

    if not config["client_id"] or not config["client_secret"]:
        raise HTTPException(
            status_code=503,
            detail="PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
        )

    auth = base64.b64encode(
        f"{config['client_id']}:{config['client_secret']}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config['base_url']}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data="grant_type=client_credentials",
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get PayPal access token: {response.text}",
            )

        return response.json()["access_token"]


@router.get("/status")
async def paypal_status():
    """Check PayPal integration status."""
    config = get_paypal_config()
    return {
        "paypal_configured": bool(config["client_id"]),
        "mode": config["mode"],
        "fee_rate": "~5% (3.49% + 1.5% int'l)",
    }


@router.post("/create-order", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest):
    """
    Create PayPal order for checkout.
    Returns orderId and approvalUrl for redirect.
    """
    config = get_paypal_config()

    # Mock mode if not configured
    if not config["client_id"]:
        mock_id = f"mock_{os.urandom(8).hex()}"
        return OrderResponse(
            orderId=mock_id,
            status="CREATED",
            approvalUrl=None,
        )

    access_token = await get_access_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config['base_url']}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {
                            "currency_code": request.currency,
                            "value": request.amount,
                        },
                        "description": request.description or "AgencyOS Payment",
                    }
                ],
                "application_context": {
                    "return_url": os.getenv(
                        "PAYPAL_RETURN_URL", "http://localhost:3000/checkout/success"
                    ),
                    "cancel_url": os.getenv(
                        "PAYPAL_CANCEL_URL", "http://localhost:3000/checkout/cancel"
                    ),
                },
            },
        )

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create PayPal order: {response.text}",
            )

        data = response.json()
        approval_url = next(
            (
                link["href"]
                for link in data.get("links", [])
                if link["rel"] == "approve"
            ),
            None,
        )

        return OrderResponse(
            orderId=data["id"],
            status=data["status"],
            approvalUrl=approval_url,
        )


@router.post("/capture-order", response_model=CaptureResponse)
async def capture_order(request: CaptureOrderRequest):
    """
    Capture PayPal order after user approval.
    Called when user returns from PayPal.
    """
    config = get_paypal_config()

    # Mock mode
    if request.orderId.startswith("mock_"):
        return CaptureResponse(
            transactionId=f"txn_{os.urandom(8).hex()}",
            status="COMPLETED",
            amount="0.00",
        )

    access_token = await get_access_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config['base_url']}/v2/checkout/orders/{request.orderId}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=500, detail=f"Failed to capture order: {response.text}"
            )

        data = response.json()
        capture = (
            data.get("purchase_units", [{}])[0]
            .get("payments", {})
            .get("captures", [{}])[0]
        )

        return CaptureResponse(
            transactionId=data["id"],
            status=data["status"],
            amount=capture.get("amount", {}).get("value", "0.00"),
        )


@router.get("/order/{order_id}")
async def get_order(order_id: str):
    """Get PayPal order details."""
    config = get_paypal_config()

    if order_id.startswith("mock_"):
        return {
            "id": order_id,
            "status": "COMPLETED",
            "mock": True,
        }

    access_token = await get_access_token()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{config['base_url']}/v2/checkout/orders/{order_id}",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
        )

        if response.status_code != 200:
            raise HTTPException(status_code=404, detail=f"Order not found: {order_id}")

        return response.json()
