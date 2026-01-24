"""
Rate Limiting Middleware for Mekong-CLI API
Tier-based rate limiting with token bucket algorithm
"""

import time
from collections import defaultdict
from typing import Dict, Optional, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Tier-based rate limits (requests per minute)
TIER_LIMITS = {
    "free": 10,
    "starter": 30,
    "pro": 100,
    "franchise": 200,
    "enterprise": -1,  # unlimited
}


class TokenBucket:
    """Token bucket for rate limiting with refill mechanism"""

    def __init__(self, capacity: int, refill_rate: float):
        """
        Initialize token bucket

        Args:
            capacity: Maximum tokens (requests per minute)
            refill_rate: Tokens added per second (capacity / 60)
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = time.time()

    def refill(self) -> None:
        """Refill tokens based on time elapsed"""
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(
            self.capacity,
            self.tokens + (elapsed * self.refill_rate)
        )
        self.last_refill = now

    def consume(self, tokens: int = 1) -> bool:
        """
        Attempt to consume tokens

        Returns:
            True if tokens were consumed, False if insufficient tokens
        """
        self.refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def get_remaining(self) -> int:
        """Get remaining tokens"""
        self.refill()
        return int(self.tokens)

    def get_reset_time(self) -> int:
        """Get seconds until bucket is full"""
        self.refill()
        if self.tokens >= self.capacity:
            return 0
        tokens_needed = self.capacity - self.tokens
        return int(tokens_needed / self.refill_rate)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for tier-based rate limiting

    Tracks requests by:
    - API key (from X-API-Key header)
    - IP address (fallback if no API key)

    Rate limits based on subscription tier.
    """

    def __init__(self, app):
        super().__init__(app)
        # Store buckets: {identifier: (tier, TokenBucket)}
        self.buckets: Dict[str, Tuple[str, TokenBucket]] = {}
        # Default tier for unauthenticated requests
        self.default_tier = "free"

    def _get_identifier(self, request: Request) -> str:
        """
        Get rate limit identifier from request
        Priority: API key > IP address
        """
        # Check for API key in headers
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{api_key}"

        # Fallback to IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"

    def _get_tier(self, request: Request, identifier: str) -> str:
        """
        Determine subscription tier for the request

        TODO: Integrate with actual subscription/auth service
        For now, extract from X-Subscription-Tier header or use default
        """
        # Check custom header (for testing/demo)
        tier = request.headers.get("X-Subscription-Tier")
        if tier and tier.lower() in TIER_LIMITS:
            return tier.lower()

        # TODO: Query database/auth service based on API key
        # For API key-based requests, look up tier from subscriptions table
        if identifier.startswith("key:"):
            # This is where you'd integrate with ProvisioningService
            # api_key = identifier[4:]
            # tier = get_tier_from_api_key(api_key)
            pass

        return self.default_tier

    def _get_bucket(self, identifier: str, tier: str) -> TokenBucket:
        """
        Get or create token bucket for identifier
        """
        # Check if bucket exists and tier hasn't changed
        if identifier in self.buckets:
            stored_tier, bucket = self.buckets[identifier]
            if stored_tier == tier:
                return bucket

        # Create new bucket
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

        # Enterprise has unlimited requests
        if limit == -1:
            limit = 999999

        bucket = TokenBucket(
            capacity=limit,
            refill_rate=limit / 60.0  # Requests per second
        )
        self.buckets[identifier] = (tier, bucket)
        return bucket

    def _add_rate_limit_headers(
        self,
        response: Response,
        bucket: TokenBucket,
        tier: str
    ) -> None:
        """Add rate limit headers to response"""
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

        # Enterprise tier shows as unlimited
        if limit == -1:
            limit_str = "unlimited"
            remaining_str = "unlimited"
            reset_str = "0"
        else:
            limit_str = str(limit)
            remaining_str = str(bucket.get_remaining())
            reset_str = str(bucket.get_reset_time())

        response.headers["X-RateLimit-Limit"] = limit_str
        response.headers["X-RateLimit-Remaining"] = remaining_str
        response.headers["X-RateLimit-Reset"] = reset_str
        response.headers["X-RateLimit-Tier"] = tier

    async def dispatch(self, request: Request, call_next):
        """Process request and apply rate limiting"""

        # Skip rate limiting for health check endpoints
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Get identifier and tier
        identifier = self._get_identifier(request)
        tier = self._get_tier(request, identifier)
        bucket = self._get_bucket(identifier, tier)

        # Check rate limit
        if not bucket.consume():
            # Rate limit exceeded - return 429
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {TIER_LIMITS[tier]} requests/minute for {tier} tier",
                    "tier": tier,
                    "retry_after": bucket.get_reset_time()
                }
            )
            self._add_rate_limit_headers(response, bucket, tier)
            response.headers["Retry-After"] = str(bucket.get_reset_time())
            return response

        # Process request
        response = await call_next(request)

        # Add rate limit headers to successful response
        self._add_rate_limit_headers(response, bucket, tier)

        return response


# Convenience function for manual rate limit checking in routes
def check_rate_limit(
    identifier: str,
    tier: str = "free",
    middleware: Optional[RateLimitMiddleware] = None
) -> Tuple[bool, int]:
    """
    Manually check rate limit for an identifier

    Args:
        identifier: Unique identifier (API key or IP)
        tier: Subscription tier
        middleware: RateLimitMiddleware instance (creates new if None)

    Returns:
        Tuple of (allowed: bool, retry_after: int)
    """
    if middleware is None:
        # Create temporary middleware for checking
        from fastapi import FastAPI
        temp_app = FastAPI()
        middleware = RateLimitMiddleware(temp_app)

    bucket = middleware._get_bucket(identifier, tier)
    allowed = bucket.consume()
    retry_after = 0 if allowed else bucket.get_reset_time()

    return allowed, retry_after
