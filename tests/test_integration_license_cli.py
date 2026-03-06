"""
CLI Integration Tests for License Gate

Tests end-to-end license validation flow through CLI commands.
"""

import os
from typer.testing import CliRunner
from unittest.mock import patch

from src.main import app
from src.lib.raas_gate_validator import get_validator, validate_at_startup


runner = CliRunner()


class TestLicenseCLIIntegration:
    """Integration tests for license gating through CLI."""

    def test_version_command_without_license(self):
        """Test that version command works without license (free command)."""
        # Ensure no license key in env
        env = os.environ.copy()
        if "RAAS_LICENSE_KEY" in env:
            del env["RAAS_LICENSE_KEY"]

        result = runner.invoke(app, ["--version"])
        # Version command is free - should succeed
        assert result.exit_code == 0

    def test_cook_command_without_license_exits_with_error(self):
        """Test that cook command exits with error without license."""
        # Set up environment without valid license
        env = os.environ.copy()
        env["RAAS_LICENSE_KEY"] = ""

        with patch.dict(os.environ, env, clear=True):
            result = runner.invoke(app, ["cook", "test task"])
            # Should fail with license error
            assert result.exit_code != 0

    def test_license_generate_command(self):
        """Test license generate command."""
        result = runner.invoke(app, ["license", "generate", "--help"])
        assert result.exit_code == 0
        assert "--tier" in result.output
        assert "--email" in result.output

    def test_license_validate_command(self):
        """Test license validate command."""
        result = runner.invoke(app, ["license", "validate", "--help"])
        assert result.exit_code == 0
        assert "<key>" in result.output or "key" in result.output.lower()

    def test_license_status_command_without_key(self):
        """Test license status command fails without key."""
        result = runner.invoke(app, ["license", "status"])
        # Should fail since no key provided
        assert result.exit_code != 0
        assert "No license key" in result.output or result.exit_code == 1

    def test_license_tiers_command(self):
        """Test license tiers command shows available tiers."""
        result = runner.invoke(app, ["license", "tiers"])
        assert result.exit_code == 0
        assert "free" in result.output.lower() or "Free" in result.output

    def test_license_ui_command_help(self):
        """Test license-ui command shows help."""
        result = runner.invoke(app, ["license", "ui", "--help"])
        assert result.exit_code == 0
        assert "--host" in result.output or "--port" in result.output

    def test_license_usage_command(self):
        """Test license usage command."""
        result = runner.invoke(app, ["license", "usage", "--help"])
        assert result.exit_code == 0

    def test_license_revoke_command_help(self):
        """Test license revoke command shows help."""
        result = runner.invoke(app, ["license", "revoke", "--help"])
        assert result.exit_code == 0


class TestSetupTeardown:
    """Test fixtures for license CLI tests."""

    def setup_method(self):
        """Clean up environment before each test."""
        # Save and clear RAAS_LICENSE_KEY
        self._saved_key = os.environ.get("RAAS_LICENSE_KEY")
        if "RAAS_LICENSE_KEY" in os.environ:
            del os.environ["RAAS_LICENSE_KEY"]
        # Reset validator singleton
        validator = get_validator()
        validator._last_result = None

    def teardown_method(self):
        """Restore environment after each test."""
        # Restore original license key
        if self._saved_key:
            os.environ["RAAS_LICENSE_KEY"] = self._saved_key
        # Reset validator singleton
        validator = get_validator()
        validator._last_result = None


class TestLicenseValidationFlow:
    """Test license validation end-to-end flow."""

    def test_validate_at_startup_no_license(self):
        """Test validate_at_startup allows startup without license."""
        # Ensure no license
        if "RAAS_LICENSE_KEY" in os.environ:
            del os.environ["RAAS_LICENSE_KEY"]

        is_valid, error = validate_at_startup()
        # Should allow startup (free tier) even without license
        assert is_valid is True
        assert error is None

    def test_validator_returns_tier(self):
        """Test validator correctly identifies tier."""
        validator = get_validator()
        validator._last_result = {"tier": "pro", "features": ["premium_agents"]}

        assert validator.get_tier() == "pro"
        features = validator.get_features()
        assert "premium_agents" in features

    def test_validator_no_license_fallback(self):
        """Test validator fallback for missing license."""
        validator = get_validator()

        result = validator._fallback_validate(None)
        assert result["valid"] is False
        assert result["tier"] == "free"
        assert result.get("no_license") is True

    def test_validator_pro_key_format(self):
        """Test validator handles pro key format."""
        validator = get_validator()

        result = validator._fallback_validate("raas_pro_test123")
        assert result["valid"] is True
        assert result["tier"] == "pro"

    def test_validator_ent_key_format(self):
        """Test validator handles enterprise key format."""
        validator = get_validator()

        result = validator._fallback_validate("raas_ent_test123")
        assert result["valid"] is True
        assert result["tier"] == "enterprise"

    def test_validator_rpp_prefix(self):
        """Test validator handles RPP- prefix."""
        validator = get_validator()

        result = validator._fallback_validate("RPP-abc123def")
        assert result["valid"] is True
        assert result["tier"] == "pro"

    def test_validator_rep_prefix(self):
        """Test validator handles REP- prefix."""
        validator = get_validator()

        result = validator._fallback_validate("REP-abc123def")
        assert result["valid"] is True
        assert result["tier"] == "enterprise"
