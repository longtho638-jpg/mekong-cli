"""
Test Rate Limiting Middleware
"""

import pytest
import time
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from backend.middleware.rate_limiter import (
    RateLimitMiddleware,
    TokenBucket,
    TIER_LIMITS,
    check_rate_limit
)


# Test app setup
def create_test_app():
    """Create test FastAPI app with rate limiting"""
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


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


class TestRateLimitMiddleware:
    """Test rate limiting middleware"""

    def test_free_tier_limit(self):
        """Test free tier rate limit (10 req/min)"""
        app = create_test_app()
        client = TestClient(app)

        # Free tier should allow 10 requests
        for i in range(10):
            response = client.get("/test")
            assert response.status_code == 200
            assert "X-RateLimit-Limit" in response.headers
            assert response.headers["X-RateLimit-Limit"] == "10"
            assert response.headers["X-RateLimit-Tier"] == "free"

        # 11th request should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        assert response.json()["error"] == "Rate limit exceeded"
        assert "Retry-After" in response.headers

    def test_pro_tier_limit(self):
        """Test pro tier rate limit (100 req/min)"""
        app = create_test_app()
        client = TestClient(app)

        # Pro tier should allow 100 requests
        for i in range(100):
            response = client.get(
                "/test",
                headers={"X-Subscription-Tier": "pro"}
            )
            assert response.status_code == 200
            assert response.headers["X-RateLimit-Limit"] == "100"
            assert response.headers["X-RateLimit-Tier"] == "pro"

        # 101st request should be rate limited
        response = client.get(
            "/test",
            headers={"X-Subscription-Tier": "pro"}
        )
        assert response.status_code == 429

    def test_enterprise_unlimited(self):
        """Test enterprise tier has unlimited requests"""
        app = create_test_app()
        client = TestClient(app)

        # Enterprise tier should allow many requests
        for i in range(150):
            response = client.get(
                "/test",
                headers={"X-Subscription-Tier": "enterprise"}
            )
            assert response.status_code == 200
            assert response.headers["X-RateLimit-Limit"] == "unlimited"
            assert response.headers["X-RateLimit-Tier"] == "enterprise"

    def test_api_key_tracking(self):
        """Test rate limiting by API key"""
        app = create_test_app()
        client = TestClient(app)

        # Different API keys get separate rate limits
        for i in range(10):
            response = client.get(
                "/test",
                headers={"X-API-Key": "key1"}
            )
            assert response.status_code == 200

        # Same key exceeds limit
        response = client.get(
            "/test",
            headers={"X-API-Key": "key1"}
        )
        assert response.status_code == 429

        # Different key still has quota
        response = client.get(
            "/test",
            headers={"X-API-Key": "key2"}
        )
        assert response.status_code == 200

    def test_health_endpoint_bypass(self):
        """Test health endpoints bypass rate limiting"""
        app = create_test_app()
        client = TestClient(app)

        # Exhaust rate limit
        for i in range(10):
            client.get("/test")

        # Health endpoint should still work
        response = client.get("/health")
        assert response.status_code == 200

    def test_rate_limit_headers(self):
        """Test rate limit headers are present"""
        app = create_test_app()
        client = TestClient(app)

        response = client.get("/test")
        assert response.status_code == 200

        # Check all headers present
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        assert "X-RateLimit-Tier" in response.headers

        # Remaining should decrease
        remaining_1 = int(response.headers["X-RateLimit-Remaining"])
        response = client.get("/test")
        remaining_2 = int(response.headers["X-RateLimit-Remaining"])
        assert remaining_2 < remaining_1

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
        assert data["tier"] == "free"

    def test_tier_upgrade_resets_bucket(self):
        """Test upgrading tier creates new bucket"""
        app = create_test_app()
        client = TestClient(app)

        # Use free tier limit
        for i in range(10):
            response = client.get(
                "/test",
                headers={"X-API-Key": "upgrade-test"}
            )
            assert response.status_code == 200

        # Should be rate limited on free
        response = client.get(
            "/test",
            headers={"X-API-Key": "upgrade-test"}
        )
        assert response.status_code == 429

        # Upgrade to pro tier (new bucket)
        response = client.get(
            "/test",
            headers={
                "X-API-Key": "upgrade-test",
                "X-Subscription-Tier": "pro"
            }
        )
        assert response.status_code == 200
        assert response.headers["X-RateLimit-Tier"] == "pro"


class TestCheckRateLimit:
    """Test manual rate limit checking function"""

    def test_check_allowed(self):
        """Test checking when under limit"""
        from fastapi import FastAPI
        app = FastAPI()
        middleware = RateLimitMiddleware(app)

        allowed, retry_after = check_rate_limit("test-id-1", "free", middleware)
        assert allowed is True
        assert retry_after == 0

    def test_check_exceeded(self):
        """Test checking when over limit"""
        from fastapi import FastAPI
        app = FastAPI()
        middleware = RateLimitMiddleware(app)

        # Use unique ID to avoid interference from other tests
        test_id = f"test-exceeded-{time.time()}"

        # Consume all tokens for free tier (10 requests) using same middleware
        for i in range(10):
            allowed, _ = check_rate_limit(test_id, "free", middleware)
            assert allowed is True

        # 11th request should be rate limited
        allowed, retry_after = check_rate_limit(test_id, "free", middleware)
        assert allowed is False
        assert retry_after > 0


def test_all_tiers_configured():
    """Test all tiers have rate limits configured"""
    expected_tiers = ["free", "starter", "pro", "franchise", "enterprise"]
    for tier in expected_tiers:
        assert tier in TIER_LIMITS
        assert isinstance(TIER_LIMITS[tier], int)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
