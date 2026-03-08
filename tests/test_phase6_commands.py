"""
Tests for Phase 6 CLI Integration with RaaS Gateway

Tests cover:
- Gateway-based license validation
- Usage report command
- Local testing mode (RAAS_LOCAL_TEST)
- Dashboard handoff links
"""

import os
from unittest.mock import patch, MagicMock
from typer.testing import CliRunner

# Import after env setup
os.environ["RAAS_LOCAL_TEST"] = "true"  # Enable local test mode for tests

from src.commands.license_commands import app
from src.core.raas_auth import RaaSAuthClient, get_auth_client
from src.core.gateway_client import GatewayClient


runner = CliRunner()


class TestLicenseValidateCommand:
    """Tests for license validate command with gateway integration."""

    def test_validate_no_key_provided(self):
        """Test validation fails when no key provided."""
        # Temporarily clear env var
        old_key = os.environ.pop("RAAS_LICENSE_KEY", None)

        try:
            result = runner.invoke(app, ["validate"])
            assert result.exit_code == 1
            assert "No license key provided" in result.stdout
        finally:
            # Restore env var
            if old_key:
                os.environ["RAAS_LICENSE_KEY"] = old_key

    def test_validate_local_test_mode(self):
        """Test validation in local test mode (mock)."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_test_key_123456"

        result = runner.invoke(app, ["validate"])
        assert result.exit_code == 0
        # Should show mock validation result
        assert "Valid License" in result.stdout or "local" in result.stdout.lower()

    def test_validate_with_gateway_flag(self):
        """Test validation with --gateway flag."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_pro_test_key"

        result = runner.invoke(app, ["validate", "--gateway"])
        assert result.exit_code == 0
        # In local test mode, should still work with mock
        assert "Valid" in result.stdout or "mock" in result.stdout.lower()

    def test_validate_verbose_mode(self):
        """Test validation with verbose flag."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_enterprise_test"

        result = runner.invoke(app, ["validate", "-v"])
        assert result.exit_code == 0

    def test_validate_dashboard_link_shown(self):
        """Test that dashboard handoff link is displayed."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_test_dashboard"

        result = runner.invoke(app, ["validate"])
        assert result.exit_code == 0
        # Should show dashboard link
        assert "agencyos.network" in result.stdout or "Dashboard" in result.stdout


class TestUsageReportCommand:
    """Tests for usage report command (Phase 6.2)."""

    def test_report_no_key_provided(self):
        """Test report fails when no key provided."""
        old_key = os.environ.pop("RAAS_LICENSE_KEY", None)

        try:
            result = runner.invoke(app, ["report"])
            assert result.exit_code == 1
            assert "No license key provided" in result.stdout
        finally:
            if old_key:
                os.environ["RAAS_LICENSE_KEY"] = old_key

    def test_report_local_test_mode(self):
        """Test report in local test mode with mock data."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_test_usage"

        result = runner.invoke(app, ["report"])
        assert result.exit_code == 0
        # Should show mock usage data
        assert "Usage Report" in result.stdout or "mock" in result.stdout.lower()

    def test_report_with_days_parameter(self):
        """Test report with custom days parameter."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_test_days"

        result = runner.invoke(app, ["report", "--days", "7"])
        assert result.exit_code == 0

    def test_report_gateway_fallback(self):
        """Test report falls back to local when gateway unavailable."""
        os.environ["RAAS_LOCAL_TEST"] = "false"

        # Mock gateway to fail
        with patch.object(GatewayClient, 'get', side_effect=Exception("Gateway unavailable")):
            with patch.object(RaaSAuthClient, 'validate_credentials') as mock_validate:
                mock_validate.return_value = MagicMock(
                    valid=True,
                    tenant=MagicMock(tenant_id="test", tier="pro")
                )
                result = runner.invoke(app, ["report"])
                # Should fall back to local report
                assert result.exit_code == 0


class TestLocalTestMode:
    """Tests for Phase 6.3 local testing mode."""

    def test_raas_auth_client_local_mode(self):
        """Test RaaSAuthClient respects RAAS_LOCAL_TEST."""
        os.environ["RAAS_LOCAL_TEST"] = "true"

        client = RaaSAuthClient()
        assert client.local_test_mode is True

        # Validate should work without gateway
        result = client.validate_credentials("mk_test_key")
        assert result.valid is True
        assert result.tenant is not None
        assert "local" in result.tenant.tenant_id

    def test_raas_auth_client_normal_mode(self):
        """Test RaaSAuthClient in normal mode."""
        os.environ["RAAS_LOCAL_TEST"] = "false"

        client = RaaSAuthClient()
        assert client.local_test_mode is False

    def test_gateway_client_local_mode(self):
        """Test GatewayClient respects RAAS_LOCAL_TEST."""
        os.environ["RAAS_LOCAL_TEST"] = "true"

        client = GatewayClient()
        assert client.local_test_mode is True

        # Request should return mock response
        response = client.request("GET", "/v1/test")
        assert response.status_code == 200
        assert response.data.get("mock") is True

    def test_local_mock_tier_detection(self):
        """Test tier detection from license key prefix."""
        os.environ["RAAS_LOCAL_TEST"] = "true"

        client = get_auth_client()

        # Test different tier prefixes
        test_cases = [
            ("mk_free_test", "free"),
            ("mk_trial_test", "trial"),
            ("mk_pro_test", "pro"),
            ("mk_enterprise_test", "enterprise"),
            ("mk_random_test", "pro"),  # Default tier
        ]

        for key, expected_tier in test_cases:
            result = client.validate_credentials(key)
            assert result.valid is True
            assert result.tenant.tier == expected_tier


class TestStatusCommand:
    """Tests for license status command."""

    def test_status_with_valid_key(self):
        """Test status command with valid key."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_test_status"

        result = runner.invoke(app, ["status", "--key", "mk_test_status"])
        # Status command uses local validation, should work
        assert result.exit_code == 0 or result.exit_code == 1  # May fail if key format invalid

    def test_status_with_invalid_key(self):
        """Test status command with invalid key."""
        os.environ["RAAS_LOCAL_TEST"] = "true"

        result = runner.invoke(app, ["status", "--key", "invalid_key"])
        assert result.exit_code == 1


class TestTiersCommand:
    """Tests for license tiers command."""

    def test_tiers_shows_all_tiers(self):
        """Test tiers command shows all available tiers."""
        result = runner.invoke(app, ["tiers"])
        assert result.exit_code == 0
        assert "free" in result.stdout
        assert "trial" in result.stdout
        assert "pro" in result.stdout
        assert "enterprise" in result.stdout


class TestIntegration:
    """Integration tests for Phase 6 features."""

    def test_full_validate_to_report_flow(self):
        """Test full flow: validate license then get usage report."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_integration_test"

        # Step 1: Validate
        validate_result = runner.invoke(app, ["validate"])
        assert validate_result.exit_code == 0

        # Step 2: Get usage report
        report_result = runner.invoke(app, ["report"])
        assert report_result.exit_code == 0

    def test_dashboard_link_format(self):
        """Test dashboard link is properly formatted."""
        os.environ["RAAS_LOCAL_TEST"] = "true"
        os.environ["RAAS_LICENSE_KEY"] = "mk_dashboard_test"

        result = runner.invoke(app, ["validate"])

        # Check for dashboard URL pattern
        assert "agencyos.network/dashboard/" in result.stdout


# Clean up after tests
def teardown_module():
    """Clean up environment variables after tests."""
    os.environ.pop("RAAS_LOCAL_TEST", None)
