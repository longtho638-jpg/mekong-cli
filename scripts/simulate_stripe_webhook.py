import time
import json
import os
import requests
import stripe
from dotenv import load_dotenv

# Load env to get the secret
load_dotenv()

# Configuration
WEBHOOK_URL = "http://localhost:8000/webhooks/stripe"
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

def generate_signature(payload, secret):
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload}"
    signature = stripe.WebhookSignature._compute_signature(signed_payload, secret)
    return f"t={timestamp},v1={signature}"

def simulate_checkout_completed():
    payload_data = {
        "id": "evt_test_webhook",
        "object": "event",
        "type": "checkout.session.completed",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": "cs_test_session",
                "object": "checkout.session",
                "subscription": "sub_test_123",
                "customer": "cus_test_123",
                "customer_details": {
                    "email": "test@example.com"
                },
                "metadata": {
                    "tenantId": "tenant_test_123"
                }
            }
        }
    }

    payload_str = json.dumps(payload_data)

    headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": generate_signature(payload_str, WEBHOOK_SECRET)
    }

    print(f"Sending webhook to {WEBHOOK_URL}...")
    try:
        response = requests.post(WEBHOOK_URL, data=payload_str, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error sending request: {e}")

if __name__ == "__main__":
    simulate_checkout_completed()
