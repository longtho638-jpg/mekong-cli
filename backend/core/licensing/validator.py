"""
License Validator

Validates license keys, checks expiration, and enforces hardware binding.
"""

import hashlib
from datetime import datetime
from typing import Optional, Tuple

from .models import License, LicenseStatus


class ValidationResult:
    """Result of license validation"""

    def __init__(self, valid: bool, reason: str, license: Optional[License] = None):
        self.valid = valid
        self.reason = reason
        self.license = license

    def __bool__(self):
        return self.valid

    def __repr__(self):
        return f"ValidationResult(valid={self.valid}, reason={self.reason})"


class LicenseValidator:
    """
    Validates license keys and enforces restrictions.

    Features:
    - Checksum verification
    - Expiration checking
    - Hardware binding enforcement
    - Usage tracking
    """

    SECRET_SALT = "AGENCYOS_LICENSE_SALT_2026"  # Must match generator

    def __init__(self, secret_salt: Optional[str] = None):
        """
        Initialize the validator.

        Args:
            secret_salt: Optional custom salt (must match generator)
        """
        self.salt = secret_salt or self.SECRET_SALT

    def validate(
        self,
        license_key: str,
        domain: Optional[str] = None,
        hardware_fingerprint: Optional[str] = None,
        license_data: Optional[License] = None,
    ) -> ValidationResult:
        """
        Validate a license key.

        Args:
            license_key: License key to validate
            domain: Current domain (for binding check)
            hardware_fingerprint: Current hardware ID (for binding check)
            license_data: Optional full license object from database

        Returns:
            ValidationResult with validation status and reason

        Example:
            >>> validator = LicenseValidator()
            >>> result = validator.validate("AGY-tenant123-20260127-abc123")
            >>> if result.valid:
            ...     print("License valid!")
        """

        # Parse license key
        try:
            parts = license_key.split("-")
            if len(parts) != 4:
                return ValidationResult(False, "Invalid license key format")

            prefix, tenant_id, timestamp, checksum = parts

            if prefix != "AGY":
                return ValidationResult(False, "Invalid license prefix")

        except Exception as e:
            return ValidationResult(False, f"Parse error: {str(e)}")

        # Verify checksum
        expected_checksum = self._generate_checksum(tenant_id, timestamp)
        if checksum != expected_checksum:
            return ValidationResult(False, "Invalid checksum - license may be tampered")

        # If full license data is provided, perform additional checks
        if license_data:
            # Check status
            if license_data.status == LicenseStatus.REVOKED:
                return ValidationResult(False, "License has been revoked")

            if license_data.status == LicenseStatus.EXPIRED:
                return ValidationResult(False, "License has expired")

            # Check expiration date
            if datetime.utcnow() > license_data.expires_at:
                return ValidationResult(False, "License has expired")

            # Check hardware binding
            if license_data.bound_domain and domain:
                if license_data.bound_domain != domain:
                    return ValidationResult(
                        False,
                        f"License bound to different domain: {license_data.bound_domain}",
                    )

            if license_data.hardware_fingerprint and hardware_fingerprint:
                if license_data.hardware_fingerprint != hardware_fingerprint:
                    return ValidationResult(
                        False, "License bound to different hardware"
                    )

            # Update validation tracking
            license_data.last_validated_at = datetime.utcnow()
            license_data.validation_count += 1

            return ValidationResult(True, "License valid", license_data)

        # Basic validation without full data
        return ValidationResult(True, "License format valid (basic check)")

    def check_expiration(self, license: License) -> Tuple[bool, int]:
        """
        Check if license is expired and days remaining.

        Args:
            license: License object

        Returns:
            Tuple of (is_expired, days_remaining)
        """
        now = datetime.utcnow()
        is_expired = now > license.expires_at

        if is_expired:
            return True, 0

        days_remaining = (license.expires_at - now).days
        return False, days_remaining

    def is_renewal_due(self, license: License, warning_days: int = 30) -> bool:
        """
        Check if license renewal is due soon.

        Args:
            license: License object
            warning_days: Days before expiration to trigger warning

        Returns:
            True if renewal is due within warning period
        """
        is_expired, days_remaining = self.check_expiration(license)

        if is_expired:
            return True

        return days_remaining <= warning_days

    def _generate_checksum(self, tenant_id: str, timestamp: str) -> str:
        """
        Generate checksum (must match generator logic).

        Args:
            tenant_id: Tenant identifier
            timestamp: Timestamp string

        Returns:
            8-character hexadecimal checksum
        """
        data = f"{tenant_id}{timestamp}{self.salt}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()[:8]

    def extract_tenant_id(self, license_key: str) -> Optional[str]:
        """
        Extract tenant ID from license key without full validation.

        Args:
            license_key: License key

        Returns:
            Tenant ID or None if invalid format
        """
        try:
            parts = license_key.split("-")
            if len(parts) == 4 and parts[0] == "AGY":
                return parts[1]
        except:
            pass

        return None
