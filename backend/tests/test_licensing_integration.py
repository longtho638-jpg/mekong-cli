"""
Integration Tests for License System

Tests the complete flow from generation to validation to renewal.
"""

import pytest
from datetime import datetime, timedelta

from backend.core.licensing import (
    LicenseGenerator,
    LicenseValidator,
    LicensePlan,
    LicenseStatus,
)


class TestEndToEndFlow:
    """Test complete license lifecycle"""

    def test_complete_license_lifecycle(self):
        """Test: Generate -> Validate -> Check Expiration -> Renew"""

        # STEP 1: Generate a license
        generator = LicenseGenerator()
        original_license = generator.generate(
            tenant_id="integration_test_customer",
            plan=LicensePlan.TEAM,
            duration_days=365,
            bound_domain="test.example.com",
        )

        assert original_license.license_key.startswith("AGY-integration_test_customer-")
        assert original_license.max_users == 5
        assert original_license.max_agents == 10
        print(f"✅ Step 1: License generated: {original_license.license_key}")

        # STEP 2: Validate the license
        validator = LicenseValidator()
        validation_result = validator.validate(
            license_key=original_license.license_key,
            domain="test.example.com",
            license_data=original_license,
        )

        assert validation_result.valid
        assert validation_result.license is not None
        print(f"✅ Step 2: License validated: {validation_result.reason}")

        # STEP 3: Check expiration status
        is_expired, days_remaining = validator.check_expiration(original_license)

        assert not is_expired
        assert days_remaining > 0
        assert days_remaining <= 365
        print(f"✅ Step 3: Expiration checked: {days_remaining} days remaining")

        # STEP 4: Check renewal warning
        is_renewal_due = validator.is_renewal_due(original_license, warning_days=400)

        assert is_renewal_due  # Should be due since license is only 365 days
        print(f"✅ Step 4: Renewal warning: {is_renewal_due}")

        # STEP 5: Renew the license
        renewed_license = generator.regenerate_with_same_checksum(original_license)

        assert renewed_license.tenant_id == original_license.tenant_id
        assert renewed_license.plan == original_license.plan
        assert renewed_license.expires_at > original_license.expires_at

        # Verify checksum is preserved
        orig_checksum = original_license.license_key.split("-")[3]
        renewed_checksum = renewed_license.license_key.split("-")[3]
        assert orig_checksum == renewed_checksum
        print(f"✅ Step 5: License renewed: {renewed_license.license_key}")

        # STEP 6: Validate renewed license
        renewed_validation = validator.validate(
            license_key=renewed_license.license_key,
            domain="test.example.com",
            license_data=renewed_license,
        )

        assert renewed_validation.valid
        print(f"✅ Step 6: Renewed license validated successfully")

    def test_domain_binding_enforcement(self):
        """Test: Domain binding prevents usage on wrong domain"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        # Generate license bound to specific domain
        license = generator.generate(
            tenant_id="domain_test_customer",
            plan=LicensePlan.SOLO,
            duration_days=365,
            bound_domain="authorized.example.com",
        )

        # Should succeed on correct domain
        result_valid = validator.validate(
            license.license_key,
            domain="authorized.example.com",
            license_data=license,
        )
        assert result_valid.valid

        # Should fail on wrong domain
        result_invalid = validator.validate(
            license.license_key,
            domain="unauthorized.example.com",
            license_data=license,
        )
        assert not result_invalid.valid
        assert "domain" in result_invalid.reason.lower()

    def test_hardware_binding_enforcement(self):
        """Test: Hardware binding prevents usage on different hardware"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        # Generate license bound to specific hardware
        license = generator.generate(
            tenant_id="hardware_test_customer",
            plan=LicensePlan.SOLO,
            duration_days=365,
            hardware_fingerprint="hw_authorized_12345",
        )

        # Should succeed on correct hardware
        result_valid = validator.validate(
            license.license_key,
            hardware_fingerprint="hw_authorized_12345",
            license_data=license,
        )
        assert result_valid.valid

        # Should fail on different hardware
        result_invalid = validator.validate(
            license.license_key,
            hardware_fingerprint="hw_unauthorized_67890",
            license_data=license,
        )
        assert not result_invalid.valid
        assert "hardware" in result_invalid.reason.lower()

    def test_expiration_flow(self):
        """Test: License expires and can be renewed"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        # Generate short-lived license
        license = generator.generate(
            tenant_id="expiration_test_customer",
            plan=LicensePlan.SOLO,
            duration_days=30,
        )

        # Force expiration by manipulating date
        license.expires_at = datetime.utcnow() - timedelta(days=1)

        # Validation should fail
        result = validator.validate(license.license_key, license_data=license)
        assert not result.valid
        assert "expired" in result.reason.lower()

        # Check expiration status
        is_expired, days_remaining = validator.check_expiration(license)
        assert is_expired
        assert days_remaining == 0

        # Renew the license
        renewed = generator.regenerate_with_same_checksum(license)

        # New expiration should be in the future
        assert renewed.expires_at > datetime.utcnow()

        # Validation should succeed now
        result = validator.validate(renewed.license_key, license_data=renewed)
        assert result.valid

    def test_multi_tier_feature_limits(self):
        """Test: Different tiers have different resource limits"""

        generator = LicenseGenerator()

        # Solo tier
        solo = generator.generate("solo_customer", LicensePlan.SOLO, 365)
        assert solo.max_users == 1
        assert solo.max_agents == 3
        assert "basic_ai" in solo.features
        assert "white_label" not in solo.features

        # Team tier
        team = generator.generate("team_customer", LicensePlan.TEAM, 365)
        assert team.max_users == 5
        assert team.max_agents == 10
        assert "advanced_ai" in team.features
        assert "multi_user" in team.features
        assert "white_label" not in team.features

        # Enterprise tier
        enterprise = generator.generate("enterprise_customer", LicensePlan.ENTERPRISE, 365)
        assert enterprise.max_users == 999
        assert enterprise.max_agents == 999
        assert "white_label" in enterprise.features
        assert "sla_support" in enterprise.features

    def test_validation_tracking(self):
        """Test: Validation events are tracked"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        license = generator.generate("tracking_customer", LicensePlan.SOLO, 365)

        # Initial state
        assert license.validation_count == 0
        assert license.last_validated_at is None

        # First validation
        validator.validate(license.license_key, license_data=license)
        assert license.validation_count == 1
        assert license.last_validated_at is not None
        first_validation_time = license.last_validated_at

        # Second validation
        validator.validate(license.license_key, license_data=license)
        assert license.validation_count == 2
        assert license.last_validated_at >= first_validation_time

    def test_revoked_license_cannot_be_used(self):
        """Test: Revoked licenses are rejected"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        license = generator.generate("revoked_customer", LicensePlan.TEAM, 365)

        # Should be valid initially
        result = validator.validate(license.license_key, license_data=license)
        assert result.valid

        # Revoke the license
        license.status = LicenseStatus.REVOKED

        # Should be rejected now
        result = validator.validate(license.license_key, license_data=license)
        assert not result.valid
        assert "revoked" in result.reason.lower()

    def test_checksum_tampering_detection(self):
        """Test: Modified checksums are detected"""

        generator = LicenseGenerator()
        validator = LicenseValidator()

        license = generator.generate("tamper_test", LicensePlan.SOLO, 365)
        original_key = license.license_key

        # Tamper with checksum
        parts = original_key.split("-")
        parts[3] = "TAMPERED"
        tampered_key = "-".join(parts)

        # Should be rejected
        result = validator.validate(tampered_key)
        assert not result.valid
        assert "checksum" in result.reason.lower()
