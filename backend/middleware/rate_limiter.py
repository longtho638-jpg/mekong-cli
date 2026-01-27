import time
import yaml
import logging
from typing import Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.services.rate_limiter_service import RateLimiterService
from backend.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    Applies per-user, per-IP, and per-endpoint limits.
    Supports Sliding Window, Token Bucket, and Fixed Window algorithms.
    Configurable via config/rate-limit-config.yaml.
    """
    def __init__(self, app, config_path: str = 'config/rate-limit-config.yaml'):
        super().__init__(app)
        self.rate_limiter = RateLimiterService()
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self):
        try:
            with open(self.config_path) as f:
                return yaml.safe_load(f).get('rate_limits', {})
        except Exception as e:
            logger.warning(f"Failed to load rate limit config from {self.config_path}: {e}. Using defaults.")
            return {}

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and metrics
        if request.url.path in ['/health', '/metrics', '/', '/docs', '/openapi.json', '/redoc']:
            return await call_next(request)

        # Skip OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Get user ID (if authenticated) or IP
        # We assume auth middleware has run before this if user is authenticated
        user_id = getattr(request.state, 'user_id', None)
        client_ip = request.client.host if request.client else "unknown"

        # Determine endpoint config
        endpoint_path = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint_path)

        if not endpoint_config.get('enabled', True):
            # Rate limiting disabled for this endpoint
            return await call_next(request)

        # Config values
        default_config = self.config.get('default', {})

        algorithm = endpoint_config.get('algorithm', default_config.get('algorithm', 'sliding_window'))
        window = endpoint_config.get('window_seconds', default_config.get('window_seconds', 3600))

        # Check rate limits (per-user takes precedence over per-IP if configured)
        if user_id:
            key = f"user:{user_id}:{endpoint_path}"
            limit = endpoint_config.get('per_user_limit', default_config.get('per_user_limit', 1000))
        else:
            key = f"ip:{client_ip}:{endpoint_path}"
            limit = endpoint_config.get('per_ip_limit', default_config.get('per_ip_limit', 100))

        # Handle token bucket refill rate
        refill_rate = endpoint_config.get('refill_rate', default_config.get('refill_rate', limit / window if window > 0 else 1))

        allowed = True
        remaining = 0

        try:
            if algorithm == 'token_bucket':
                allowed, remaining = await self.rate_limiter.check_token_bucket(
                    key,
                    capacity=limit,
                    refill_rate=refill_rate,
                )
            elif algorithm == 'fixed_window':
                allowed, remaining = await self.rate_limiter.check_fixed_window(
                    key, limit, window
                )
            else:  # sliding_window (default)
                allowed, remaining = await self.rate_limiter.check_sliding_window(
                    key, limit, window
                )
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open if rate limiter fails
            return await call_next(request)

        if not allowed:
            # Rate limit exceeded - return 429 Too Many Requests
            reset_time = await self.rate_limiter.get_reset_time(key, algorithm, window, refill_rate)
            retry_after = max(1, reset_time - int(time.time()))

            return Response(
                content='{"error": "Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type='application/json',
                headers={
                    'X-RateLimit-Limit': str(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': str(reset_time),
                    'Retry-After': str(retry_after),
                },
            )

        # Request allowed - add rate limit headers
        response = await call_next(request)

        # Calculate reset time for headers
        try:
            reset_time = await self.rate_limiter.get_reset_time(key, algorithm, window, refill_rate)
            response.headers['X-RateLimit-Limit'] = str(limit)
            response.headers['X-RateLimit-Remaining'] = str(remaining)
            response.headers['X-RateLimit-Reset'] = str(reset_time)
        except Exception as e:
            logger.error(f"Error setting rate limit headers: {e}")

        return response

    def _get_endpoint_config(self, path: str) -> dict:
        """
        Get rate limit config for endpoint.
        Matches longest prefix (e.g., /api/auth/login > /api/auth > /api).
        """
        endpoints = self.config.get('endpoints', {})

        # Try exact match first
        if path in endpoints:
            return endpoints[path]

        # Try prefix match (longest first)
        for endpoint_path in sorted(endpoints.keys(), key=len, reverse=True):
            if path.startswith(endpoint_path):
                return endpoints[endpoint_path]

        # Return default config merged with global defaults
        return self.config.get('default', {})
