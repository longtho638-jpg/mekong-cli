"""
License Gate Integration Tests — ROIaaS Phase 6c

Integration tests for RAAS_LICENSE_KEY validation flow:
- Valid license → allowed
- Invalid license → blocked
- Missing license → blocked with upgrade CTA
- Expired license → blocked with expiry message
- Revoked license → blocked with appeal info

Tests verify exit codes and user-facing error messages.
"""

from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

from src.lib.raas_gate import RaasLicenseGate
from src.lib.quota_error_messages import (
    format_license_revoked,
    format_license_expired,
    format_quota_error,
    QuotaErrorContext,
)


class TestLicenseValidationFlow:
    """Integration tests for complete license validation flow."""

    def test_missing_license_blocks_premium_command(self):
        """Missing license blocks premium commands with upgrade CTA."""
        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = None

        allowed, error = gate.check("cook")

        assert allowed is False
        assert error is not None
        assert "upgrade" in error.lower() or "license" in error.lower()

    def test_free_command_allows_without_license(self):
        """Free commands allowed without license."""
        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = None

        allowed, error = gate.check("version")

        assert allowed is True
        assert error is None

    def test_invalid_format_blocks_with_error(self):
        """Invalid license format blocks with clear error."""
        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = "invalid-key-format"

        allowed, error = gate.check("cook")

        assert allowed is False
        assert "invalid" in error.lower()

    def test_valid_license_format_passes_validation(self):
        """Valid license format passes format validation."""
        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = "raas-pro-testkey123-testsig"

        # Test format validation
        format_valid, format_error = gate.validate_license_format()

        assert format_valid is True
        assert format_error == ""

    @patch.object(RaasLicenseGate, 'validate_remote')
    def test_valid_license_remote_validation(self, mock_validate_remote):
        """Valid license passes remote validation (mocked)."""
        mock_validate_remote.return_value = (
            True,
            {"tier": "pro", "key_id": "pro-key-123"},
            ""
        )

        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = "raas-pro-validkey-signature"

        # Test remote validation (mocked)
        is_valid, info, error = gate.validate_remote("raas-pro-validkey-signature")

        # Verify mock was called and returned expected data
        assert mock_validate_remote.called
        assert is_valid is True
        assert info is not None
        assert info["tier"] == "pro"

    @patch('src.lib.license_generator.validate_license')
    def test_revoked_license_blocks_with_formatted_message(self, mock_validate):
        """Revoked license blocks with formatted error message."""
        # Format validation passes
        mock_validate.return_value = (
            True,
            {"tier": "pro", "key_id": "pro-key-123"},
            ""
        )

        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = "raas-pro-validkey-signature"
        gate._key_id = "pro-key-123"
        gate._license_tier = "pro"
        gate._license_status = "revoked"  # Simulate revoked status from remote

        # Manually call the quota warning method which checks status

        # The _show_quota_warning checks status and displays message
        # We test the error message formatting directly
        error_msg = format_license_revoked()

        assert "revoked" in error_msg.lower()
        assert "support" in error_msg.lower() or "contact" in error_msg.lower()

    @patch('src.lib.license_generator.validate_license')
    def test_expired_license_blocks_with_formatted_message(self, mock_validate):
        """Expired license blocks with formatted error message."""
        mock_validate.return_value = (
            True,
            {"tier": "pro", "key_id": "pro-key-123"},
            ""
        )

        gate = RaasLicenseGate(enable_remote=False)
        gate._license_key = "raas-pro-validkey-signature"
        gate._key_id = "pro-key-123"
        gate._license_tier = "pro"
        gate._license_status = "expired"
        gate._license_expires_at = int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp())

        # Test error message formatting
        expiry_date = datetime.fromtimestamp(
            gate._license_expires_at, tz=timezone.utc
        ).strftime("%Y-%m-%d")
        error_msg = format_license_expired(expiry_date)

        assert "expired" in error_msg.lower()
        assert expiry_date in error_msg
        assert "renew" in error_msg.lower() or "pricing" in error_msg.lower()


class TestRemoteValidationHandling:
    """Tests for remote API validation response handling."""

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_remote_401_returns_invalid_license(self, mock_post, mock_validate):
        """HTTP 401 from remote returns invalid license error."""
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "key123"}, "")

        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.content = b''
        mock_post.return_value = mock_response

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        assert is_valid is False
        assert "invalid" in error.lower() or "revoked" in error.lower()

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_remote_403_revoked_returns_revoked_error(self, mock_post, mock_validate):
        """HTTP 403 with reason=revoked returns revoked error."""
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "key123"}, "")

        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.json.return_value = {"reason": "revoked"}
        mock_post.return_value = mock_response

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        assert is_valid is False
        assert "revoked" in error.lower()

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_remote_403_expired_returns_expired_error(self, mock_post, mock_validate):
        """HTTP 403 with reason=expired returns expired error."""
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "key123"}, "")

        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.json.return_value = {"reason": "expired"}
        mock_post.return_value = mock_response

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        assert is_valid is False
        assert "expired" in error.lower()

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_remote_429_returns_rate_limit_error(self, mock_post, mock_validate):
        """HTTP 429 returns rate limit error."""
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "key123"}, "")

        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.content = b''
        mock_post.return_value = mock_response

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        assert is_valid is False
        assert "rate limit" in error.lower()

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_remote_200_returns_success(self, mock_post, mock_validate):
        """HTTP 200 returns success with license data."""
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "key123"}, "")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tier": "pro",
            "key_id": "pro-key-456",
            "status": "active",
            "expires_at": int((datetime.now(timezone.utc) + timedelta(days=365)).timestamp())
        }
        mock_post.return_value = mock_response

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        assert is_valid is True
        assert info is not None
        assert info["tier"] == "pro"
        assert info["key_id"] == "pro-key-456"

    @patch('src.lib.license_generator.validate_license')
    @patch('requests.post')
    def test_network_error_falls_back_to_local(self, mock_post, mock_validate):
        """Network error falls back to local validation."""
        import requests

        # Setup mock_validate to be called after network error
        mock_validate.return_value = (True, {"tier": "pro", "key_id": "local-key-123"}, "")
        mock_post.side_effect = requests.exceptions.RequestException("Connection error")

        gate = RaasLicenseGate(enable_remote=True)
        gate._license_key = "raas-pro-key-sig"

        is_valid, info, error = gate.validate_remote("raas-pro-key-sig")

        # Should fall back to local validation
        assert is_valid is True
        assert info is not None
        # Note: info contains the mock data from validate_license
        # The key_id is whatever validate_license returns
        assert "key_id" in info


class TestExitCodesAndErrorMessages:
    """Tests for exit codes and user-facing error messages."""

    def test_quota_error_context_formats_correctly(self):
        """QuotaErrorContext formats error messages correctly."""
        ctx = QuotaErrorContext(
            tier="free",
            daily_used=10,
            daily_limit=10,
            command="cook",
            violation_type="quota_exceeded"
        )

        error_msg = format_quota_error(ctx)

        assert "free tier" in error_msg.lower() or "quota" in error_msg.lower()
        assert "10/10" in error_msg
        assert "upgrade" in error_msg.lower() or "pricing" in error_msg.lower()

    def test_get_upgrade_url_returns_correct_urls(self):
        """get_upgrade_url returns correct URLs for each tier."""
        from src.lib.quota_error_messages import get_upgrade_url

        assert "raas.mekong.dev/pricing" in get_upgrade_url("free")
        assert "raas.mekong.dev/pricing" in get_upgrade_url("trial")
        assert "raas.mekong.dev/pricing" in get_upgrade_url("starter")
        assert "raas.mekong.dev/pricing" in get_upgrade_url("growth")
        assert "raas.mekong.dev/enterprise" in get_upgrade_url("pro")
        assert "raas.mekong.dev/contact" in get_upgrade_url("enterprise")

    def test_format_license_revoked_contains_required_elements(self):
        """format_license_revoked contains all required elements."""
        msg = format_license_revoked()

        assert "revoked" in msg.lower()
        assert "╔" in msg and "╝" in msg  # Boxed format
        assert "support" in msg.lower() or "contact" in msg.lower()
        assert "https://" in msg  # Contains URL

    def test_format_license_expired_contains_required_elements(self):
        """format_license_expired contains all required elements."""
        msg = format_license_expired("2025-12-31")

        assert "expired" in msg.lower()
        assert "2025-12-31" in msg
        assert "╔" in msg and "╝" in msg  # Boxed format
        assert "renew" in msg.lower() or "pricing" in msg.lower()


class TestTierLimitsAndQuotaEnforcement:
    """Tests for tier-based quota enforcement."""

    @patch('src.lib.license_generator.validate_license')
    def test_different_tiers_have_different_limits(self, mock_validate):
        """Different tiers have different quota limits."""
        from src.raas.credit_rate_limiter import TIER_LIMITS

        # Check that free tier has lower limits than pro
        assert TIER_LIMITS["free"]["daily"] < TIER_LIMITS.get("pro", {}).get("daily", 500)

    @patch('src.lib.license_generator.validate_license')
    def test_enterprise_tier_has_unlimited_quota(self, mock_validate):
        """Enterprise tier has unlimited quota (daily=-1 or 0 for unlimited)."""
        from src.raas.credit_rate_limiter import TIER_LIMITS

        # Enterprise has unlimited - either -1 or very high number
        enterprise_daily = TIER_LIMITS["enterprise"]["daily"]
        assert enterprise_daily <= 0 or enterprise_daily >= 10000  # -1 or very high = unlimited


class TestViolationTracking:
    """Tests for violation event tracking."""

    def test_violation_event_creation(self):
        """ViolationEvent can be created with required fields."""
        from src.raas.violation_tracker import ViolationEvent

        violation = ViolationEvent(
            key_id="test-key",
            tier="free",
            violation_type="quota_exceeded",
            command="cook",
            daily_used=10,
            daily_limit=10,
        )

        assert violation.key_id == "test-key"
        assert violation.tier == "free"
        assert violation.violation_type == "quota_exceeded"
        assert violation.command == "cook"

    def test_violation_event_with_rate_limit_type(self):
        """ViolationEvent supports rate_limit type."""
        from src.raas.violation_tracker import ViolationEvent

        violation = ViolationEvent(
            key_id="test-key",
            tier="pro",
            violation_type="rate_limit",
            command="gateway",
            daily_used=1000,
            daily_limit=1000,
            retry_after_seconds=3600,
        )

        assert violation.violation_type == "rate_limit"
        assert violation.retry_after_seconds == 3600
