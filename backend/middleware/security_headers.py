"""
🛡️ Security Headers Middleware
==============================
Implements OWASP Security Headers recommendations to harden the application against common attacks.
"""

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to every response.
    """

    def __init__(self, app, content_security_policy: str = None):
        super().__init__(app)
        # Default CSP if not provided - strictly limit sources
        self.csp = (
            content_security_policy
            or (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # unsafe-eval often needed for some JS frameworks, unsafe-inline for quick hacks. Harden for prod.
                "style-src 'self' 'unsafe-inline' https:; "
                "font-src 'self' data: https:; "
                "object-src 'none'; "
                "frame-ancestors 'none'; "  # Prevent clickjacking
                "base-uri 'self'; "
                "form-action 'self';"
            )
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # 1. Content-Security-Policy (CSP)
        # Prevents XSS by controlling where resources can be loaded from.
        response.headers["Content-Security-Policy"] = self.csp

        # 2. Strict-Transport-Security (HSTS)
        # Enforces HTTPS connections. Max-age is set to 1 year (31536000 seconds).
        # includeSubDomains ensures subdomains are also protected.
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # 3. X-Content-Type-Options
        # Prevents MIME-sniffing attacks.
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 4. X-Frame-Options
        # Prevents Clickjacking attacks by ensuring content is not embedded in frames.
        # 'DENY' blocks all framing. 'SAMEORIGIN' allows framing by the same site.
        response.headers["X-Frame-Options"] = "DENY"

        # 5. Referrer-Policy
        # Controls how much referrer information is sent with requests.
        # 'strict-origin-when-cross-origin' sends full URL for same-origin,
        # origin-only for cross-origin HTTPS, and no referrer for cross-origin HTTP.
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Permissions-Policy (formerly Feature-Policy)
        # Controls which browser features can be used.
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=()"
        )

        # 7. X-XSS-Protection
        # Legacy header, but good for older browsers. 1; mode=block enabled XSS filtering.
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response
