"""
Backend Middleware Package
===========================
Security and request processing middleware.
"""

from backend.middleware.performance import (
    PerformanceMonitoringMiddleware,
    get_metrics_summary,
    reset_metrics,
)
from backend.middleware.rate_limiter import RateLimitMiddleware
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
    # Middleware classes
    "RateLimitMiddleware",
    "PerformanceMonitoringMiddleware",
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
    # Performance monitoring
    "get_metrics_summary",
    "reset_metrics",
]
