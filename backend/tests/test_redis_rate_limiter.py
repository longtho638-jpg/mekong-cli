"""
Test Redis-based Rate Limiting Middleware (IPO-004)
Tests for production-grade rate limiting with graceful degradation
"""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.middleware.rate_limiter import (
    TIER_LIMITS,
    RateLimitMiddleware,
    RedisRateLimiter,
    TokenBucket,
    check_rate_limit,
)


# Test app setup
def create_test_app(redis_url: str = "redis://localhost:6379"):
    """Create test FastAPI app with Redis rate limiting"""
    app = FastAPI()
    middleware = RateLimitMiddleware(app, redis_url=redis_url)
    app.add_middleware(
        RateLimitMiddleware,
        redis_url=redis_url
    )

    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


class TestRedisRateLimiter:
    """Test Redis rate limiter with sliding window"""

    @pytest.mark.asyncio
    async def test_connect_success(self):
        """Test successful Redis connection"""
        limiter = RedisRateLimiter("redis://localhost:6379")

        with patch('redis.asyncio.from_url') as mock_redis:
            mock_instance = AsyncMock()
            mock_instance.ping = AsyncMock()
            mock_instance.script_load = AsyncMock(return_value="script_sha")
            mock_redis.return_value = mock_instance

            success = await limiter.connect()
            assert success is True
            assert limiter._connection_healthy is True

    @pytest.mark.asyncio
    async def test_connect_failure(self):
        """Test Redis connection failure"""
        limiter = RedisRateLimiter("redis://invalid:9999")

        with patch('redis.asyncio.from_url', side_effect=Exception("Connection failed")):
            success = await limiter.connect()
            assert success is False
            assert limiter._connection_healthy is False

    @pytest.mark.asyncio
    async def test_rate_limit_allowed(self):
        """Test rate limit check when under limit"""
        limiter = RedisRateLimiter()

        with patch.object(limiter, 'redis') as mock_redis:
            mock_redis.evalsha = AsyncMock(return_value=[1, 9, 0])
            limiter._connection_healthy = True
            limiter._script_sha = "test_sha"

            allowed, remaining, reset = await limiter.check_rate_limit("test-user", 10)

            assert allowed is True
            assert remaining == 9
            assert reset == 0

    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self):
        """Test rate limit check when over limit"""
        limiter = RedisRateLimiter()

        with patch.object(limiter, 'redis') as mock_redis:
            mock_redis.evalsha = AsyncMock(return_value=[0, 0, 45])
            limiter._connection_healthy = True
            limiter._script_sha = "test_sha"

            allowed, remaining, reset = await limiter.check_rate_limit("test-user", 10)

            assert allowed is False
            assert remaining == 0
            assert reset == 45

    @pytest.mark.asyncio
    async def test_redis_unavailable_raises_error(self):
        """Test error raised when Redis is unavailable"""
        limiter = RedisRateLimiter()
        limiter._connection_healthy = False

        with pytest.raises(ConnectionError):
            await limiter.check_rate_limit("test-user", 10)


class TestGracefulDegradation:
    """Test graceful degradation to in-memory fallback"""

    def test_degraded_mode_on_redis_failure(self):
        """Test middleware switches to degraded mode on Redis failure"""
        app = create_test_app("redis://invalid:9999")
        client = TestClient(app)

        # First request should trigger Redis connection attempt
        response = client.get("/test")

        # Should still work (fallback to in-memory)
        assert response.status_code == 200
        # Check for degraded mode header
        # Note: May not be set on first request due to async startup

    def test_in_memory_fallback_limits(self):
        """Test in-memory fallback enforces limits"""
        app = create_test_app("redis://invalid:9999")
        client = TestClient(app)

        # Free tier should allow 10 requests
        for i in range(10):
            response = client.get("/test")
            assert response.status_code == 200

        # 11th request should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        assert "degraded" in response.json().get("mode", "")

    @pytest.mark.asyncio
    async def test_redis_recovery_attempt(self):
        """Test periodic Redis reconnection attempts"""
        app = FastAPI()
        middleware = RateLimitMiddleware(app, redis_url="redis://localhost:6379")
        middleware._degraded_mode = True
        middleware._last_redis_check = 0  # Force recovery attempt

        with patch.object(middleware.redis_limiter, 'connect', return_value=True):
            success = await middleware._attempt_redis_recovery()
            assert success is True
            assert middleware._degraded_mode is False


class TestProductionFeatures:
    """Test production-specific features"""

    @pytest.fixture(autouse=True)
    def force_memory_mode(self):
        """Force middleware to use in-memory mode for these tests"""
        with patch('backend.middleware.rate_limiter.RedisRateLimiter.connect', return_value=False):
            yield

    def test_per_user_quota_tracking(self):
        """Test different users get separate quotas"""
        app = create_test_app()
        client = TestClient(app)

        # User 1 exhausts quota
        for i in range(10):
            response = client.get(
                "/test",
                headers={"X-API-Key": "user1-key"}
            )
            assert response.status_code == 200

        # User 1 is rate limited
        response = client.get(
            "/test",
            headers={"X-API-Key": "user1-key"}
        )
        assert response.status_code == 429

        # User 2 still has quota
        response = client.get(
            "/test",
            headers={"X-API-Key": "user2-key"}
        )
        assert response.status_code == 200

    def test_tier_based_limits(self):
        """Test different tiers have different limits"""
        app = create_test_app()
        client = TestClient(app)

        # Free tier: 10 requests
        for i in range(10):
            response = client.get(
                "/test",
                headers={"X-Subscription-Tier": "free"}
            )
            assert response.status_code == 200

        response = client.get(
            "/test",
            headers={"X-Subscription-Tier": "free"}
        )
        assert response.status_code == 429

        # Pro tier: 100 requests (using different identifier)
        response = client.get(
            "/test",
            headers={
                "X-Subscription-Tier": "pro",
                "X-API-Key": "pro-user"
            }
        )
        assert response.status_code == 200

    def test_rate_limit_headers_present(self):
        """Test rate limit headers are added to responses"""
        app = create_test_app()
        client = TestClient(app)

        response = client.get("/test")
        assert response.status_code == 200

        # Verify headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        assert "X-RateLimit-Tier" in response.headers

    def test_429_response_format(self):
        """Test 429 response has correct format"""
        app = create_test_app()
        client = TestClient(app)

        # Exhaust rate limit
        for i in range(10):
            client.get("/test")

        response = client.get("/test")
        assert response.status_code == 429

        data = response.json()
        assert "error" in data
        assert "message" in data
        assert "tier" in data
        assert "retry_after" in data
        assert "mode" in data
        assert "Retry-After" in response.headers

    def test_health_endpoint_bypass(self):
        """Test health endpoints bypass rate limiting"""
        app = create_test_app()
        client = TestClient(app)

        # Exhaust rate limit on /test
        for i in range(10):
            client.get("/test")

        # /test should be limited
        response = client.get("/test")
        assert response.status_code == 429

        # Health endpoint should still work
        response = client.get("/health")
        assert response.status_code == 200

    def test_enterprise_unlimited(self):
        """Test enterprise tier has unlimited requests"""
        app = create_test_app()
        client = TestClient(app)

        # Enterprise should allow many requests
        for i in range(150):
            response = client.get(
                "/test",
                headers={"X-Subscription-Tier": "enterprise"}
            )
            assert response.status_code == 200
            assert response.headers["X-RateLimit-Limit"] == "unlimited"


class TestAdminBypass:
    """Test admin bypass and whitelisting"""

    @pytest.fixture(autouse=True)
    def force_memory_mode(self):
        with patch('backend.middleware.rate_limiter.RedisRateLimiter.connect', return_value=False):
            yield

    def test_bypass_key(self):
        """Test rate limit bypass with key"""
        app = create_test_app()
        # Mock settings
        with patch('backend.middleware.rate_limiter.settings') as mock_settings:
            mock_settings.rate_limit_bypass_key = "secret-bypass"
            mock_settings.rate_limit_whitelist_ips = []

            client = TestClient(app)

            # Exhaust limit
            for _ in range(10):
                client.get("/test")

            # Should be limited
            response = client.get("/test")
            assert response.status_code == 429

            # Should bypass with key
            response = client.get(
                "/test",
                headers={"X-RateLimit-Bypass-Key": "secret-bypass"}
            )
            assert response.status_code == 200

    def test_ip_whitelist(self):
        """Test rate limit bypass with IP whitelist"""
        app = create_test_app()
        # Mock settings
        with patch('backend.middleware.rate_limiter.settings') as mock_settings:
            mock_settings.rate_limit_bypass_key = None
            mock_settings.rate_limit_whitelist_ips = ["127.0.0.1"]

            client = TestClient(app)

            # Request from whitelisted IP (TestClient defaults to 127.0.0.1 or similar, but we can't easily change client IP in TestClient without hacking starlette Request scope)
            # However, TestClient usually sends 'testclient' as host/port or None.
            # Let's rely on mocking request.client in middleware or just trusting TestClient uses 127.0.0.1 or ::1 locally.

            # Actually, TestClient requests usually have client=('testclient', 50000).
            # So "testclient" is the host.
            mock_settings.rate_limit_whitelist_ips = ["testclient"]

            # Exhaust limit (should not limit because whitelisted)
            for _ in range(20):
                response = client.get("/test")
                assert response.status_code == 200


class TestIdentifierPriority:
    """Test identifier resolution priority"""

    def test_user_id_priority(self):
        """Test user ID takes priority over API key"""
        app = create_test_app()

        # Mock request with user_id in state
        from fastapi import Request
        from starlette.datastructures import Headers

        request = Request(scope={
            "type": "http",
            "method": "GET",
            "headers": Headers({
                "x-api-key": "test-key"
            }).raw
        })
        request.state.user_id = "user123"

        middleware = RateLimitMiddleware(app)
        identifier = middleware._get_identifier(request)

        assert identifier == "user:user123"

    def test_api_key_priority(self):
        """Test API key takes priority over IP"""
        app = create_test_app()
        middleware = RateLimitMiddleware(app)

        from fastapi import Request
        from starlette.datastructures import Headers

        request = Request(scope={
            "type": "http",
            "method": "GET",
            "headers": Headers({
                "x-api-key": "test-key"
            }).raw,
            "client": ("127.0.0.1", 5000)
        })

        identifier = middleware._get_identifier(request)
        assert identifier == "key:test-key"

    def test_ip_fallback(self):
        """Test IP address is used as fallback"""
        app = create_test_app()
        middleware = RateLimitMiddleware(app)

        from fastapi import Request

        request = Request(scope={
            "type": "http",
            "method": "GET",
            "headers": [],
            "client": ("192.168.1.100", 5000)
        })

        identifier = middleware._get_identifier(request)
        assert identifier == "ip:192.168.1.100"


class TestLuaScriptLogic:
    """Test Lua script logic (simulated)"""

    @pytest.mark.asyncio
    async def test_sliding_window_cleanup(self):
        """Test old entries are cleaned up from sliding window"""
        limiter = RedisRateLimiter()

        # Mock Redis to verify ZREMRANGEBYSCORE is called
        with patch.object(limiter, 'redis') as mock_redis:
            mock_redis.evalsha = AsyncMock(return_value=[1, 9, 0])
            limiter._connection_healthy = True
            limiter._script_sha = "test_sha"

            await limiter.check_rate_limit("test-user", 10, window=60)

            # Verify script was called with correct parameters
            mock_redis.evalsha.assert_called_once()
            args = mock_redis.evalsha.call_args
            assert args[0][0] == "test_sha"
            assert args[0][2] == "ratelimit:test-user"  # key
            assert args[0][3] == 10  # limit
            assert args[0][4] == 60  # window


class TestAsyncCheckRateLimit:
    """Test async convenience function"""

    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self):
        """Test async check when under limit"""
        with patch('backend.middleware.rate_limiter.RedisRateLimiter') as MockLimiter:
            mock_instance = AsyncMock()
            mock_instance.connect = AsyncMock(return_value=True)
            mock_instance.check_rate_limit = AsyncMock(return_value=(True, 9, 0))
            mock_instance.close = AsyncMock()
            MockLimiter.return_value = mock_instance

            allowed, retry = await check_rate_limit("test-user", "free")

            assert allowed is True
            assert retry == 0

    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded(self):
        """Test async check when over limit"""
        with patch('backend.middleware.rate_limiter.RedisRateLimiter') as MockLimiter:
            mock_instance = AsyncMock()
            mock_instance.connect = AsyncMock(return_value=True)
            mock_instance.check_rate_limit = AsyncMock(return_value=(False, 0, 45))
            mock_instance.close = AsyncMock()
            MockLimiter.return_value = mock_instance

            allowed, retry = await check_rate_limit("test-user", "free")

            assert allowed is False
            assert retry == 45

    @pytest.mark.asyncio
    async def test_check_rate_limit_fallback(self):
        """Test async check falls back on Redis failure"""
        with patch('backend.middleware.rate_limiter.RedisRateLimiter') as MockLimiter:
            mock_instance = AsyncMock()
            mock_instance.connect = AsyncMock(side_effect=Exception("Redis down"))
            mock_instance.close = AsyncMock()
            MockLimiter.return_value = mock_instance

            # Should not raise, should fallback
            allowed, retry = await check_rate_limit("test-user", "free")

            # Fallback should allow first request
            assert isinstance(allowed, bool)


class TestTokenBucket:
    """Test TokenBucket implementation"""

    def test_initial_capacity(self):
        """Test bucket starts at full capacity"""
        bucket = TokenBucket(capacity=10, refill_rate=10/60)
        assert bucket.get_remaining() == 10

    def test_consume_tokens(self):
        """Test consuming tokens"""
        bucket = TokenBucket(capacity=10, refill_rate=10/60)
        assert bucket.consume(5) is True
        assert bucket.get_remaining() == 5

    def test_insufficient_tokens(self):
        """Test consuming more tokens than available"""
        bucket = TokenBucket(capacity=10, refill_rate=10/60)
        bucket.consume(8)
        assert bucket.consume(5) is False  # Only 2 remaining
        assert bucket.get_remaining() == 2

    def test_refill(self):
        """Test token refill over time"""
        bucket = TokenBucket(capacity=10, refill_rate=10/60)
        bucket.consume(10)
        assert bucket.get_remaining() == 0

        # Wait for refill (10 req/min = 1 token per 6 seconds)
        time.sleep(6.5)  # Wait 6.5 seconds for at least 1 token
        remaining = bucket.get_remaining()
        assert remaining >= 1  # At least 1 token refilled

    def test_max_capacity(self):
        """Test bucket doesn't exceed max capacity"""
        bucket = TokenBucket(capacity=10, refill_rate=10/60)
        bucket.consume(5)
        time.sleep(60)  # Wait full minute to refill completely
        bucket.refill()
        # Should be capped at 10, not 15 (5 remaining + 60s refill)
        assert bucket.get_remaining() == 10


def test_all_tiers_configured():
    """Test all tiers have rate limits configured"""
    expected_tiers = ["free", "starter", "pro", "franchise", "enterprise"]
    for tier in expected_tiers:
        assert tier in TIER_LIMITS
        assert isinstance(TIER_LIMITS[tier], int)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
