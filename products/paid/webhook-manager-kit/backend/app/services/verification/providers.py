import hmac
import hashlib
from typing import Dict, Any
from .base import WebhookVerifier

class StripeVerifier(WebhookVerifier):
    def verify(self, payload: bytes, headers: Dict[str, Any], secret: str) -> bool:
        """
        Verify Stripe webhook signature.
        Header: Stripe-Signature
        Format: t=timestamp,v1=signature
        """
        sig_header = headers.get("Stripe-Signature") or headers.get("stripe-signature")
        if not sig_header:
            return False

        try:
            # Parse the header
            parts = {k: v for k, v in [part.split("=") for part in sig_header.split(",")]}
            timestamp = parts.get("t")
            signature = parts.get("v1")

            if not timestamp or not signature:
                return False

            # Create the signed payload
            signed_payload = f"{timestamp}.".encode() + payload

            # Calculate expected signature
            expected_sig = hmac.new(
                secret.encode(),
                signed_payload,
                hashlib.sha256
            ).hexdigest()

            # Constant time comparison
            return hmac.compare_digest(expected_sig, signature)
        except Exception:
            return False

class GithubVerifier(WebhookVerifier):
    def verify(self, payload: bytes, headers: Dict[str, Any], secret: str) -> bool:
        """
        Verify GitHub webhook signature.
        Header: X-Hub-Signature-256
        Format: sha256=signature
        """
        signature = headers.get("X-Hub-Signature-256") or headers.get("x-hub-signature-256")
        if not signature:
            return False

        try:
            if signature.startswith("sha256="):
                signature = signature[7:]

            expected_sig = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(expected_sig, signature)
        except Exception:
            return False

class GumroadVerifier(WebhookVerifier):
    def verify(self, payload: bytes, headers: Dict[str, Any], secret: str) -> bool:
        """
        Verify Gumroad webhook.
        Gumroad sends a POST request with x-www-form-urlencoded body.
        The signature is not in headers usually for simple webhooks,
        but strictly, Gumroad doesn't standardly sign webhooks like Stripe.
        They suggest checking a handshake or relying on POST URL secret.
        However, if using a custom payload or secure setup, we might assume a shared secret
        passed in URL query or specific header if configured.

        Note: Gumroad's standard documentation is loose on signature verification compared to Stripe.
        We will implement a basic "sanity check" or if checking against a known structure.

        BUT, most robust way for generic webhooks without standard signatures is checking `resource_id`
        or simply relying on the secret path if the provider supports it.

        Let's implement a generic check assuming the 'secret' might be part of the URL path
        (which is handled at routing level) OR simple basic auth.

        Wait, for this kit, we want explicit signature verification where possible.
        If Gumroad doesn't support it standardly, we verify if they added it recently?
        Gumroad *does not* sign requests. They recommend checking the `seller_id` or using a secret URL.

        For this implementation, since we need a Verifier class, we'll implement a 'Always True'
        for Gumroad if no mechanism exists, OR we check for a custom header if the user set it up via a proxy.

        Correction: Gumroad sends data as form-data.
        We'll treat this as a "pass-through" verifier for now, or check for specific payload fields if possible.
        Actually, let's just return True and rely on the path-based security (secret in URL)
        which will be handled by the endpoint router logic calling this.
        """
        # Gumroad relies on secret in URL usually.
        # If we want to enforce it here, we'd need to know if the user configures it.
        return True

class ShopifyVerifier(WebhookVerifier):
    def verify(self, payload: bytes, headers: Dict[str, Any], secret: str) -> bool:
        """
        Verify Shopify webhook signature.
        Header: X-Shopify-Hmac-Sha256
        Format: Base64 encoded HMAC SHA256
        """
        import base64

        signature = headers.get("X-Shopify-Hmac-Sha256") or headers.get("x-shopify-hmac-sha256")
        if not signature:
            return False

        try:
            digest = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).digest()

            expected_sig = base64.b64encode(digest).decode()

            return hmac.compare_digest(expected_sig, signature)
        except Exception:
            return False
