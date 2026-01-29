"""
Unit Tests for License System

Tests license generation, validation, and expiration handling.
"""

from datetime import datetime, timedelta

import pytest

from backend.core.licensing import (
    License,
    LicenseGenerator,
    LicensePlan,
    LicenseStatus,
    LicenseValidator,
)


class TestLicenseGenerator:
    """Test suite for LicenseGenerator"""

    def test_generate_solo_license(self):
        """Test generating a Solo plan license"""
        generator = LicenseGenerator()
        license = generator.generate("tenant_solo", LicensePlan.SOLO, 365)

        assert license.license_key.startswith("AGY-tenant_solo-")
        assert license.tenant_id == "tenant_solo"
        assert license.plan == LicensePlan.SOLO
        assert license.max_users == 1
        assert license.max_agents == 3
        assert license.max_activations == 3
        assert "basic_ai" in license.features
        assert license.status == LicenseStatus.ACTIVE

    def test_generate_team_license(self):
        """Test generating a Team plan license"""
        generator = LicenseGenerator()
        license = generator.generate("tenant_team", LicensePlan.TEAM, 365)

        assert license.plan == LicensePlan.TEAM
        assert license.max_users == 5
        assert license.max_agents == 10
        assert license.max_activations == 10
        assert "advanced_ai" in license.features
        assert "multi_user" in license.features

    def test_generate_enterprise_license(self):
        """Test generating an Enterprise plan license"""
        generator = LicenseGenerator()
        license = generator.generate("tenant_enterprise", LicensePlan.ENTERPRISE, 365)

        assert license.plan == LicensePlan.ENTERPRISE
        assert license.max_users == 999
        assert license.max_agents == 999
        assert license.max_activations == 9999
        assert "white_label" in license.features
        assert "sla_support" in license.features

    def test_license_key_format(self):
        """Test license key follows correct format"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.SOLO, 365)

        parts = license.license_key.split("-")
        assert len(parts) == 4
        assert parts[0] == "AGY"
        assert parts[1] == "test_tenant"
        assert len(parts[2]) == 8  # YYYYMMDD
        assert len(parts[3]) == 8  # Checksum

    def test_expiration_calculation(self):
        """Test expiration date is calculated correctly"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.SOLO, 30)

        now = datetime.utcnow()
        expected_expiry = now + timedelta(days=30)

        # Allow 1 second tolerance
        assert abs((license.expires_at - expected_expiry).total_seconds()) < 1

    def test_hardware_binding(self):
        """Test license can be bound to hardware"""
        generator = LicenseGenerator()
        license = generator.generate(
            "test_tenant",
            LicensePlan.SOLO,
            365,
            bound_domain="example.com",
            hardware_fingerprint="hw_abc123",
        )

        assert license.bound_domain == "example.com"
        assert license.hardware_fingerprint == "hw_abc123"

    def test_checksum_deterministic(self):
        """Test checksum is deterministic (same input = same checksum)"""
        generator = LicenseGenerator()

        # Generate two licenses with same parameters
        license1 = generator.generate("tenant_123", LicensePlan.SOLO, 365)
        license2 = generator.generate("tenant_123", LicensePlan.SOLO, 365)

        # Extract checksums
        checksum1 = license1.license_key.split("-")[3]
        checksum2 = license2.license_key.split("-")[3]

        # Should be identical (same tenant, same timestamp)
        assert checksum1 == checksum2


class TestLicenseValidator:
    """Test suite for LicenseValidator"""

    def test_validate_valid_license(self):
        """Test validating a valid license"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.TEAM, 365)

        validator = LicenseValidator()
        result = validator.validate(license.license_key, license_data=license)

        assert result.valid
        assert "valid" in result.reason.lower()
        assert result.license is not None

    def test_validate_invalid_format(self):
        """Test validating license with invalid format"""
        validator = LicenseValidator()
        result = validator.validate("INVALID-LICENSE")

        assert not result.valid
        assert "format" in result.reason.lower()

    def test_validate_invalid_prefix(self):
        """Test validating license with wrong prefix"""
        validator = LicenseValidator()
        result = validator.validate("WRONG-tenant123-20260127-abc123")

        assert not result.valid
        assert "prefix" in result.reason.lower()

    def test_validate_invalid_checksum(self):
        """Test validating license with invalid checksum"""
        validator = LicenseValidator()
        result = validator.validate("AGY-tenant123-20260127-BADHASH")

        assert not result.valid
        assert "checksum" in result.reason.lower()

    def test_validate_expired_license(self):
        """Test validating an expired license"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.SOLO, 1)

        # Force expiration
        license.expires_at = datetime.utcnow() - timedelta(days=1)

        validator = LicenseValidator()
        result = validator.validate(license.license_key, license_data=license)

        assert not result.valid
        assert "expired" in result.reason.lower()

    def test_validate_revoked_license(self):
        """Test validating a revoked license"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.SOLO, 365)
        license.status = LicenseStatus.REVOKED

        validator = LicenseValidator()
        result = validator.validate(license.license_key, license_data=license)

        assert not result.valid
        assert "revoked" in result.reason.lower()

    def test_validate_domain_binding(self):
        """Test domain binding enforcement"""
        generator = LicenseGenerator()
        license = generator.generate(
            "test_tenant", LicensePlan.SOLO, 365, bound_domain="example.com"
        )

        validator = LicenseValidator()

        # Valid domain
        result = validator.validate(license.license_key, domain="example.com", license_data=license)
        assert result.valid

        # Invalid domain
        result = validator.validate(license.license_key, domain="wrong.com", license_data=license)
        assert not result.valid
        assert "domain" in result.reason.lower()

    def test_validate_hardware_binding(self):
        """Test hardware binding enforcement"""
        generator = LicenseGenerator()
        license = generator.generate(
            "test_tenant",
            LicensePlan.SOLO,
            365,
            hardware_fingerprint="hw_correct",
        )

        validator = LicenseValidator()

        # Valid hardware
        result = validator.validate(
            license.license_key, hardware_fingerprint="hw_correct", license_data=license
        )
        assert result.valid

        # Invalid hardware
        result = validator.validate(
            license.license_key, hardware_fingerprint="hw_wrong", license_data=license
        )
        assert not result.valid
        assert "hardware" in result.reason.lower()

    def test_check_expiration(self):
        """Test expiration checking"""
        generator = LicenseGenerator()
        validator = LicenseValidator()

        # Active license
        license_active = generator.generate("test_tenant", LicensePlan.SOLO, 30)
        is_expired, days_remaining = validator.check_expiration(license_active)

        assert not is_expired
        assert days_remaining > 0
        assert days_remaining <= 30

        # Expired license
        license_expired = generator.generate("test_tenant", LicensePlan.SOLO, 1)
        license_expired.expires_at = datetime.utcnow() - timedelta(days=1)

        is_expired, days_remaining = validator.check_expiration(license_expired)

        assert is_expired
        assert days_remaining == 0

    def test_is_renewal_due(self):
        """Test renewal warning logic"""
        generator = LicenseGenerator()
        validator = LicenseValidator()

        # License expiring in 15 days (within 30-day warning)
        license_soon = generator.generate("test_tenant", LicensePlan.SOLO, 15)
        assert validator.is_renewal_due(license_soon, warning_days=30)

        # License expiring in 60 days (outside 30-day warning)
        license_later = generator.generate("test_tenant", LicensePlan.SOLO, 60)
        assert not validator.is_renewal_due(license_later, warning_days=30)

    def test_extract_tenant_id(self):
        """Test extracting tenant ID from license key"""
        generator = LicenseGenerator()
        license = generator.generate("tenant_extract", LicensePlan.SOLO, 365)

        validator = LicenseValidator()
        tenant_id = validator.extract_tenant_id(license.license_key)

        assert tenant_id == "tenant_extract"

    def test_extract_tenant_id_invalid_key(self):
        """Test extracting tenant ID from invalid key"""
        validator = LicenseValidator()
        tenant_id = validator.extract_tenant_id("INVALID-KEY")

        assert tenant_id is None

    def test_validation_tracking(self):
        """Test validation count and last_validated tracking"""
        generator = LicenseGenerator()
        license = generator.generate("test_tenant", LicensePlan.SOLO, 365)

        validator = LicenseValidator()

        # Initial state
        assert license.validation_count == 0
        assert license.last_validated_at is None

        # First validation
        validator.validate(license.license_key, license_data=license)
        assert license.validation_count == 1
        assert license.last_validated_at is not None

        # Second validation
        validator.validate(license.license_key, license_data=license)
        assert license.validation_count == 2


class TestLicenseRenewal:
    """Test suite for license renewal"""

    def test_regenerate_with_same_checksum(self):
        """Test license renewal preserves checksum"""
        generator = LicenseGenerator()
        original = generator.generate("tenant_renew", LicensePlan.TEAM, 365)

        # Renew
        renewed = generator.regenerate_with_same_checksum(original)

        # Extract checksums
        original_checksum = original.license_key.split("-")[3]
        renewed_checksum = renewed.license_key.split("-")[3]

        # Checksum should be preserved
        assert original_checksum == renewed_checksum

        # Expiration should be extended
        assert renewed.expires_at > original.expires_at

        # Other properties should match
        assert renewed.tenant_id == original.tenant_id
        assert renewed.plan == original.plan

    def test_invalid_key_format_raises_error(self):
        """Test renewal fails for invalid key format"""
        generator = LicenseGenerator()
        invalid_license = License(
            license_key="INVALID-KEY",
            tenant_id="test",
            plan=LicensePlan.SOLO,
            expires_at=datetime.utcnow() + timedelta(days=365),
        )

        with pytest.raises(ValueError, match="Invalid license key format"):
            generator.regenerate_with_same_checksum(invalid_license)


class TestSecurityFeatures:
    """Test security features"""

    def test_different_salts_produce_different_checksums(self):
        """Test different salts produce different checksums"""
        generator1 = LicenseGenerator(secret_salt="SALT_1")
        generator2 = LicenseGenerator(secret_salt="SALT_2")

        license1 = generator1.generate("tenant", LicensePlan.SOLO, 365)
        license2 = generator2.generate("tenant", LicensePlan.SOLO, 365)

        checksum1 = license1.license_key.split("-")[3]
        checksum2 = license2.license_key.split("-")[3]

        # Different salts = different checksums
        assert checksum1 != checksum2

    def test_validator_requires_matching_salt(self):
        """Test validator requires matching salt"""
        generator = LicenseGenerator(secret_salt="CORRECT_SALT")
        license = generator.generate("tenant", LicensePlan.SOLO, 365)

        # Validator with wrong salt
        validator_wrong = LicenseValidator(secret_salt="WRONG_SALT")
        result = validator_wrong.validate(license.license_key)

        assert not result.valid
        assert "checksum" in result.reason.lower()

        # Validator with correct salt
        validator_correct = LicenseValidator(secret_salt="CORRECT_SALT")
        result = validator_correct.validate(license.license_key)

        assert result.valid
