"""
Security and CORS headers management.
"""
import os
from typing import Any, Dict

from fastapi import Request


def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

def get_cors_config() -> Dict[str, Any]:
    """Get CORS configuration from environment."""
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
    allowed_methods = os.getenv("ALLOWED_METHODS", "GET,POST,PUT,DELETE,OPTIONS")
    allowed_headers = os.getenv("ALLOWED_HEADERS", "Authorization,Content-Type,X-API-Key")

    return {
        "allow_origins": [origin.strip() for origin in allowed_origins.split(",")],
        "allow_credentials": True,
        "allow_methods": [method.strip() for method in allowed_methods.split(",")],
        "allow_headers": [header.strip() for header in allowed_headers.split(",")],
        "expose_headers": ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    }
