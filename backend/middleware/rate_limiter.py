"""
Production Rate Limiting Middleware for Mekong-CLI API
Redis-based distributed rate limiting with graceful degradation
IPO-004: Production-grade rate limiting implementation
"""

import asyncio
import logging
import time
from typing import Dict, Optional, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.api.config import settings

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None  # type: ignore

logger = logging.getLogger(__name__)

# Tier-based rate limits (requests per minute)
TIER_LIMITS = {
    "free": 10,
    "starter": 30,
    "pro": 100,
    "franchise": 200,
    "enterprise": -1,  # unlimited
}


class TokenBucket:
    """Token bucket for in-memory rate limiting with refill mechanism"""

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


class RedisRateLimiter:
    """
    Redis-based distributed rate limiter using sliding window algorithm

    Features:
    - Distributed across multiple instances
    - Atomic operations with Lua scripting
    - Per-user quota tracking
    - Graceful fallback to in-memory
    """

    # Lua script for atomic rate limiting with sliding window
    RATE_LIMIT_SCRIPT = """
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    -- Remove old entries outside the window
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

    -- Count current requests in window
    local current = redis.call('ZCARD', key)

    if current < limit then
        -- Add new request
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, window)
        return {1, limit - current - 1, 0}
    else
        -- Get oldest request timestamp
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_time = math.ceil(oldest[2] + window - now)
        return {0, 0, reset_time}
    end
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        """
        Initialize Redis rate limiter

        Args:
            redis_url: Redis connection URL
        """
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None
        self._script_sha: Optional[str] = None
        self._connection_healthy = False

    async def connect(self) -> bool:
        """
        Connect to Redis with health check

        Returns:
            True if connection successful, False otherwise
        """
        if not REDIS_AVAILABLE:
            logger.warning("Redis library not available. Using in-memory fallback.")
            return False

        try:
            self.redis = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # Health check
            await self.redis.ping()

            # Register Lua script
            self._script_sha = await self.redis.script_load(self.RATE_LIMIT_SCRIPT)

            self._connection_healthy = True
            logger.info("Redis rate limiter connected successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connection_healthy = False
            return False

    async def check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int = 60
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit for identifier using sliding window

        Args:
            identifier: Unique identifier (user/API key)
            limit: Maximum requests allowed in window
            window: Time window in seconds (default 60)

        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        if not self._connection_healthy or self.redis is None:
            # Fallback handled by caller
            raise ConnectionError("Redis not available")

        try:
            key = f"ratelimit:{identifier}"
            now = int(time.time())

            # Execute Lua script
            result = await self.redis.evalsha(
                self._script_sha,
                1,  # number of keys
                key,
                limit,
                window,
                now
            )

            allowed = bool(result[0])
            remaining = int(result[1])
            reset_time = int(result[2])

            return allowed, remaining, reset_time

        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            self._connection_healthy = False
            raise ConnectionError(f"Redis operation failed: {e}")

    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis rate limiter connection closed")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Production-grade rate limiting middleware with graceful degradation

    Features:
    - Redis-based distributed limiting (primary)
    - In-memory fallback (degraded mode)
    - Per-user quota tracking
    - Automatic failover and recovery
    """

    def __init__(self, app, redis_url: str = "redis://localhost:6379"):
        super().__init__(app)

        # Redis limiter (primary)
        self.redis_limiter = RedisRateLimiter(redis_url)

        # In-memory buckets (fallback)
        self.buckets: Dict[str, Tuple[str, TokenBucket]] = {}
        self.default_tier = "free"

        # Track degradation state
        self._degraded_mode = False
        self._last_redis_check = 0
        self._redis_check_interval = 30  # seconds

    async def startup(self):
        """Initialize Redis connection on startup"""
        success = await self.redis_limiter.connect()
        if not success:
            logger.warning("Starting in degraded mode (in-memory rate limiting)")
            self._degraded_mode = True

    async def shutdown(self):
        """Cleanup on shutdown"""
        await self.redis_limiter.close()

    def _get_identifier(self, request: Request) -> str:
        """
        Get rate limit identifier from request
        Priority: User ID > API key > IP address
        """
        # Priority 1: User ID from auth context
        if hasattr(request.state, 'user_id'):
            return f"user:{request.state.user_id}"

        # Priority 2: API key in headers
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{api_key}"

        # Priority 3: IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"

    def _get_tier(self, request: Request, identifier: str) -> str:
        """
        Determine subscription tier for the request

        Integration points:
        - Auth service for user tier lookup
        - Subscription service for API key tier
        """
        # Check custom header (for testing/demo)
        tier = request.headers.get("X-Subscription-Tier")
        if tier and tier.lower() in TIER_LIMITS:
            return tier.lower()

        # Future: Query database/auth service based on identifier
        # if identifier.startswith("user:"):
        #     return await subscription_service.get_user_tier(user_id)
        # if identifier.startswith("key:"):
        #     return await subscription_service.get_key_tier(api_key)

        return self.default_tier

    async def _check_redis_rate_limit(
        self,
        identifier: str,
        tier: str
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit using Redis

        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

        # Enterprise has unlimited requests
        if limit == -1:
            return True, 999999, 0

        try:
            return await self.redis_limiter.check_rate_limit(
                identifier,
                limit,
                window=60
            )
        except ConnectionError:
            # Trigger fallback
            raise

    def _check_memory_rate_limit(
        self,
        identifier: str,
        tier: str
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit using in-memory buckets (fallback)

        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        # Get or create bucket
        if identifier in self.buckets:
            stored_tier, bucket = self.buckets[identifier]
            if stored_tier != tier:
                # Tier changed, create new bucket
                bucket = self._create_bucket(tier)
                self.buckets[identifier] = (tier, bucket)
        else:
            bucket = self._create_bucket(tier)
            self.buckets[identifier] = (tier, bucket)

        # Check limit
        allowed = bucket.consume()
        remaining = bucket.get_remaining()
        reset_time = bucket.get_reset_time()

        return allowed, remaining, reset_time

    def _create_bucket(self, tier: str) -> TokenBucket:
        """Create token bucket for tier"""
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

        # Enterprise has unlimited requests
        if limit == -1:
            limit = 999999

        return TokenBucket(
            capacity=limit,
            refill_rate=limit / 60.0
        )

    async def _attempt_redis_recovery(self) -> bool:
        """
        Attempt to reconnect to Redis periodically

        Returns:
            True if recovery successful
        """
        now = time.time()
        if now - self._last_redis_check < self._redis_check_interval:
            return False

        self._last_redis_check = now
        logger.info("Attempting Redis reconnection...")

        success = await self.redis_limiter.connect()
        if success:
            logger.info("Redis connection recovered!")
            self._degraded_mode = False
            return True

        return False

    def _add_rate_limit_headers(
        self,
        response: Response,
        tier: str,
        remaining: int,
        reset_time: int
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
            remaining_str = str(remaining)
            reset_str = str(reset_time)

        response.headers["X-RateLimit-Limit"] = limit_str
        response.headers["X-RateLimit-Remaining"] = remaining_str
        response.headers["X-RateLimit-Reset"] = reset_str
        response.headers["X-RateLimit-Tier"] = tier

        # Indicate if running in degraded mode
        if self._degraded_mode:
            response.headers["X-RateLimit-Mode"] = "degraded"

    async def dispatch(self, request: Request, call_next):
        """Process request and apply rate limiting"""

        # Skip rate limiting for health check endpoints
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Check for Admin Bypass Key
        if settings.rate_limit_bypass_key:
            bypass_key = request.headers.get("X-RateLimit-Bypass-Key")
            if bypass_key == settings.rate_limit_bypass_key:
                return await call_next(request)

        # Check for IP Whitelist
        client_ip = request.client.host if request.client else "unknown"
        if client_ip in settings.rate_limit_whitelist_ips:
            return await call_next(request)

        # Get identifier and tier
        identifier = self._get_identifier(request)
        tier = self._get_tier(request, identifier)

        # Try Redis first, fallback to memory on failure
        try:
            if self._degraded_mode:
                # In degraded mode, try recovery periodically
                await self._attempt_redis_recovery()

            if not self._degraded_mode:
                # Primary: Use Redis
                allowed, remaining, reset_time = await self._check_redis_rate_limit(
                    identifier,
                    tier
                )
            else:
                raise ConnectionError("In degraded mode")

        except ConnectionError:
            # Fallback: Use in-memory
            if not self._degraded_mode:
                logger.warning(
                    f"Redis unavailable, switching to degraded mode (in-memory)"
                )
                self._degraded_mode = True

            allowed, remaining, reset_time = self._check_memory_rate_limit(
                identifier,
                tier
            )


        # Check rate limit
        if not allowed:
            logger.info(f"Rate limit exceeded for {identifier} ({tier}). Remaining: {remaining}, Reset: {reset_time}, Mode: {'degraded' if self._degraded_mode else 'normal'}")
            # Rate limit exceeded - return 429
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {TIER_LIMITS[tier]} requests/minute for {tier} tier",
                    "tier": tier,
                    "retry_after": reset_time,
                    "mode": "degraded" if self._degraded_mode else "normal"
                }
            )
            self._add_rate_limit_headers(response, tier, remaining, reset_time)
            response.headers["Retry-After"] = str(reset_time)
            return response

        # Process request
        response = await call_next(request)

        # Add rate limit headers to successful response
        self._add_rate_limit_headers(response, tier, remaining, reset_time)

        return response


# Convenience function for manual rate limit checking in routes
async def check_rate_limit(
    identifier: str,
    tier: str = "free",
    redis_url: str = "redis://localhost:6379"
) -> Tuple[bool, int]:
    """
    Manually check rate limit for an identifier

    Args:
        identifier: Unique identifier (API key, user ID, or IP)
        tier: Subscription tier
        redis_url: Redis connection URL

    Returns:
        Tuple of (allowed: bool, retry_after: int)
    """
    limiter = RedisRateLimiter(redis_url)

    try:
        await limiter.connect()
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

        if limit == -1:
            return True, 0

        allowed, _, reset_time = await limiter.check_rate_limit(
            identifier,
            limit
        )
        return allowed, reset_time if not allowed else 0

    except Exception:
        # Fallback to in-memory
        from fastapi import FastAPI
        app = FastAPI()
        middleware = RateLimitMiddleware(app, redis_url)
        allowed, _, reset_time = middleware._check_memory_rate_limit(identifier, tier)
        return allowed, reset_time if not allowed else 0

    finally:
        await limiter.close()
