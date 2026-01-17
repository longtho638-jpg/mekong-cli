"""
🔗 Webhooks Router - Gumroad Integration
=========================================

Handles webhooks from Gumroad to capture customers
and bring them into the owned platform.

Binh Pháp: "Dụng Gián" - Use Gumroad as scout, Platform as base.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


class GumroadPurchase(BaseModel):
    """Gumroad purchase webhook payload."""

    email: str
    product_id: str
    product_name: str
    price: float
    currency: str = "USD"
    sale_id: str
    license_key: Optional[str] = None
    purchaser_id: Optional[str] = None
    timestamp: str = None


# In-memory store (replace with database in production)
_customers = {}
_purchases = []


def generate_license_key(email: str, product_id: str) -> str:
    """Generate unique license key for customer."""
    import hashlib
    import secrets

    base = f"{email}:{product_id}:{secrets.token_hex(8)}"
    return hashlib.sha256(base.encode()).hexdigest()[:24].upper()


async def send_welcome_email(customer: dict):
    """Send welcome email with license and portal link."""
    logger.info(f"📧 Sending welcome email to {customer['email']}")
    # TODO: Integrate with email provider (SendGrid/Postmark)
    # For now, just log
    logger.info(f"   License: {customer['license_key']}")
    logger.info(
        f"   Portal: https://platform.billmentor.com/activate?key={customer['license_key']}"
    )


async def process_purchase(purchase: GumroadPurchase):
    """Process Gumroad purchase and create platform account."""
    logger.info(
        f"💰 Processing purchase: {purchase.email} bought {purchase.product_name}"
    )

    # Generate license key if not provided
    license_key = purchase.license_key or generate_license_key(
        purchase.email, purchase.product_id
    )

    # Create customer record
    customer = {
        "email": purchase.email,
        "product_id": purchase.product_id,
        "product_name": purchase.product_name,
        "license_key": license_key,
        "purchase_date": datetime.now().isoformat(),
        "sale_id": purchase.sale_id,
        "status": "active",
        "source": "gumroad",
    }

    _customers[purchase.email] = customer
    _purchases.append(
        {**customer, "price": purchase.price, "currency": purchase.currency}
    )

    # Send welcome email
    await send_welcome_email(customer)

    logger.info(f"✅ Customer created: {purchase.email} with license {license_key}")

    return customer


@router.post("/gumroad")
async def gumroad_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle Gumroad purchase webhook.

    Gumroad sends POST with form data on each purchase.
    We capture the customer and bring them to our platform.
    """
    try:
        # Gumroad sends form data, not JSON
        form_data = await request.form()
        data = dict(form_data)

        logger.info(f"🔔 Gumroad webhook received: {data.get('email', 'unknown')}")

        # Parse into our model
        purchase = GumroadPurchase(
            email=data.get("email", ""),
            product_id=data.get("product_id", ""),
            product_name=data.get("product_name", "Unknown Product"),
            price=float(data.get("price", 0)),
            currency=data.get("currency", "USD"),
            sale_id=data.get("sale_id", ""),
            license_key=data.get("license_key"),
            purchaser_id=data.get("purchaser_id"),
        )

        # Process in background
        background_tasks.add_task(process_purchase, purchase)

        return {"status": "success", "message": "Purchase received"}

    except Exception as e:
        logger.error(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/gumroad/test")
async def test_webhook():
    """Test endpoint to verify webhook is working."""
    return {
        "status": "ready",
        "endpoint": "/api/webhooks/gumroad",
        "customers_count": len(_customers),
        "purchases_count": len(_purchases),
    }


@router.get("/customers")
async def list_customers():
    """List all captured customers (admin only in production)."""
    return {"count": len(_customers), "customers": list(_customers.values())}


@router.post("/license/validate")
async def validate_license(license_key: str, email: str):
    """Validate license key for platform access."""
    customer = _customers.get(email)

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer["license_key"] != license_key:
        raise HTTPException(status_code=401, detail="Invalid license key")

    return {
        "valid": True,
        "product": customer["product_name"],
        "status": customer["status"],
        "activated_at": customer.get("activated_at"),
    }
