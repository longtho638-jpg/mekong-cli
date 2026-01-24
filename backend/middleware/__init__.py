"""
Backend Middleware Package
===========================
Security and request processing middleware.
"""

from backend.middleware.webhook_auth import (
    WebhookAuthError,
    gumroad_webhook_auth_middleware,
    log_webhook_verification,
    stripe_webhook_auth_middleware,
    verify_gumroad_signature,
    verify_gumroad_webhook,
    verify_stripe_signature,
    verify_stripe_webhook,
    verify_timestamp,
)

__all__ = [
    # Exceptions
    "WebhookAuthError",
    # Middleware functions
    "gumroad_webhook_auth_middleware",
    "stripe_webhook_auth_middleware",
    # Verification functions
    "verify_gumroad_signature",
    "verify_stripe_signature",
    "verify_timestamp",
    # Dependencies
    "verify_gumroad_webhook",
    "verify_stripe_webhook",
    # Logging
    "log_webhook_verification",
]
