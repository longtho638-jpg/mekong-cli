"""
Cache Control Middleware for FastAPI
Injects appropriate Cache-Control headers based on route patterns.
Also implements Server-Side Response Caching for GET requests.
"""

import logging
import re
from typing import Dict, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, StreamingResponse
from starlette.types import ASGIApp

from backend.services.cache import cache_factory

logger = logging.getLogger(__name__)


class CacheControlMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        cache_rules: List[Dict[str, str]] = None,
        enable_server_cache: bool = True,
    ):
        """
        Initialize middleware.

        Args:
            app: The ASGI application
            cache_rules: List of rules.
            enable_server_cache: Whether to store responses in Redis.
        """
        super().__init__(app)
        self.cache_rules = cache_rules or self._default_rules()
        self.enable_server_cache = enable_server_cache
        self._compiled_rules = [
            (re.compile(rule["path_regex"]), rule["cache_control"], rule.get("server_ttl"))
            for rule in self.cache_rules
        ]

        # We need to initialize cache lazily in dispatch because event loop might not be ready in init
        self.response_cache = None

    def _default_rules(self) -> List[Dict[str, str]]:
        return [
            # Static assets
            {
                "path_regex": r"^/static/.*",
                "cache_control": "public, max-age=31536000, immutable",
                "server_ttl": None,  # Don't server cache static files, CDN does that
            },
            # Public API endpoints (read-only)
            {
                "path_regex": r"^/api/v1/public/.*",
                "cache_control": "public, max-age=300, stale-while-revalidate=60",
                "server_ttl": 300,
            },
            # Docs
            {
                "path_regex": r"^/docs.*|^/redoc.*|^/openapi.json",
                "cache_control": "public, max-age=3600",
                "server_ttl": 3600,
            },
            # Default for other API endpoints
            {
                "path_regex": r"^/api/.*",
                "cache_control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "server_ttl": None,
            },
        ]

    async def dispatch(self, request: Request, call_next):
        # 1. Check if we should serve from cache (GET only)
        if self.enable_server_cache and request.method == "GET":
            if not self.response_cache:
                try:
                    self.response_cache = await cache_factory.get_response_cache()
                except Exception:
                    # Redis might be down, proceed without cache
                    pass

            if self.response_cache:
                # Check match for server cache
                server_ttl = None
                path = request.url.path

                # Identify if this path supports server caching
                for pattern, _, ttl in self._compiled_rules:
                    if ttl and pattern.match(path):
                        server_ttl = ttl
                        break

                if server_ttl:
                    # Generate key
                    # TODO: extract user_id from token if needed for private cache
                    # For now, we only cache public endpoints based on the rules above
                    cache_key = self.response_cache._make_key(request)

                    cached_data = await self.response_cache.get_response(cache_key)
                    if cached_data:
                        # Return cached response
                        response = JSONResponse(
                            content=cached_data["content"], status_code=cached_data["status_code"]
                        )
                        # Re-apply headers will happen below
                        # But we need to make sure we don't double-apply
                        pass
                        # For now, let's just return it.
                        # Headers will be missing if we don't add them.
                        response.headers["X-Cache"] = "HIT"
                        # Apply rules below
                    else:
                        # Cache Miss
                        response = await call_next(request)
                        response.headers["X-Cache"] = "MISS"

                        # Only cache if successful and not streaming
                        if 200 <= response.status_code < 300 and not isinstance(
                            response, StreamingResponse
                        ):
                            # We need to read the body to cache it
                            content = b""
                            if hasattr(response, "body"):
                                content = response.body
                            elif hasattr(response, "body_iterator"):
                                response_body = [
                                    section async for section in response.body_iterator
                                ]
                                content = b"".join(response_body)

                                async def async_iterator_wrapper(content_bytes):
                                    yield content_bytes

                                response.body_iterator = async_iterator_wrapper(content)

                            if content:
                                try:
                                    # Only cache JSON for now
                                    import json

                                    json_content = json.loads(content.decode())

                                    # Background task to set cache?
                                    # For strict middleware, we await
                                    await self.response_cache.cache_response(
                                        cache_key, json_content, response.status_code, server_ttl
                                    )
                                except Exception as e:
                                    logger.warning(f"Failed to cache response: {e}")
                                    pass
                else:
                    response = await call_next(request)
            else:
                response = await call_next(request)
        else:
            response = await call_next(request)

        # 2. Apply Cache-Control headers
        path = request.url.path
        if "cache-control" not in response.headers:
            for pattern, cache_control, _ in self._compiled_rules:
                if pattern.match(path):
                    response.headers["Cache-Control"] = cache_control
                    if "api" in path:
                        response.headers["Vary"] = "Accept-Encoding, Origin"
                    break

        return response
