"""
Rate Limiting Configuration
============================

Rate limits organized by plan tier.
"""

# Rate limits by tenant plan (per minute)
RATE_LIMITS_BY_PLAN = {
    "free": {
        "default": "100/minute",
        "api": "50/minute",
        "webhooks": "10/minute",
        "code": "20/minute",
    },
    "pro": {
        "default": "500/minute",
        "api": "200/minute",
        "webhooks": "50/minute",
        "code": "100/minute",
    },
    "enterprise": {
        "default": "1000/minute",
        "api": "500/minute",
        "webhooks": "100/minute",
        "code": "200/minute",
    },
}
