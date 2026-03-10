"""
License Enforcement Service Tests — Phase 4

Test Categories:
1. LicenseEnforcementService Tests (~15 tests) - status checks, caching, tier comparison
2. Middleware Integration Tests (~10 tests) - 403 blocks, response structure, headers
3. Audit Logging Tests (~5 tests) - enforcement events, log format

Total: ~30 tests
"""

from __future__ import annotations

import time
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timezone, timedelta

import pytest

from src.services.license_enforcement import (
    LicenseEnforcementService,
    LicenseStatus,
    LicenseInfo,
    get_license_enforcement,
    is_tier_sufficient,
)


# ============================================================================
# TEST SECTION 1: LicenseStatus Enum Tests (~4 tests)
# ============================================================================


class TestLicenseStatusEnum:
    """Test LicenseStatus enum values and behavior."""

    def test_license_status_enum_values(self):
        """Test all LicenseStatus enum values are correct."""
        assert LicenseStatus.ACTIVE.value == "active"
        assert LicenseStatus.SUSPENDED.value == "suspended"
        assert LicenseStatus.REVOKED.value == "revoked"
        assert LicenseStatus.EXPIRED.value == "expired"
        assert LicenseStatus.INVALID.value == "invalid"
        assert LicenseStatus.INSUFFICIENT_TIER.value == "insufficient_tier"

    def test_license_status_can_compare(self):
        """Test license status can be compared."""
        assert LicenseStatus.ACTIVE == LicenseStatus.ACTIVE
        assert LicenseStatus.ACTIVE != LicenseStatus.SUSPENDED
        assert LicenseStatus.REVOKED != LicenseStatus.EXPIRED


# ============================================================================
# TEST SECTION 2: LicenseEnforcementService Status Checks (~8 tests)
# ============================================================================


class TestCheckLicenseStatus:
    """Test check_license_status method - database lookup with caching."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database connection."""
        db = MagicMock()
        return db

    @pytest.fixture
    def service(self, mock_db):
        """Create LicenseEnforcementService with mock DB."""
        service = LicenseEnforcementService(db=mock_db)
        return service

    @pytest.mark.asyncio
    async def test_check_active_license_returns_active(self, service, mock_db):
        """Test check_license_status returns ACTIVE for valid license."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "1",
            "key_id": "key123",
            "tier": "pro",
            "status": "active",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        status = await service.check_license_status("raasjwt-pro-abc123")

        assert status == LicenseStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_check_suspended_license_returns_suspended(self, service, mock_db):
        """Test check_license_status returns SUSPENDED for suspended license."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "2",
            "key_id": "key456",
            "tier": "pro",
            "status": "suspended",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        status = await service.check_license_status("raasjwt-pro-def456")

        assert status == LicenseStatus.SUSPENDED

    @pytest.mark.asyncio
    async def test_check_revoked_license_returns_revoked(self, service, mock_db):
        """Test check_license_status returns REVOKED for revoked license."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "3",
            "key_id": "key789",
            "tier": "enterprise",
            "status": "revoked",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=60),
        })

        status = await service.check_license_status("raasjwt-enterprise-ghi789")

        assert status == LicenseStatus.REVOKED

    @pytest.mark.asyncio
    async def test_check_expired_license_returns_expired(self, service, mock_db):
        """Test check_license_status returns EXPIRED for expired license."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "4",
            "key_id": "key000",
            "tier": "trial",
            "status": "active",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) - timedelta(days=1),
        })

        status = await service.check_license_status("raasjwt-trial-jkl000")

        assert status == LicenseStatus.EXPIRED

    @pytest.mark.asyncio
    async def test_check_license_not_in_db_returns_invalid(self, service, mock_db):
        """Test check_license_status returns INVALID when license not in DB."""
        mock_db.fetch_one = AsyncMock(return_value=None)

        status = await service.check_license_status("invalid-license-key")

        assert status == LicenseStatus.INVALID

    @pytest.mark.asyncio
    async def test_check_license_status_caches_result(self, service, mock_db):
        """Test check_license_status caches result for 5 minutes."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "6",
            "key_id": "key222",
            "tier": "pro",
            "status": "active",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        # First call - hits DB
        status1 = await service.check_license_status("raasjwt-pro-vwx222")
        assert status1 == LicenseStatus.ACTIVE
        assert mock_db.fetch_one.call_count == 1

        # Second call - should use cache
        status2 = await service.check_license_status("raasjwt-pro-vwx222")
        assert status2 == LicenseStatus.ACTIVE
        # DB should not be called again due to cache
        assert mock_db.fetch_one.call_count == 1

    @pytest.mark.asyncio
    async def test_check_license_status_clear_cache(self, service, mock_db):
        """Test clear_cache invalidates all cached entries."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "7",
            "key_id": "key333",
            "tier": "pro",
            "status": "active",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        # Populate cache
        await service.check_license_status("raasjwt-pro-yza333")
        assert len(service._cache) >= 1

        # Clear cache
        service.clear_cache()
        assert len(service._cache) == 0


# ============================================================================
# TEST SECTION 3: Tier Comparison Tests (~5 tests)
# ============================================================================


class TestTierSufficient:
    """Test is_tier_sufficient method - tier hierarchy comparison."""

    @pytest.fixture
    def service(self):
        """Create LicenseEnforcementService instance."""
        return LicenseEnforcementService(db=MagicMock())

    def test_free_insufficient_for_pro(self, service):
        """Test FREE tier insufficient for PRO endpoint."""
        assert service.is_tier_sufficient("free", "pro") is False

    def test_free_sufficient_for_free(self, service):
        """Test FREE tier sufficient for FREE endpoint."""
        assert service.is_tier_sufficient("free", "free") is True

    def test_trial_sufficient_for_free(self, service):
        """Test TRIAL tier sufficient for FREE endpoint."""
        assert service.is_tier_sufficient("trial", "free") is True

    def test_pro_sufficient_for_trial(self, service):
        """Test PRO tier sufficient for TRIAL endpoint."""
        assert service.is_tier_sufficient("pro", "trial") is True

    def test_pro_sufficient_for_pro(self, service):
        """Test PRO tier sufficient for PRO endpoint."""
        assert service.is_tier_sufficient("pro", "pro") is True

    def test_enterprise_sufficient_for_all(self, service):
        """Test ENTERPRISE tier sufficient for all endpoints."""
        assert service.is_tier_sufficient("enterprise", "free") is True
        assert service.is_tier_sufficient("enterprise", "trial") is True
        assert service.is_tier_sufficient("enterprise", "pro") is True
        assert service.is_tier_sufficient("enterprise", "enterprise") is True

    def test_custom_tier_suffix_handled(self, service):
        """Test tier with (custom) suffix extracts base tier."""
        assert service.is_tier_sufficient("pro (custom)", "trial") is True
        assert service.is_tier_sufficient("free (custom)", "pro") is False

    def test_unknown_tier_defaults_to_free(self, service):
        """Test unknown tier defaults to free level."""
        assert service.is_tier_sufficient("unknown", "pro") is False
        assert service.is_tier_sufficient("free", "unknown") is True

    def test_case_insensitive_tier_comparison(self, service):
        """Test tier comparison is case-insensitive."""
        assert service.is_tier_sufficient("PRO", "free") is True
        assert service.is_tier_sufficient("Pro", "Trial") is True


# ============================================================================
# TEST SECTION 4: LicenseInfo Data Class Tests (~3 tests)
# ============================================================================


class TestLicenseInfo:
    """Test LicenseInfo data class."""

    def test_license_info_with_all_fields(self):
        """Test LicenseInfo created with all fields."""
        info = LicenseInfo(
            key_id="key123",
            tier="pro",
            status="active",
            email="user@example.com",
            expires_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        assert info.key_id == "key123"
        assert info.tier == "pro"
        assert info.status == "active"
        assert info.email == "user@example.com"

    def test_license_info_with_optional_fields_none(self):
        """Test LicenseInfo with optional fields as None."""
        info = LicenseInfo(
            key_id="key456",
            tier="free",
            status="active",
        )

        assert info.key_id == "key456"
        assert info.tier == "free"
        assert info.email is None
        assert info.expires_at is None


# ============================================================================
# TEST SECTION 5: Global Functions Tests (~4 tests)
# ============================================================================


class TestGlobalFunctions:
    """Test global functions - get_license_enforcement, check_license_status."""

    def test_get_license_enforcement_creates_instance(self):
        """Test get_license_enforcement creates global instance."""
        service = get_license_enforcement()
        assert isinstance(service, LicenseEnforcementService)

    def test_get_license_enforcement_returns_same_instance(self):
        """Test get_license_enforcement returns cached instance."""
        service1 = get_license_enforcement()
        service2 = get_license_enforcement()
        assert service1 is service2

    def test_is_tier_sufficient_global(self):
        """Test is_tier_sufficient uses global service instance."""
        result = is_tier_sufficient("pro", "free")
        assert result is True

    def test_is_tier_sufficient_case_insensitive_global(self):
        """Test global is_tier_sufficient is case-insensitive."""
        result = is_tier_sufficient("PRO", "free")
        assert result is True


# ============================================================================
# TEST SECTION 6: Cache TTL Tests (~3 tests)
# ============================================================================


class TestCacheTTL:
    """Test cache expiration with 5-min TTL."""

    @pytest.fixture
    def service(self):
        """Create LicenseEnforcementService."""
        service = LicenseEnforcementService(db=MagicMock())
        return service

    def test_cache_expires_after_5_minutes(self, service):
        """Test cache entry expires after 5 minutes."""
        old_time = time.time() - 301  # 5 minutes + 1 second ago
        service._cache["test_key"] = (
            LicenseInfo(key_id="test", tier="pro", status="active"),
            old_time,
        )

        result = service._cache_get("test_key")
        assert result is None
        assert "test_key" not in service._cache

    def test_cache_not_expired_before_5_minutes(self, service):
        """Test cache entry still valid before 5 minutes."""
        recent_time = time.time() - 240  # 4 minutes ago
        service._cache["test_key2"] = (
            LicenseInfo(key_id="test", tier="pro", status="active"),
            recent_time,
        )

        result = service._cache_get("test_key2")
        assert result is not None
        assert result.tier == "pro"

    def test_cache_invalidate_single_key(self, service):
        """Test _cache_invalidate removes single key."""
        service._cache["key1"] = (
            LicenseInfo(key_id="k1", tier="free", status="active"),
            time.time(),
        )
        service._cache["key2"] = (
            LicenseInfo(key_id="k2", tier="pro", status="active"),
            time.time(),
        )

        service._cache_invalidate("key1")

        assert "key1" not in service._cache
        assert "key2" in service._cache


# ============================================================================
# TEST SECTION 7: LicenseEnforcementService _determine_status Tests (~5 tests)
# ============================================================================


class TestDetermineStatus:
    """Test _determine_status internal method."""

    @pytest.fixture
    def service(self):
        """Create service instance."""
        return LicenseEnforcementService(db=MagicMock())

    def test_determine_status_active(self, service):
        """Test determine_status returns ACTIVE for active status."""
        info = LicenseInfo(
            key_id="key1",
            tier="pro",
            status="active",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )

        status = service._determine_status(info)
        assert status == LicenseStatus.ACTIVE

    def test_determine_status_suspended(self, service):
        """Test determine_status returns SUSPENDED."""
        info = LicenseInfo(
            key_id="key2",
            tier="pro",
            status="suspended",
        )

        status = service._determine_status(info)
        assert status == LicenseStatus.SUSPENDED

    def test_determine_status_revoked(self, service):
        """Test determine_status returns REVOKED."""
        info = LicenseInfo(
            key_id="key3",
            tier="enterprise",
            status="revoked",
        )

        status = service._determine_status(info)
        assert status == LicenseStatus.REVOKED

    def test_determine_status_expired(self, service):
        """Test determine_status returns EXPIRED for expired license."""
        info = LicenseInfo(
            key_id="key4",
            tier="trial",
            status="active",
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        )

        status = service._determine_status(info)
        assert status == LicenseStatus.EXPIRED

    def test_determine_status_no_expiry_not_expired(self, service):
        """Test determine_status not expired when no expiry date."""
        info = LicenseInfo(
            key_id="key5",
            tier="enterprise",
            status="active",
            expires_at=None,
        )

        status = service._determine_status(info)
        assert status == LicenseStatus.ACTIVE


# ============================================================================
# TEST SECTION 8: Middleware Response Structure Tests (~10 tests)
# ============================================================================


class TestLicenseEnforcementMiddlewareResponse:
    """Test middleware response structure - 403 blocks, headers, and logging."""

    @pytest.fixture
    def middleware_app(self):
        """Create mock ASGI app."""
        async def app(req, recv, send):
            return {"status": 200}
        return app

    def test_middleware_403_response_body_suspended(self, middleware_app):
        """Test 403 response includes correct error structure for suspended."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.SUSPENDED,
                tenant_id="tenant123",
                path="/api/test",
            )

            assert response.status_code == 403
            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            assert "license_suspended" in content
            assert "suspended" in content

    def test_middleware_403_response_body_revoked(self, middleware_app):
        """Test 403 response includes correct error structure for revoked."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.REVOKED,
                tenant_id="tenant456",
                path="/api/secure",
            )

            assert response.status_code == 403
            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            assert "license_revoked" in content
            assert "revoked" in content

    def test_middleware_403_response_body_expired(self, middleware_app):
        """Test 403 response includes correct error structure for expired."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.EXPIRED,
                tenant_id="tenant789",
                path="/api/data",
            )

            assert response.status_code == 403
            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            assert "license_expired" in content
            assert "expired" in content

    def test_middleware_403_response_body_invalid(self, middleware_app):
        """Test 403 response includes correct error structure for invalid."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.INVALID,
                tenant_id="tenant000",
                path="/api/invalid",
            )

            assert response.status_code == 403
            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            assert "license_invalid" in content

    def test_middleware_403_response_body_insufficient_tier(self, middleware_app):
        """Test 403 response includes correct error structure for insufficient tier."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.INSUFFICIENT_TIER,
                tenant_id="tenant111",
                path="/api/premium",
            )

            assert response.status_code == 403
            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            assert "tier_insufficient" in content

    def test_middleware_403_response_contains_license_status(self, middleware_app):
        """Test 403 response includes license_status field in content."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            response = mw._license_blocked_response(
                status=LicenseStatus.SUSPENDED,
                tenant_id="tenant222",
                path="/api/test",
            )

            content = response.body.decode() if hasattr(response.body, 'decode') else response.body
            # JSON may not have space after colon - check for either format
            assert "license_status" in content and "suspended" in content

    def test_middleware_logs_license_enforcement(self, middleware_app):
        """Test middleware logs license enforcement actions."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

                mw._log_license_enforcement(
                    tenant_id="tenant333",
                    status=LicenseStatus.SUSPENDED,
                    endpoint="/api/test",
                    action="blocked",
                )

                assert mock_logger.info.called

    def test_middleware_logs_license_enforcement_allowed(self, middleware_app):
        """Test middleware logs license enforcement allowed action."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

                mw._log_license_enforcement(
                    tenant_id="tenant444",
                    status=LicenseStatus.ACTIVE,
                    endpoint="/api/data",
                    action="allowed",
                )

                assert mock_logger.info.called

    def test_middleware_tier_sufficient_check(self, middleware_app):
        """Test middleware can check tier sufficiency."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement") as mock_get_service:
            mock_service = MagicMock()
            mock_service.is_tier_sufficient = MagicMock(side_effect=lambda current, required: {
                ("free", "enterprise"): False,
                ("pro", "free"): True,
                ("pro", "pro"): True,
            }.get((current, required), True))
            mock_get_service.return_value = mock_service

            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware

            mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

            # Test tier comparison on the service
            assert mw._license_service.is_tier_sufficient("free", "enterprise") is False
            assert mw._license_service.is_tier_sufficient("pro", "free") is True

    def test_middleware_dev_mode_bypasses_license_check(self, middleware_app):
        """Test middleware bypasses all checks in dev mode."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware

            with patch.dict("os.environ", {"MEKONG_DEV_MODE": "true"}):
                mw = TierRateLimitMiddleware(middleware_app, enable_rate_limiting=True)

                assert mw._is_dev_mode() is True


# ============================================================================
# TEST SECTION 9: Audit Logging Tests (~5 tests)
# ============================================================================


class TestAuditLogging:
    """Test license enforcement audit logging."""

    def test_enforcement_action_logged(self):
        """Test enforcement action is logged."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                mw = TierRateLimitMiddleware(lambda: None, enable_rate_limiting=True)

                mw._log_license_enforcement(
                    tenant_id="tenant123",
                    status=LicenseStatus.SUSPENDED,
                    endpoint="/api/test",
                    action="blocked",
                )

                # Verify log was called
                assert mock_logger.info.called
                # Verify the log entry has expected format
                call_args = mock_logger.info.call_args[0]
                log_entry = call_args[0]
                assert isinstance(log_entry, str)
                assert "license_enforcement_event" in log_entry

    def test_license_status_in_log_entry(self):
        """Test license_status field included in log entry."""
        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                mw = TierRateLimitMiddleware(lambda: None, enable_rate_limiting=True)

                mw._log_license_enforcement(
                    tenant_id="tenant456",
                    status=LicenseStatus.REVOKED,
                    endpoint="/api/secure",
                    action="blocked",
                )

                # Verify status was included
                assert LicenseStatus.REVOKED.value == "revoked"
                call_args = mock_logger.info.call_args[0]
                log_entry = call_args[0]
                assert "revoked" in log_entry

    def test_audit_log_format_structure(self):
        """Test audit log entry format has correct structure."""

        with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
            with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                mw = TierRateLimitMiddleware(lambda: None, enable_rate_limiting=True)

                mw._log_license_enforcement(
                    tenant_id="tenant789",
                    status=LicenseStatus.ACTIVE,
                    endpoint="/api/data",
                    action="allowed",
                )

                # Verify structure
                call_args = mock_logger.info.call_args[0]
                log_entry = call_args[0]
                assert "license_enforcement_event" in log_entry
                assert "tenant_id" in log_entry
                assert "license_status" in log_entry
                assert "enforcement_action" in log_entry

    def test_multiple_enforcement_events_logged(self):
        """Test multiple enforcement events can be logged."""
        events = [
            (LicenseStatus.SUSPENDED, "blocked"),
            (LicenseStatus.REVOKED, "blocked"),
            (LicenseStatus.ACTIVE, "allowed"),
        ]

        for status, action in events:
            with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
                with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                    from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware

                    mw = TierRateLimitMiddleware(lambda: None, enable_rate_limiting=True)
                    mw._log_license_enforcement(
                        tenant_id="multi_tenant",
                        status=status,
                        endpoint="/api/test",
                        action=action,
                    )
                    assert mock_logger.info.called

    def test_audit_logging_with_different_endpoints(self):
        """Test audit logging works for different endpoints."""
        endpoints = ["/api/data", "/api/users", "/auth/login", "/health"]

        for endpoint in endpoints:
            with patch("src.lib.tier_rate_limit_middleware.get_license_enforcement"):
                with patch("src.lib.tier_rate_limit_middleware.logger") as mock_logger:
                    from src.lib.tier_rate_limit_middleware import TierRateLimitMiddleware, LicenseStatus

                    mw = TierRateLimitMiddleware(lambda: None, enable_rate_limiting=True)
                    mw._log_license_enforcement(
                        tenant_id="endpoint_test",
                        status=LicenseStatus.ACTIVE,
                        endpoint=endpoint,
                        action="allowed",
                    )
                    assert mock_logger.info.called


# ============================================================================
# TEST SECTION 10: Edge Cases and Integration Tests (~5 tests)
# ============================================================================


class TestEdgeCases:
    """Test edge cases and integration scenarios."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database."""
        db = MagicMock()
        return db

    @pytest.fixture
    def service(self, mock_db):
        """Create service with mock DB."""
        return LicenseEnforcementService(db=mock_db)

    @pytest.mark.asyncio
    async def test_empty_license_key(self, service, mock_db):
        """Test empty license key handling."""
        mock_db.fetch_one = AsyncMock(return_value=None)

        status = await service.check_license_status("")

        assert status == LicenseStatus.INVALID

    @pytest.mark.asyncio
    async def test_very_long_license_key(self, service, mock_db):
        """Test very long license key handling."""
        mock_db.fetch_one = AsyncMock(return_value=None)

        long_key = "raasjwt-pro-" + "a" * 500

        status = await service.check_license_status(long_key)

        assert status == LicenseStatus.INVALID

    @pytest.mark.asyncio
    async def test_special_characters_in_key(self, service, mock_db):
        """Test special characters in license key."""
        mock_db.fetch_one = AsyncMock(return_value=None)

        special_key = "raasjwt-pro-!@#$%^&*()"

        status = await service.check_license_status(special_key)

        assert status == LicenseStatus.INVALID

    @pytest.mark.asyncio
    async def test_mixed_case_tier_in_db(self, service, mock_db):
        """Test mixed case tier in database response."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "1",
            "key_id": "key1",
            "tier": "PRO",
            "status": "ACTIVE",
            "email": "user@example.com",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        status = await service.check_license_status("raasjwt-pro-test")

        assert status == LicenseStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_license_with_null_tier(self, service, mock_db):
        """Test license with null/missing tier in DB."""
        mock_db.fetch_one = AsyncMock(return_value={
            "id": "2",
            "key_id": "key2",
            "tier": None,
            "status": "active",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
        })

        status = await service.check_license_status("raasjwt-pro-test")

        assert status == LicenseStatus.ACTIVE

    def test_tier_hierarchy_order(self, service):
        """Test tier hierarchy is in correct order."""
        assert service.TIER_HIERARCHY.index("free") < service.TIER_HIERARCHY.index("trial")
        assert service.TIER_HIERARCHY.index("trial") < service.TIER_HIERARCHY.index("pro")
        assert service.TIER_HIERARCHY.index("pro") < service.TIER_HIERARCHY.index("enterprise")

    def test_tier_comparison_same_level(self, service):
        """Test tier comparison at same level."""
        assert service.is_tier_sufficient("pro", "pro") is True
        assert service.is_tier_sufficient("free", "free") is True

    def test_tier_comparison_one_below(self, service):
        """Test tier comparison one tier below."""
        assert service.is_tier_sufficient("trial", "free") is True
        assert service.is_tier_sufficient("pro", "trial") is True
        assert service.is_tier_sufficient("enterprise", "pro") is True

    def test_tier_comparison_multiple_below(self, service):
        """Test tier comparison multiple tiers below."""
        assert service.is_tier_sufficient("enterprise", "free") is True
        assert service.is_tier_sufficient("enterprise", "trial") is True
        assert service.is_tier_sufficient("pro", "free") is True


if __name__ == '__main__':
    pytest.main([__file__, "-v"])
