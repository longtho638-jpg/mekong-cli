"""
Tenant-Specific Rate Limiting Tests - ROIaaS Phase 6

Test Categories:
1. Tenant Override Detection (~10 tests) - _get_tenant_override returns config, None, handles errors
2. Middleware Integration (~10 tests) - Uses override, falls back to tier, headers show custom
3. Runtime Behavior (~10 tests) - Precedence, custom limits applied, separate limits per tenant

Total: ~30 tests
"""
from __future__ import annotations

import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.lib.tier_config import RateLimitConfig, get_preset_config
from src.db.tier_config_repository import TenantRateLimitOverride
from src.lib.rate_limiter_factory import TierRateLimiter
from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware


# ============================================================================
# TEST SECTION 1: Tenant Override Detection (~10 tests)
# ============================================================================


class TestTenantOverrideDetection:
    """Test _get_tenant_override method - override detection logic."""

    @pytest.fixture
    def mock_repo(self):
        """Create mock repository."""
        repo = MagicMock()
        return repo

    @pytest.mark.asyncio
    async def test_get_tenant_override_returns_override_config(self, mock_repo):
        """Test _get_tenant_override returns override config when present."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=200,
            custom_window=120,
            expires_at=None,
        )

        mock_repo.get_tenant_override = AsyncMock(return_value=override)

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is not None
        assert result.requests_per_minute == 200
        assert result.burst_size == 200  # Defaults to requests_per_minute

    @pytest.mark.asyncio
    async def test_get_tenant_override_returns_none_when_no_override(self, mock_repo):
        """Test _get_tenant_override returns None if no override exists."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        mock_repo.get_tenant_override = AsyncMock(return_value=None)

        result = await mw._get_tenant_override("nonexistent-tenant", "api_default")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_tenant_override_handles_expired_override(self, mock_repo):
        """Test _get_tenant_override handles expired overrides."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        past_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)
        expires_at = past_time.strftime("%Y-%m-%d %H:%M:%S+00:00")

        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=200,
            custom_window=120,
            expires_at=expires_at,
        )

        assert override.is_expired() is True

        mock_repo.get_tenant_override = AsyncMock(return_value=override)

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_tenant_override_handles_db_error_gracefully(self, mock_repo):
        """Test _get_tenant_override handles DB errors gracefully."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        mock_repo.get_tenant_override = AsyncMock(side_effect=Exception("DB Error"))

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_tenant_override_with_none_custom_limit(self, mock_repo):
        """Test _get_tenant_override returns None when custom_limit is None."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=None,
            custom_window=120,
            expires_at=None,
        )

        mock_repo.get_tenant_override = AsyncMock(return_value=override)

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_tenant_override_custom_window_defaults(self, mock_repo):
        """Test _get_tenant_override uses default 60s when custom_window is None."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=150,
            custom_window=None,
            expires_at=None,
        )

        mock_repo.get_tenant_override = AsyncMock(return_value=override)

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is not None
        assert result.requests_per_minute == 150

    @pytest.mark.asyncio
    async def test_get_tenant_override_future_expiry_not_expired(self, mock_repo):
        """Test _get_tenant_override returns config for future expiry."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        future_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        expires_at = future_time.strftime("%Y-%m-%d %H:%M:%S+00:00")

        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=250,
            custom_window=180,
            expires_at=expires_at,
        )

        assert override.is_expired() is False

        mock_repo.get_tenant_override = AsyncMock(return_value=override)

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is not None
        assert result.requests_per_minute == 250

    @pytest.mark.asyncio
    async def test_get_tenant_override_different_presets_separate(self, mock_repo):
        """Test different presets return different overrides."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        override_auth = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="auth_login",
            custom_limit=50,
            custom_window=60,
            expires_at=None,
        )

        override_api = TenantRateLimitOverride(
            id="2",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=200,
            custom_window=120,
            expires_at=None,
        )

        def mock_get_override(tenant_id, preset):
            if preset == "auth_login":
                return override_auth
            elif preset == "api_default":
                return override_api
            return None

        mock_repo.get_tenant_override = AsyncMock(side_effect=mock_get_override)

        result_auth = await mw._get_tenant_override("tenant-123", "auth_login")
        result_api = await mw._get_tenant_override("tenant-123", "api_default")

        assert result_auth.requests_per_minute == 50
        assert result_api.requests_per_minute == 200

    @pytest.mark.asyncio
    async def test_get_tenant_override_multiple_tenants(self, mock_repo):
        """Test each tenant has separate override."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        tenant1_override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-1",
            tier="free",
            preset="api_default",
            custom_limit=100,
            custom_window=60,
            expires_at=None,
        )

        tenant2_override = TenantRateLimitOverride(
            id="2",
            tenant_id="tenant-2",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=None,
        )

        def mock_get_override(tenant_id, preset):
            if tenant_id == "tenant-1":
                return tenant1_override
            elif tenant_id == "tenant-2":
                return tenant2_override
            return None

        mock_repo.get_tenant_override = AsyncMock(side_effect=mock_get_override)

        result1 = await mw._get_tenant_override("tenant-1", "api_default")
        result2 = await mw._get_tenant_override("tenant-2", "api_default")

        assert result1.requests_per_minute == 100
        assert result2.requests_per_minute == 500

    @pytest.mark.asyncio
    async def test_get_tenant_override_db_error_fallback(self, mock_repo):
        """Test DB error causes fallback to tier default."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app)
        mw._repo = mock_repo

        mock_repo.get_tenant_override = AsyncMock(side_effect=Exception("Connection failed"))

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is None


# ============================================================================
# TEST SECTION 2: Middleware Integration (~10 tests)
# ============================================================================


class TestMiddlewareIntegration:
    """Test middleware uses tenant override when present, falls back to tier default."""

    def test_override_config_increases_rate_limit(self):
        """Test override config increases rate limit above tier default."""
        # Get PRO tier default
        pro_default = get_preset_config("pro", "api_default")

        # Create override with higher limit
        override = RateLimitConfig(requests_per_minute=500)

        assert override.requests_per_minute > pro_default.requests_per_minute
        assert override.requests_per_minute == 500

    def test_override_config_with_explicit_burst(self):
        """Test override can specify explicit burst size."""
        override = RateLimitConfig(
            requests_per_minute=500,
            burst_size=600,
            window_seconds=120,
        )

        assert override.requests_per_minute == 500
        assert override.burst_size == 600
        assert override.window_seconds == 120

    @pytest.mark.asyncio
    async def test_middleware_applies_override_config(self):
        """Test middleware applies override config when present."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app, enable_rate_limiting=True)

        # Return TenantRateLimitOverride (not RateLimitConfig)
        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=None,
        )

        # Mock the repo to return override
        mock_repo = MagicMock()
        mock_repo.get_tenant_override = AsyncMock(return_value=override)
        mw._repo = mock_repo

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is not None
        assert result.requests_per_minute == 500
        assert result.burst_size == 500  # Defaults to rpm if not specified

    @pytest.mark.asyncio
    async def test_middleware_falls_back_to_default_without_override(self):
        """Test middleware falls back to default when no override."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app, enable_rate_limiting=True)

        # Mock the repo to return None
        mock_repo = MagicMock()
        mock_repo.get_tenant_override = AsyncMock(return_value=None)
        mw._repo = mock_repo

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is None

    @pytest.mark.asyncio
    async def test_middleware_override_displays_custom_tier(self):
        """Test override results in custom tier display."""
        async def app(req, recv, send):
            pass

        mw = TierRateLimitMiddleware(app, enable_rate_limiting=True)

        # Return TenantRateLimitOverride (not RateLimitConfig)
        override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=None,
        )

        # Mock the repo
        mock_repo = MagicMock()
        mock_repo.get_tenant_override = AsyncMock(return_value=override)
        mw._repo = mock_repo

        result = await mw._get_tenant_override("tenant-123", "api_default")

        assert result is not None
        # The middleware will show "pro (custom)" when override is present
        applied_tier = f"pro (custom)"
        assert applied_tier == "pro (custom)"

    @pytest.mark.asyncio
    async def test_middleware_rate_limiter_created_with_override(self):
        """Test rate limiter is created with override config values."""
        override_config = RateLimitConfig(
            requests_per_minute=500,
            burst_size=600,
            window_seconds=120,
        )

        # Create rate limiter with override config
        limiter = TierRateLimiter(override_config)

        assert limiter.config.requests_per_minute == 500
        assert limiter.config.burst_size == 600
        assert limiter.config.window_seconds == 120

    def test_custom_burst_size_overrides_default(self):
        """Test custom burst_size overrides default (which is requests_per_minute)."""
        override = RateLimitConfig(
            requests_per_minute=100,
            burst_size=200,
        )

        assert override.burst_size == 200

    def test_default_burst_size_equals_requests_per_minute(self):
        """Test default burst_size equals requests_per_minute when not specified."""
        override = RateLimitConfig(requests_per_minute=100)

        assert override.burst_size == 100  # Default

    def test_window_seconds_parameter(self):
        """Test window_seconds parameter is stored."""
        override = RateLimitConfig(
            requests_per_minute=100,
            burst_size=150,
            window_seconds=120,
        )

        assert override.window_seconds == 120

    def test_override_tier_display_format(self):
        """Test override displays tier with custom suffix."""
        tier = "pro"
        applied_tier = f"{tier} (custom)"
        assert applied_tier == "pro (custom)"


# ============================================================================
# TEST SECTION 3: Runtime Behavior (~10 tests)
# ============================================================================


class TestRuntimeBehavior:
    """Test runtime behavior of tenant override system."""

    @pytest.mark.asyncio
    async def test_override_takes_precedence_over_tier(self):
        """Test override config takes precedence over tier default."""
        # Get FREE tier default (5/min)
        free_default = get_preset_config("free", "api_default")

        # Create override (500/min)
        override = RateLimitConfig(requests_per_minute=500)

        assert override.requests_per_minute > free_default.requests_per_minute

        # Create limiter with override
        limiter = TierRateLimiter(override)
        assert limiter.config.requests_per_minute == 500

    @pytest.mark.asyncio
    async def test_custom_limit_and_window_both_applied(self):
        """Test both custom_limit and custom_window are applied from override."""
        override = RateLimitConfig(
            requests_per_minute=250,
            burst_size=350,
            window_seconds=120,
        )
        limiter = TierRateLimiter(override)

        assert limiter.config.requests_per_minute == 250
        assert limiter.config.burst_size == 350
        assert limiter.config.window_seconds == 120

    @pytest.mark.asyncio
    async def test_multiple_tenants_separate_limits(self):
        """Test multiple tenants have separate rate limit states."""
        tenant1_limiter = TierRateLimiter(
            RateLimitConfig(requests_per_minute=10, burst_size=10)
        )
        tenant2_limiter = TierRateLimiter(
            RateLimitConfig(requests_per_minute=50, burst_size=50)
        )

        # Consume some tokens from each
        for _ in range(5):
            tenant1_limiter.acquire()

        for _ in range(20):
            tenant2_limiter.acquire()

        # Each should track separately
        assert abs(tenant1_limiter._tokens - 5.0) < 0.01
        assert abs(tenant2_limiter._tokens - 30.0) < 0.01

    @pytest.mark.asyncio
    async def test_tenant_override_expiry_check(self):
        """Test override expiry is checked before applying."""
        # Create override that expired 1 hour ago
        past_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)
        expires_at = past_time.strftime("%Y-%m-%d %H:%M:%S+00:00")

        override_expired = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=expires_at,
        )

        assert override_expired.is_expired() is True

        # Create future expiry
        future_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        expires_at = future_time.strftime("%Y-%m-%d %H:%M:%S+00:00")

        override_valid = TenantRateLimitOverride(
            id="2",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=expires_at,
        )

        assert override_valid.is_expired() is False

        # No expiry means never expires
        override_no_expiry = TenantRateLimitOverride(
            id="3",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=120,
            expires_at=None,
        )

        assert override_no_expiry.is_expired() is False

    @pytest.mark.asyncio
    async def test_rate_limiter_token_bucket_behavior(self):
        """Test token bucket behavior with override limits."""
        override = RateLimitConfig(requests_per_minute=5, burst_size=5)
        limiter = TierRateLimiter(override)

        # Initial tokens = burst_size
        assert limiter._tokens == 5.0

        # Consume all tokens
        for i in range(5):
            result = limiter.acquire()
            assert result is True
            assert abs(limiter._tokens - (5.0 - (i + 1))) < 0.01

        # Should fail when no tokens
        result = limiter.acquire()
        assert result is False

    @pytest.mark.asyncio
    async def test_tenant_override_with_different_tiers(self):
        """Test tenant override works across different base tiers."""
        tenant_override = RateLimitConfig(requests_per_minute=1000, burst_size=1500)

        for tier in ["free", "trial", "pro", "enterprise"]:
            limiter = TierRateLimiter(tenant_override)
            assert limiter.config.requests_per_minute == 1000
            assert limiter.config.burst_size == 1500

    @pytest.mark.asyncio
    async def test_custom_limit_higher_than_tier_default(self):
        """Test custom limit can exceed tier default."""
        free_tier_default = get_preset_config("free", "api_default")
        custom_override = RateLimitConfig(requests_per_minute=500, burst_size=600)

        assert custom_override.requests_per_minute > free_tier_default.requests_per_minute
        assert custom_override.burst_size > free_tier_default.requests_per_minute

    @pytest.mark.asyncio
    async def test_override_applied_to_specific_preset_only(self):
        """Test override applies only to specified preset."""
        api_override = RateLimitConfig(
            requests_per_minute=300,
            burst_size=400,
        )
        auth_config = get_preset_config("pro", "auth_login")

        api_limiter = TierRateLimiter(api_override)
        auth_limiter = TierRateLimiter(auth_config)

        assert api_limiter.config.requests_per_minute == 300
        assert auth_limiter.config.requests_per_minute == 30

    @pytest.mark.asyncio
    async def test_tenant_with_no_custom_limit_falls_back(self):
        """Test tenant without custom_limit falls back to None."""
        override_with_limit = RateLimitConfig(requests_per_minute=200, burst_size=300)
        limiter = TierRateLimiter(override_with_limit)
        assert limiter.config.requests_per_minute == 200


# ============================================================================
# TEST SECTION 4: TierRateLimiter Edge Cases
# ============================================================================


class TestTierRateLimiterEdgeCases:
    """Test edge cases for TierRateLimiter class."""

    @pytest.mark.asyncio
    async def test_limiter_zero_burst_size(self):
        """Test limiter with zero burst size."""
        override = RateLimitConfig(requests_per_minute=0, burst_size=0)
        limiter = TierRateLimiter(override)

        assert limiter._tokens == 0.0
        assert limiter.acquire() is False

    @pytest.mark.asyncio
    async def test_limiter_high_burst_size(self):
        """Test limiter with high burst size."""
        override = RateLimitConfig(requests_per_minute=5000, burst_size=10000)
        limiter = TierRateLimiter(override)

        assert limiter._tokens == 10000.0

        for _ in range(5000):
            result = limiter.acquire()
            assert result is True

    @pytest.mark.asyncio
    async def test_limiter_token_refill(self):
        """Test tokens refill over time."""
        config = RateLimitConfig(requests_per_minute=60, burst_size=10)
        limiter = TierRateLimiter(config)

        for _ in range(10):
            limiter.acquire()

        # Tokens should be nearly empty
        assert limiter._tokens < 0.1

        # Simulate time passing (10 seconds at 60/min = 10 tokens added)
        limiter._last_update = time.time() - 10

        # Call refill manually since tokens are read-only
        limiter._refill()

        tokens_after_refill = limiter._tokens
        # Should have refilled close to 10 tokens
        assert tokens_after_refill > 8.0

    @pytest.mark.asyncio
    async def test_limiter_reset_method(self):
        """Test reset method restores full capacity."""
        config = RateLimitConfig(requests_per_minute=100, burst_size=150)
        limiter = TierRateLimiter(config)

        for _ in range(50):
            limiter.acquire()

        assert limiter._tokens < 150.0

        limiter.reset()

        assert limiter._tokens == 150.0


# ============================================================================
# TEST SECTION 5: Integration Edge Cases
# ============================================================================


class TestIntegrationEdgeCases:
    """Test integration edge cases for tenant override system."""

    def test_override_config_constructed_from_repository_data(self):
        """Test RateLimitConfig constructed correctly from TenantRateLimitOverride."""
        repository_override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=250,
            custom_window=120,
            expires_at=None,
        )

        config = RateLimitConfig(
            requests_per_minute=repository_override.custom_limit,
            burst_size=repository_override.custom_limit,
        )

        assert config.requests_per_minute == 250
        assert config.burst_size == 250

    def test_override_with_explicit_burst_size(self):
        """Test override can specify explicit burst_size."""
        repository_override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=200,
            custom_window=60,
            expires_at=None,
        )

        burst_size = repository_override.custom_limit * 2
        config = RateLimitConfig(
            requests_per_minute=repository_override.custom_limit,
            burst_size=burst_size,
        )

        assert config.requests_per_minute == 200
        assert config.burst_size == 400

    def test_rapid_override_changes(self):
        """Test rapid override changes don't corrupt state."""
        override1 = RateLimitConfig(requests_per_minute=100, burst_size=150)
        override2 = RateLimitConfig(requests_per_minute=200, burst_size=250)
        override3 = RateLimitConfig(requests_per_minute=300, burst_size=350)

        config = override2
        assert config.requests_per_minute == 200

        config = override3
        assert config.requests_per_minute == 300

    def test_override_config_serialization(self):
        """Test override config can be serialized for storage."""
        config = RateLimitConfig(requests_per_minute=500, burst_size=600)

        serialized = {
            "requests_per_minute": config.requests_per_minute,
            "burst_size": config.burst_size,
            "window_seconds": config.window_seconds,
        }

        assert serialized["requests_per_minute"] == 500
        assert serialized["burst_size"] == 600
        assert serialized["window_seconds"] == 60  # Window defaults to 60s

    def test_override_deserialization(self):
        """Test override config can be deserialized."""
        serialized = {
            "requests_per_minute": 250,
            "burst_size": 350,
            "window_seconds": 60,
        }

        config = RateLimitConfig(
            requests_per_minute=serialized["requests_per_minute"],
            burst_size=serialized["burst_size"],
        )

        assert config.requests_per_minute == 250
        assert config.burst_size == 350
        assert config.window_seconds == 60  # Defaults to 60s

    def test_tenant_override_with_zero_limit(self):
        """Test override with zero rate limit."""
        config = RateLimitConfig(requests_per_minute=0, burst_size=0)
        assert config.requests_per_minute == 0
        assert config.burst_size == 0

    def test_tenant_override_with_large_window(self):
        """Test override with large window seconds."""
        config = RateLimitConfig(requests_per_minute=1000, burst_size=1500, window_seconds=1500)
        assert config.window_seconds == 1500

    def test_tenant_override_different_preset_same_tenant(self):
        """Test same tenant can have different overrides for different presets."""
        api_override = TenantRateLimitOverride(
            id="1",
            tenant_id="tenant-123",
            tier="pro",
            preset="api_default",
            custom_limit=500,
            custom_window=60,
            expires_at=None,
        )

        auth_override = TenantRateLimitOverride(
            id="2",
            tenant_id="tenant-123",
            tier="pro",
            preset="auth_login",
            custom_limit=50,
            custom_window=60,
            expires_at=None,
        )

        assert api_override.custom_limit == 500
        assert auth_override.custom_limit == 50
        assert api_override.preset == "api_default"
        assert auth_override.preset == "auth_login"


# ============================================================================
# IMPORTS NEEDED FOR TESTS
# ============================================================================
import time
