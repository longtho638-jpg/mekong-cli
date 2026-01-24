"""
🔐 Webhook Signature Verification Middleware
=============================================
Security-critical middleware for verifying webhook authenticity from payment providers.

Features:
- HMAC-SHA256 signature verification for Gumroad webhooks
- Stripe webhook signature verification using Stripe SDK
- Comprehensive logging of all verification attempts
- Reject invalid signatures with 401 Unauthorized
- Support for timestamp validation to prevent replay attacks
"""

import hashlib
import hmac
import logging
import os
import time
from typing import Optional

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# Security constants
MAX_TIMESTAMP_AGE = 300  # 5 minutes - prevent replay attacks
STRIPE_TOLERANCE = 300  # Stripe default tolerance (5 minutes)


class WebhookAuthError(HTTPException):
    """Custom exception for webhook authentication failures."""

    def __init__(self, detail: str, provider: str = "unknown"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )
        self.provider = provider
        logger.error(f"🚫 Webhook Auth Failed [{provider}]: {detail}")


def verify_gumroad_signature(
    payload: bytes,
    signature_header: Optional[str],
    secret: str
) -> bool:
    """
    Verify Gumroad webhook signature using HMAC-SHA256.

    Gumroad sends the signature in the X-Gumroad-Signature header as:
    - Format: HMAC-SHA256 hex digest
    - Computed from: raw request body

    Args:
        payload: Raw webhook body as bytes
        signature_header: X-Gumroad-Signature header value
        secret: Gumroad webhook secret from environment

    Returns:
        True if signature is valid, False otherwise

    Raises:
        WebhookAuthError: If signature validation fails
    """
    if not signature_header:
        logger.warning("⚠️ Gumroad webhook missing signature header")
        raise WebhookAuthError(
            detail="Missing X-Gumroad-Signature header",
            provider="gumroad"
        )

    if not secret:
        logger.error("❌ GUMROAD_WEBHOOK_SECRET not configured")
        raise WebhookAuthError(
            detail="Webhook secret not configured",
            provider="gumroad"
        )

    try:
        # Compute expected signature
        expected_signature = hmac.new(
            key=secret.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()

        # Compare signatures using constant-time comparison
        is_valid = hmac.compare_digest(
            expected_signature,
            signature_header.strip()
        )

        if is_valid:
            logger.info("✅ Gumroad webhook signature verified")
            return True
        else:
            logger.warning(
                f"⚠️ Gumroad signature mismatch\n"
                f"  Expected: {expected_signature[:16]}...\n"
                f"  Received: {signature_header[:16]}..."
            )
            raise WebhookAuthError(
                detail="Invalid webhook signature",
                provider="gumroad"
            )

    except Exception as e:
        logger.error(f"❌ Gumroad signature verification error: {e}")
        raise WebhookAuthError(
            detail=f"Signature verification failed: {str(e)}",
            provider="gumroad"
        )


def verify_stripe_signature(
    payload: bytes,
    signature_header: Optional[str],
    secret: str,
    tolerance: int = STRIPE_TOLERANCE
) -> dict:
    """
    Verify Stripe webhook signature.

    Stripe sends signatures in Stripe-Signature header format:
    t=timestamp,v1=signature,v0=signature

    Args:
        payload: Raw webhook body as bytes
        signature_header: Stripe-Signature header value
        secret: Stripe webhook secret (starts with whsec_)
        tolerance: Maximum age of webhook in seconds (default 300)

    Returns:
        Parsed event dict if valid

    Raises:
        WebhookAuthError: If signature validation fails
    """
    if not signature_header:
        logger.warning("⚠️ Stripe webhook missing signature header")
        raise WebhookAuthError(
            detail="Missing Stripe-Signature header",
            provider="stripe"
        )

    if not secret:
        logger.error("❌ STRIPE_WEBHOOK_SECRET not configured")
        raise WebhookAuthError(
            detail="Webhook secret not configured",
            provider="stripe"
        )

    try:
        # Use Stripe SDK for verification (more robust)
        import stripe

        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature_header,
            secret=secret,
            tolerance=tolerance
        )

        logger.info(f"✅ Stripe webhook signature verified: {event.get('type')}")
        return event

    except stripe.error.SignatureVerificationError as e:
        logger.warning(f"⚠️ Stripe signature verification failed: {e}")
        raise WebhookAuthError(
            detail="Invalid webhook signature",
            provider="stripe"
        )
    except ValueError as e:
        logger.error(f"❌ Stripe webhook payload error: {e}")
        raise WebhookAuthError(
            detail=f"Invalid webhook payload: {str(e)}",
            provider="stripe"
        )
    except Exception as e:
        logger.error(f"❌ Stripe signature verification error: {e}")
        raise WebhookAuthError(
            detail=f"Signature verification failed: {str(e)}",
            provider="stripe"
        )


def verify_timestamp(timestamp: int, max_age: int = MAX_TIMESTAMP_AGE) -> bool:
    """
    Verify webhook timestamp is recent to prevent replay attacks.

    Args:
        timestamp: Unix timestamp from webhook
        max_age: Maximum acceptable age in seconds

    Returns:
        True if timestamp is valid, False otherwise
    """
    current_time = int(time.time())
    age = current_time - timestamp

    if age > max_age:
        logger.warning(
            f"⚠️ Webhook timestamp too old: {age}s (max {max_age}s)"
        )
        return False

    if age < -60:  # Allow 1 minute clock skew
        logger.warning(f"⚠️ Webhook timestamp in future: {age}s")
        return False

    return True


async def gumroad_webhook_auth_middleware(
    request: Request,
    call_next
):
    """
    FastAPI middleware for Gumroad webhook signature verification.

    Applies only to /webhooks/gumroad/* routes.

    Usage:
        app.middleware("http")(gumroad_webhook_auth_middleware)
    """
    # Only apply to Gumroad webhook routes
    if not request.url.path.startswith("/webhooks/gumroad"):
        return await call_next(request)

    logger.info(f"🔍 Verifying Gumroad webhook: {request.method} {request.url.path}")

    # Get signature header
    signature = request.headers.get("X-Gumroad-Signature")

    # Read body
    body = await request.body()

    # Verify signature
    secret = os.getenv("GUMROAD_WEBHOOK_SECRET")

    try:
        verify_gumroad_signature(body, signature, secret)
    except WebhookAuthError as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "provider": "gumroad"}
        )

    # Store verified body for route handler
    request.state.verified_body = body

    return await call_next(request)


async def stripe_webhook_auth_middleware(
    request: Request,
    call_next
):
    """
    FastAPI middleware for Stripe webhook signature verification.

    Applies only to /webhooks/stripe/* routes.

    Usage:
        app.middleware("http")(stripe_webhook_auth_middleware)
    """
    # Only apply to Stripe webhook routes
    if not request.url.path.startswith("/webhooks/stripe"):
        return await call_next(request)

    logger.info(f"🔍 Verifying Stripe webhook: {request.method} {request.url.path}")

    # Get signature header
    signature = request.headers.get("Stripe-Signature")

    # Read body
    body = await request.body()

    # Verify signature
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = verify_stripe_signature(body, signature, secret)
        # Store verified event for route handler
        request.state.verified_event = event
    except WebhookAuthError as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "provider": "stripe"}
        )

    return await call_next(request)


# Dependency function for route-level verification
async def verify_gumroad_webhook(request: Request) -> bytes:
    """
    FastAPI dependency for verifying Gumroad webhooks.

    Usage:
        @router.post("/", dependencies=[Depends(verify_gumroad_webhook)])
        async def handle_webhook(request: Request):
            ...

    Returns:
        Verified webhook body as bytes
    """
    signature = request.headers.get("X-Gumroad-Signature")
    body = await request.body()
    secret = os.getenv("GUMROAD_WEBHOOK_SECRET")

    logger.info("🔍 Verifying Gumroad webhook signature")

    try:
        verify_gumroad_signature(body, signature, secret)
        return body
    except WebhookAuthError:
        raise


async def verify_stripe_webhook(request: Request) -> dict:
    """
    FastAPI dependency for verifying Stripe webhooks.

    Usage:
        @router.post("/")
        async def handle_webhook(event: dict = Depends(verify_stripe_webhook)):
            ...

    Returns:
        Verified Stripe event dict
    """
    signature = request.headers.get("Stripe-Signature")
    body = await request.body()
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    logger.info("🔍 Verifying Stripe webhook signature")

    try:
        event = verify_stripe_signature(body, signature, secret)
        return event
    except WebhookAuthError:
        raise


# Logging helper for audit trail
def log_webhook_verification(
    provider: str,
    success: bool,
    request_id: Optional[str] = None,
    error: Optional[str] = None
):
    """
    Log webhook verification attempts for security audit.

    Args:
        provider: Payment provider name (gumroad, stripe, etc.)
        success: Whether verification succeeded
        request_id: Optional request ID for tracking
        error: Optional error message
    """
    log_data = {
        "provider": provider,
        "success": success,
        "timestamp": time.time(),
        "request_id": request_id,
    }

    if error:
        log_data["error"] = error

    if success:
        logger.info(f"✅ Webhook verified [{provider}]: {log_data}")
    else:
        logger.warning(f"⚠️ Webhook verification failed [{provider}]: {log_data}")
