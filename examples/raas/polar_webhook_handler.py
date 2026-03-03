#!/usr/bin/env python3
"""
Example: Handle Polar.sh webhook for mission payments

This example shows how to handle Polar.sh webhooks
to credit user accounts when they purchase credits.
"""

from fastapi import FastAPI, Request, HTTPException
from mekong.raas import CreditStore
import hashlib
import hmac
import os

app = FastAPI()

POLAR_WEBHOOK_SECRET = os.getenv("POLAR_WEBHOOK_SECRET")
credit_store = CreditStore()


@app.post("/webhooks/polar")
async def polar_webhook(request: Request):
    """
    Handle Polar.sh webhook events.

    Events:
    - checkout.created: User purchased credits
    - checkout.updated: Payment status changed
    """
    # Verify webhook signature
    payload = await request.body()
    signature = request.headers.get("x-polar-signature")

    if not verify_signature(payload, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "checkout.created":
        await handle_checkout_created(data)

    return {"status": "ok"}


async def handle_checkout_created(checkout_data: dict):
    """Credit user account when checkout is created."""
    user_id = checkout_data.get("metadata", {}).get("user_id")
    credits_purchased = checkout_data.get("metadata", {}).get("credits", 0)
    amount = checkout_data.get("total_amount") / 100  # Convert cents to dollars

    if not user_id or not credits_purchased:
        return

    # Add credits to user account
    await credit_store.add_credits(
        user_id=user_id,
        amount=credits_purchased,
        source="polar_purchase",
        transaction_id=checkout_data.get("id"),
    )

    print(f"✅ Added {credits_purchased} credits to user {user_id} (${amount})")


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify Polar.sh webhook signature."""
    if not POLAR_WEBHOOK_SECRET:
        return False

    expected = hmac.new(
        POLAR_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
