"""
Constants for API Configuration
================================

Shared constants used across the API layer.
"""

# Default rate limiting patterns
DEFAULT_UNAUTHENTICATED_LIMITS = {
    "default": "60/minute",
    "health": "100/minute",
    "docs": "30/minute",
    "webhooks": "20/minute",
}

# Default cache TTL values (seconds)
CACHE_TTL_FAST = 5
CACHE_TTL_MEDIUM = 10
CACHE_TTL_SLOW = 30

# Default request limits
DEFAULT_MAX_JSON_DEPTH = 10
DEFAULT_MAX_REQUEST_SIZE = 10_000_000  # 10MB
DEFAULT_MAX_STRING_LENGTH = 10_000

# Prometheus metrics buckets (seconds)
DEFAULT_METRICS_BUCKETS = [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]

# Performance thresholds
SLOW_REQUEST_THRESHOLD = 0.1  # 100ms
FAST_RESPONSE_THRESHOLD = 0.05  # 50ms

# Default URLs
DEFAULT_BACKEND_URL = "http://localhost:8000"
DEFAULT_FRONTEND_URL = "http://localhost:3000"
DEFAULT_WEBHOOK_PORTAL_URL = "https://platform.billmentor.com"

# Default CORS origins for development
DEFAULT_DEV_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8080",
]
