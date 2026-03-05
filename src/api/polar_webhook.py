"""
Polar.sh Webhook Handler — ROIaaS Phase 2

Handles Polar.sh webhooks for automatic license provisioning.
Events: subscription.created, subscription.cancelled, order.created
"""

from fastapi import APIRouter, Request, HTTPException, Header
import hmac
import hashlib
import json
import os
from datetime import datetime
from typing import Optional

from src.lib.license_generator import generate_license, LicenseKeyGenerator
from src.lib.usage_meter import UsageMeter

router = APIRouter(prefix="/api/v1/polar", tags=["Polar.sh Webhooks"])

# Config
POLAR_WEBHOOK_SECRET = os.getenv("POLAR_WEBHOOK_SECRET")


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Polar.sh webhook signature.

    Polar.sh signs payloads with HMAC-SHA256.
    Signature format: sha256=<hex_signature>
    """
    if not POLAR_WEBHOOK_SECRET:
        print("⚠️  POLAR_WEBHOOK_SECRET not set, skipping signature verification")
        return True  # Allow in dev mode

    try:
        # Parse signature
        if not signature.startswith("sha256="):
            return False
        provided_signature = signature[7:]  # Remove "sha256=" prefix

        # Calculate expected signature
        expected_signature = hmac.new(
            POLAR_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        # Compare
        return hmac.compare_digest(provided_signature, expected_signature)
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False


def process_subscription_created(event_data: dict) -> dict:
    """
    Process subscription.created event.

    Generates a new license key for the subscriber.
    """
    subscription = event_data.get("subscription", {})
    customer = subscription.get("customer", {})
    product = subscription.get("product", {})

    email = customer.get("email", "unknown@example.com")
    customer_id = customer.get("id", "unknown")
    product_name = product.get("name", "Unknown Product")

    # Determine tier from product name/metadata
    tier = "pro"  # Default
    if "enterprise" in product_name.lower():
        tier = "enterprise"
    elif "trial" in product_name.lower():
        tier = "trial"
    elif "free" in product_name.lower():
        tier = "free"

    # Generate license key
    generator = LicenseKeyGenerator()
    license_key = generator.generate_key(tier, email)

    # Store subscription metadata
    # (In production, store in database)
    from pathlib import Path
    import json as json_module

    licenses_path = Path.home() / ".mekong" / "licenses.json"
    licenses_path.parent.mkdir(parents=True, exist_ok=True)

    licenses = {}
    if licenses_path.exists():
        with open(licenses_path, "r") as f:
            licenses = json_module.load(f)

    licenses[license_key] = {
        "subscription_id": subscription.get("id"),
        "customer_id": customer_id,
        "customer_email": email,
        "tier": tier,
        "product_name": product_name,
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
    }

    with open(licenses_path, "w") as f:
        json_module.dump(licenses, f, indent=2)

    print(f"✅ License generated: {license_key[:20]}... for {email} ({tier})")

    return {
        "status": "success",
        "license_key": license_key,
        "tier": tier,
        "email": email,
    }


def process_subscription_cancelled(event_data: dict) -> dict:
    """
    Process subscription.cancelled event.

    Revokes the license key for the cancelled subscription.
    """
    subscription = event_data.get("subscription", {})
    subscription_id = subscription.get("id")

    # Find and revoke license
    from pathlib import Path
    import json as json_module

    licenses_path = Path.home() / ".mekong" / "licenses.json"
    revoked_path = Path.home() / ".mekong" / "revoked.json"

    revoked = []
    if revoked_path.exists():
        with open(revoked_path, "r") as f:
            revoked = json_module.load(f)

    if licenses_path.exists():
        with open(licenses_path, "r") as f:
            licenses = json_module.load(f)

        # Find license by subscription_id
        for license_key, metadata in licenses.items():
            if metadata.get("subscription_id") == subscription_id:
                # Extract key_id and add to revoked list
                parts = license_key.split("-")
                key_id = parts[2] if len(parts) >= 3 else license_key

                if key_id not in revoked:
                    revoked.append(key_id)

                    # Update license status
                    licenses[license_key]["status"] = "cancelled"
                    licenses[license_key]["cancelled_at"] = datetime.utcnow().isoformat()

                    print(f"✅ License revoked: {license_key[:20]}... (subscription {subscription_id})")

        # Save updated data
        with open(licenses_path, "w") as f:
            json_module.dump(licenses, f, indent=2)
        with open(revoked_path, "w") as f:
            json_module.dump(revoked, f, indent=2)

    return {"status": "success", "revoked": True}


def process_order_created(event_data: dict) -> dict:
    """
    Process order.created event.

    Generates a license key for one-time purchases.
    """
    order = event_data.get("order", {})
    customer = order.get("customer", {})

    email = customer.get("email", "unknown@example.com")

    # Generate trial license for one-time purchase
    generator = LicenseKeyGenerator()
    license_key = generator.generate_key("trial", email, days=30)  # 30-day trial

    return {
        "status": "success",
        "license_key": license_key,
        "tier": "trial",
        "email": email,
    }


@router.post("/webhook")
async def handle_webhook(
    request: Request,
    x_polar_signature: Optional[str] = Header(None, alias="X-Polar-Signature"),
):
    """
    Handle Polar.sh webhook events.

    Supported events:
    - subscription.created
    - subscription.cancelled
    - order.created
    """
    # Get raw payload
    payload = await request.body()
    content_type = request.headers.get("content-type", "")

    if "application/json" not in content_type:
        raise HTTPException(status_code=400, detail="Invalid content type")

    # Verify signature
    if not verify_webhook_signature(payload, x_polar_signature or ""):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse event
    try:
        event_data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event_data.get("type", event_data.get("event_type", ""))

    print(f"📬 Received Polar.sh webhook: {event_type}")

    # Route to handler
    handlers = {
        "subscription.created": process_subscription_created,
        "subscription.cancelled": process_subscription_cancelled,
        "order.created": process_order_created,
    }

    handler = handlers.get(event_type)
    if not handler:
        print(f"⚠️  Unhandled event type: {event_type}")
        return {"status": "ignored", "event_type": event_type}

    result = handler(event_data)
    return result


@router.get("/test")
async def test_webhook():
    """Test webhook endpoint."""
    return {
        "status": "ok",
        "message": "Polar.sh webhook handler is running",
        "secret_configured": bool(POLAR_WEBHOOK_SECRET),
    }


__all__ = ["router"]
