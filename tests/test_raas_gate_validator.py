"""
Unit Tests for RAAS License Gate Validator
"""

import os
import pytest
from unittest.mock import patch, MagicMock

from src.lib.raas_gate_validator import (
    RaasGateValidator,
    get_validator,
    validate_at_startup,
    require_valid_license,
    LicenseValidationError,
)


class TestRaasGateValidator:
    """Test RaasGateValidator class."""

    def setup_method(self):
        self.validator = RaasGateValidator()
        self.validator._last_result = None

    def test_fallback_validate_no_license(self):
        result = self.validator._fallback_validate(None)
        assert result["valid"] is False
        assert result["tier"] == "free"
        assert result["no_license"] is True

    def test_fallback_validate_pro_license(self):
        result = self.validator._fallback_validate("raas_pro_abc123def456789")
        assert result["valid"] is True
        assert result["tier"] == "pro"

    def test_fallback_validate_enterprise_license(self):
        result = self.validator._fallback_validate("raas_ent_xyz789abc123456")
        assert result["valid"] is True
        assert result["tier"] == "enterprise"

    def test_fallback_validate_rep_prefix(self):
        result = self.validator._fallback_validate("REP-abc123def456789")
        assert result["tier"] == "enterprise"

    def test_fallback_validate_rpp_prefix(self):
        result = self.validator._fallback_validate("RPP-abc123def456789")
        assert result["tier"] == "pro"

    def test_get_features_for_tier(self):
        free_features = self.validator._get_features_for_tier("free")
        pro_features = self.validator._get_features_for_tier("pro")
        assert "basic_cli_commands" in free_features
        assert len(pro_features) > len(free_features)

    def test_validate_no_license(self):
        with patch.object(self.validator, '_run_validator') as mock_run:
            mock_run.return_value = {
                "valid": False,
                "tier": "free",
                "features": ["basic_cli_commands"],
                "no_license": True,
            }
            is_valid, error = self.validator.validate()
            assert is_valid is True
            assert error is None

    def test_validate_valid_license(self):
        with patch.object(self.validator, '_run_validator') as mock_run:
            mock_run.return_value = {
                "valid": True,
                "tier": "pro",
                "features": ["premium_agents"],
                "error": None,
            }
            is_valid, error = self.validator.validate()
            assert is_valid is True
            assert error is None

    def test_validate_invalid_license(self):
        with patch.object(self.validator, '_run_validator') as mock_run:
            mock_run.return_value = {
                "valid": False,
                "tier": "free",
                "features": [],
                "error": "Invalid license format",
            }
            is_valid, error = self.validator.validate()
            assert is_valid is False
            assert error is not None

    def test_get_tier_default(self):
        assert self.validator.get_tier() == "free"

    def test_get_tier_after_validation(self):
        self.validator._last_result = {"tier": "pro"}
        assert self.validator.get_tier() == "pro"

    def test_get_features_after_validation(self):
        self.validator._last_result = {"features": ["feature1", "feature2"]}
        features = self.validator.get_features()
        assert features == ["feature1", "feature2"]


class TestValidateAtStartup:
    """Test validate_at_startup function."""

    def test_validate_at_startup_no_license(self):
        with patch('src.lib.raas_gate_validator.get_validator') as mock_get:
            mock_validator = MagicMock()
            mock_validator.validate.return_value = (True, None)
            mock_get.return_value = mock_validator
            is_valid, error = validate_at_startup()
            assert is_valid is True
            assert error is None

    def test_validate_at_startup_invalid_license(self):
        with patch('src.lib.raas_gate_validator.get_validator') as mock_get:
            mock_validator = MagicMock()
            mock_validator.validate.return_value = (False, "Invalid license")
            mock_get.return_value = mock_validator
            is_valid, error = validate_at_startup()
            assert is_valid is False
            assert error == "Invalid license"


class TestRequireValidLicense:
    """Test require_valid_license function."""

    def test_require_valid_license_success(self):
        with patch('src.lib.raas_gate_validator.validate_at_startup') as mock_validate:
            mock_validate.return_value = (True, None)
            require_valid_license()

    def test_require_valid_license_failure(self):
        with patch('src.lib.raas_gate_validator.validate_at_startup') as mock_validate:
            mock_validate.return_value = (False, "Invalid license")
            with pytest.raises(SystemExit) as exc_info:
                require_valid_license()
            assert exc_info.value.code == 1


class TestLicenseValidationError:
    """Test LicenseValidationError exception."""

    def test_exception_creation(self):
        exc = LicenseValidationError("Test error", tier="pro", error_code="invalid_format")
        assert str(exc) == "Test error"
        assert exc.tier == "pro"
        assert exc.error_code == "invalid_format"

    def test_exception_default_values(self):
        exc = LicenseValidationError("Simple error")
        assert exc.tier == "free"
        assert exc.error_code == "unknown"


class TestIntegration:
    """Integration tests - mocked to avoid Node.js subprocess."""

    def test_full_flow_no_license(self):
        validator = RaasGateValidator()
        with patch.object(validator, '_run_validator') as mock_run:
            mock_run.return_value = {
                "valid": False,
                "tier": "free",
                "features": ["basic_cli_commands"],
                "no_license": True,
            }
            is_valid, error = validator.validate()
            assert is_valid is True

    def test_full_flow_with_pro_license(self):
        validator = RaasGateValidator()
        with patch.object(validator, '_run_validator') as mock_run:
            mock_run.return_value = {
                "valid": True,
                "tier": "pro",
                "features": ["premium_agents"],
                "error": None,
            }
            is_valid, error = validator.validate()
            assert is_valid is True

    def test_singleton_pattern(self):
        validator1 = get_validator()
        validator2 = get_validator()
        assert validator1 is validator2
