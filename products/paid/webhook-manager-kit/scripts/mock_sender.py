import argparse
import time
import hmac
import hashlib
import json
import requests
import uuid

def generate_signature(secret, payload, provider):
    if provider == "stripe":
        timestamp = int(time.time())
        signed_payload = f"{timestamp}.".encode() + payload.encode()
        signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return {
            "Stripe-Signature": f"t={timestamp},v1={signature}"
        }
    elif provider == "github":
        signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return {
            "X-Hub-Signature-256": f"sha256={signature}",
            "X-GitHub-Event": "push"
        }
    elif provider == "shopify":
        import base64
        digest = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
        signature = base64.b64encode(digest).decode()
        return {
            "X-Shopify-Hmac-Sha256": signature,
            "X-Shopify-Topic": "orders/create"
        }
    else:
        return {}

def main():
    parser = argparse.ArgumentParser(description="Mock Webhook Sender")
    parser.add_argument("--url", default="http://localhost:8000/api/v1/receiver", help="Target URL base")
    parser.add_argument("--provider", required=True, choices=["stripe", "github", "shopify", "gumroad"], help="Provider type")
    parser.add_argument("--secret", default="webhook-secret-key", help="Webhook secret")
    parser.add_argument("--event", default="test.event", help="Event type")

    args = parser.parse_args()

    # Construct payload based on provider
    payload_data = {}
    if args.provider == "stripe":
        payload_data = {
            "id": f"evt_{uuid.uuid4()}",
            "object": "event",
            "type": args.event,
            "data": {"object": {"id": f"ch_{uuid.uuid4()}", "amount": 1000}}
        }
    elif args.provider == "github":
        payload_data = {
            "ref": "refs/heads/main",
            "repository": {"name": "test-repo", "id": 12345},
            "pusher": {"name": "testuser"}
        }
        if args.event != "test.event":
            # Override header event if needed, though simple script assumes push usually
            pass
    elif args.provider == "shopify":
        payload_data = {
            "id": 12345,
            "email": "test@example.com",
            "total_price": "10.00"
        }
    elif args.provider == "gumroad":
        payload_data = {
            "sale_id": str(uuid.uuid4()),
            "email": "buyer@example.com",
            "price": "100"
        }

    payload_str = json.dumps(payload_data)

    # Generate headers
    target_url = f"{args.url}/{args.provider}"
    headers = {"Content-Type": "application/json"}

    if args.provider != "gumroad":
        sig_headers = generate_signature(args.secret, payload_str, args.provider)
        headers.update(sig_headers)
    else:
        # Gumroad sends form-data usually, but we simulate JSON here for simplicity
        # unless we want to use requests data=...
        # Our receiver handles both.
        pass

    print(f"Sending {args.provider} webhook to {target_url}...")
    try:
        if args.provider == "gumroad":
            # Simulate form data for gumroad
            # Add secret to payload if needed by some implementations, or just send
            resp = requests.post(target_url, data=payload_data)
        else:
            resp = requests.post(target_url, data=payload_str, headers=headers)

        print(f"Response: {resp.status_code}")
        print(resp.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
