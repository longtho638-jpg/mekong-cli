"""
Cache Control Middleware for FastAPI
Injects appropriate Cache-Control headers based on route patterns.
"""

import re
from typing import Dict, List, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp


class CacheControlMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        cache_rules: List[Dict[str, str]] = None
    ):
        """
        Initialize middleware.

        Args:
            app: The ASGI application
            cache_rules: List of rules. Each rule is a dict with:
                - path_regex: Regex pattern for the path
                - cache_control: Value for Cache-Control header
        """
        super().__init__(app)
        self.cache_rules = cache_rules or self._default_rules()
        self._compiled_rules = [
            (re.compile(rule["path_regex"]), rule["cache_control"])
            for rule in self.cache_rules
        ]

    def _default_rules(self) -> List[Dict[str, str]]:
        return [
            # Static assets served by backend (if any)
            {
                "path_regex": r"^/static/.*",
                "cache_control": "public, max-age=31536000, immutable"
            },
            # Public API endpoints (read-only)
            {
                "path_regex": r"^/api/v1/public/.*",
                "cache_control": "public, max-age=3600, stale-while-revalidate=600"
            },
            # Docs
            {
                "path_regex": r"^/docs.*|^/redoc.*|^/openapi.json",
                "cache_control": "public, max-age=3600"
            },
            # Default for other API endpoints - prevent caching by default for safety
            {
                "path_regex": r"^/api/.*",
                "cache_control": "no-store, no-cache, must-revalidate, proxy-revalidate"
            }
        ]

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Skip if header is already set (e.g. by endpoint decorator)
        if "cache-control" in response.headers:
            return response

        path = request.url.path

        # Apply matching rule
        for pattern, cache_control in self._compiled_rules:
            if pattern.match(path):
                response.headers["Cache-Control"] = cache_control

                # Add vary header for API responses
                if "api" in path:
                    response.headers["Vary"] = "Accept-Encoding, Origin"

                # Add CDN tag header if using Cloudflare (optional, for purging)
                # response.headers["Cache-Tag"] = "api"

                break

        return response
