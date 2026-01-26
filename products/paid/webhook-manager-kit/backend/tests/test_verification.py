import pytest
import hmac
import hashlib
import time
from app.services.verification.providers import StripeVerifier, GithubVerifier, ShopifyVerifier
import base64

@pytest.fixture
def secret():
    return "test_secret"

def test_stripe_verifier(secret):
    verifier = StripeVerifier()
    payload = b'{"id": "evt_123"}'
    timestamp = int(time.time())

    signed_payload = f"{timestamp}.".encode() + payload
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    headers = {
        "Stripe-Signature": f"t={timestamp},v1={signature}"
    }

    assert verifier.verify(payload, headers, secret) is True

    # Test invalid signature
    headers["Stripe-Signature"] = f"t={timestamp},v1=invalid"
    assert verifier.verify(payload, headers, secret) is False

def test_github_verifier(secret):
    verifier = GithubVerifier()
    payload = b'{"ref": "refs/heads/main"}'

    signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

    headers = {
        "X-Hub-Signature-256": f"sha256={signature}"
    }

    assert verifier.verify(payload, headers, secret) is True

    # Test invalid signature
    headers["X-Hub-Signature-256"] = "sha256=invalid"
    assert verifier.verify(payload, headers, secret) is False

def test_shopify_verifier(secret):
    verifier = ShopifyVerifier()
    payload = b'{"id": 12345}'

    digest = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    signature = base64.b64encode(digest).decode()

    headers = {
        "X-Shopify-Hmac-Sha256": signature
    }

    assert verifier.verify(payload, headers, secret) is True

    # Test invalid signature
    headers["X-Shopify-Hmac-Sha256"] = "invalid"
    assert verifier.verify(payload, headers, secret) is False
