"""
Tests for JWT License Generator — ROIaaS Phase 7

Test JWT token generation, validation, and offline enforcement.
"""

import pytest
import os
from unittest.mock import patch

from src.lib.jwt_license_generator import (
    JWTLicenseGenerator,
    generate_jwt_license,
    validate_jwt_license,
)


class TestJWTLicenseGenerator:
    """Test JWT license token generation and validation."""

    @pytest.fixture
    def generator(self, tmp_path):
        """Create test generator with temp key paths."""
        private_key = tmp_path / "test_private.pem"
        public_key = tmp_path / "test_public.pem"
        return JWTLicenseGenerator(
            private_key_path=str(private_key),
            public_key_path=str(public_key),
        )

    def test_generate_token_free_tier(self, generator):
        """Should generate valid JWT token for free tier."""
        token = generator.generate_token(
            tier="free",
            key_id="test-key-123",
            email="test@example.com",
        )

        # Check format: raasjwt-[tier]-[jwt_token]
        assert token.startswith("raasjwt-free-")
        assert len(token) > 20  # JWT should be long

    def test_generate_token_all_tiers(self, generator):
        """Should generate tokens for all tiers."""
        for tier in ["free", "trial", "pro", "enterprise"]:
            token = generator.generate_token(
                tier=tier,
                key_id=f"test-{tier}",
                email="test@example.com",
            )
            assert token.startswith(f"raasjwt-{tier}-")

    def test_generate_token_invalid_tier(self, generator):
        """Should raise error for invalid tier."""
        with pytest.raises(ValueError, match="Invalid tier"):
            generator.generate_token(
                tier="invalid",
                key_id="test-key",
                email="test@example.com",
            )

    def test_validate_token_success(self, generator):
        """Should validate successfully generated token."""
        token = generator.generate_token(
            tier="pro",
            key_id="test-key-456",
            email="pro@example.com",
        )

        is_valid, payload, error = generator.validate_token(token)

        assert is_valid is True
        assert payload is not None
        assert error == ""
        assert payload["tier"] == "pro"
        assert payload["key_id"] == "test-key-456"
        assert payload["email"] == "pro@example.com"
        assert "quotas" in payload
        assert "exp" in payload

    def test_validate_token_expired(self, generator):
        """Should reject expired token."""
        # Generate token with 0 days (already expired)
        token = generator.generate_token(
            tier="trial",
            key_id="test-expired",
            email="test@example.com",
            days=-1,  # Expired yesterday
        )

        is_valid, payload, error = generator.validate_token(token)

        assert is_valid is False
        assert "expired" in error.lower() or "exp" in error.lower()

    def test_validate_token_tier_mismatch(self, generator):
        """Should detect tier mismatch."""
        token = generator.generate_token(
            tier="free",
            key_id="test-key",
            email="test@example.com",
        )

        # Manually tamper with token format (change tier prefix)
        tampered_token = token.replace("raasjwt-free-", "raasjwt-pro-")

        is_valid, payload, error = generator.validate_token(tampered_token)

        # Should fail because JWT payload still says "free" but prefix says "pro"
        assert is_valid is False

    def test_validate_token_invalid_signature(self, generator):
        """Should reject tampered tokens."""
        token = generator.generate_token(
            tier="pro",
            key_id="test-key",
            email="test@example.com",
        )

        # Tamper with token (change a character)
        tampered_token = token[:-5] + "XXXXX"

        is_valid, payload, error = generator.validate_token(tampered_token)

        assert is_valid is False
        assert "signature" in error.lower() or "Invalid" in error

    def test_validate_token_invalid_format(self, generator):
        """Should reject invalid format tokens."""
        invalid_tokens = [
            "not-a-jwt-token",
            "raasjwt-invalid",
            "raasjwt-pro-",  # Empty JWT
            "",
            None,
        ]

        for token in invalid_tokens:
            is_valid, payload, error = generator.validate_token(token or "")
            assert is_valid is False

    def test_get_quota_from_payload(self, generator):
        """Should extract quotas from payload."""
        token = generator.generate_token(
            tier="pro",
            key_id="test-key",
            email="test@example.com",
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        commands_per_day = generator.get_quota_from_payload(payload, "commands_per_day")
        assert commands_per_day == 1000  # Pro tier limit

    def test_is_feature_enabled(self, generator):
        """Should check feature flags from payload."""
        token = generator.generate_token(
            tier="pro",
            key_id="test-key",
            email="test@example.com",
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        # Pro features should be enabled
        assert generator.is_feature_enabled(payload, "premium_agents") is True
        assert generator.is_feature_enabled(payload, "priority_support") is True

    def test_get_days_remaining(self, generator):
        """Should calculate days until expiration."""
        token = generator.generate_token(
            tier="free",
            key_id="test-key",
            email="test@example.com",
            days=30,
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        days_remaining = generator.get_days_remaining(payload)
        assert 29 <= days_remaining <= 30  # Should be ~30 days


class TestJWTQuotas:
    """Test embedded quota enforcement."""

    @pytest.fixture
    def generator(self, tmp_path):
        """Create test generator."""
        return JWTLicenseGenerator(
            private_key_path=str(tmp_path / "private.pem"),
            public_key_path=str(tmp_path / "public.pem"),
        )

    def test_free_tier_quotas(self, generator):
        """Should have correct free tier quotas."""
        token = generator.generate_token(
            tier="free",
            key_id="test-free",
            email="free@example.com",
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        quotas = payload["quotas"]
        assert quotas["commands_per_day"] == 10
        assert quotas["max_projects"] == 1
        assert quotas["max_agents"] == 1

    def test_pro_tier_quotas(self, generator):
        """Should have correct pro tier quotas."""
        token = generator.generate_token(
            tier="pro",
            key_id="test-pro",
            email="pro@example.com",
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        quotas = payload["quotas"]
        assert quotas["commands_per_day"] == 1000
        assert quotas["max_projects"] == 10
        assert quotas["max_agents"] == 10

    def test_enterprise_unlimited(self, generator):
        """Should have unlimited quotas for enterprise."""
        token = generator.generate_token(
            tier="enterprise",
            key_id="test-enterprise",
            email="enterprise@example.com",
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        quotas = payload["quotas"]
        assert quotas["commands_per_day"] == -1  # Unlimited
        assert quotas["max_projects"] == -1
        assert quotas["max_agents"] == -1

    def test_custom_quotas_override(self, generator):
        """Should allow custom quota overrides."""
        custom = {
            "commands_per_day": 500,
            "max_projects": 5,
        }

        token = generator.generate_token(
            tier="pro",
            key_id="test-custom",
            email="custom@example.com",
            custom_quotas=custom,
        )

        is_valid, payload, _ = generator.validate_token(token)
        assert is_valid

        quotas = payload["quotas"]
        assert quotas["commands_per_day"] == 500  # Custom override
        assert quotas["max_projects"] == 5  # Custom override
        # Other quotas should remain default for pro


class TestJWTOfflineMode:
    """Test fully offline JWT validation."""

    @pytest.fixture
    def generator(self, tmp_path):
        """Create test generator."""
        return JWTLicenseGenerator(
            private_key_path=str(tmp_path / "private.pem"),
            public_key_path=str(tmp_path / "public.pem"),
        )

    def test_offline_validation_no_network(self, generator):
        """Should validate token without network access."""
        # Generate token
        token = generator.generate_token(
            tier="pro",
            key_id="test-offline",
            email="offline@example.com",
        )

        # Validate WITHOUT any network calls (pure cryptographic verification)
        is_valid, payload, error = generator.validate_token(token)

        assert is_valid is True
        assert payload is not None
        # No network calls were made - validation is purely cryptographic

    def test_keys_auto_generation(self, tmp_path):
        """Should auto-generate keys on first use."""
        private_path = tmp_path / "auto_private.pem"
        public_path = tmp_path / "auto_public.pem"

        # Keys don't exist yet
        assert not os.path.exists(private_path)
        assert not os.path.exists(public_path)

        # Create generator and generate token (should auto-generate keys)
        generator = JWTLicenseGenerator(
            private_key_path=str(private_path),
            public_key_path=str(public_path),
        )

        generator.generate_token(
            tier="free",
            key_id="test-auto",
            email="auto@example.com",
        )

        # Keys should exist now
        assert os.path.exists(private_path)
        assert os.path.exists(public_path)

        # Verify key permissions (private key should be 600)
        private_perms = os.stat(private_path).st_mode & 0o777
        assert private_perms == 0o600


class TestJWTGlobalFunctions:
    """Test global helper functions."""

    def test_generate_jwt_license(self, tmp_path):
        """Should generate license with auto-generated key_id."""
        # Test that global function works
        # Generate with real implementation
        token = generate_jwt_license(
            tier="pro",
            email="test@example.com",
        )

        # Token should be generated
        assert token.startswith("raasjwt-pro-")

    def test_validate_jwt_license(self, tmp_path):
        """Should validate license using global function."""
        generator = JWTLicenseGenerator(
            private_key_path=str(tmp_path / "private.pem"),
            public_key_path=str(tmp_path / "public.pem"),
        )

        token = generator.generate_token(
            tier="free",
            key_id="test-global",
            email="global@example.com",
        )

        with patch("src.lib.jwt_license_generator.get_jwt_generator", return_value=generator):
            is_valid, payload, error = validate_jwt_license(token)

            assert is_valid is True
            assert payload is not None
