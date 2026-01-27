"""
License Generator

Secure license key generation with cryptographic checksums.

Format: AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}
Example: AGY-tenant123-20260125-a3f8c9d2
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from .models import License, LicensePlan, LicenseStatus


class LicenseGenerator:
    """
    Generates secure, time-bound license keys for AgencyOS tenants.

    Features:
    - Cryptographically secure checksums
    - Hardware binding support
    - Configurable expiration periods
    - Plan-based feature gating
    """

    SECRET_SALT = "AGENCYOS_LICENSE_SALT_2026"  # Should be in env in production

    def __init__(self, secret_salt: Optional[str] = None):
        """
        Initialize the license generator.

        Args:
            secret_salt: Optional custom salt for checksum generation
        """
        self.salt = secret_salt or self.SECRET_SALT

    def generate(
        self,
        tenant_id: str,
        plan: LicensePlan = LicensePlan.SOLO,
        duration_days: int = 365,
        bound_domain: Optional[str] = None,
        hardware_fingerprint: Optional[str] = None,
    ) -> License:
        """
        Generate a new license.

        Args:
            tenant_id: Unique identifier for the tenant
            plan: License plan tier (solo/team/enterprise)
            duration_days: License validity period in days
            bound_domain: Optional domain to bind license to
            hardware_fingerprint: Optional hardware ID to bind license to

        Returns:
            License object with generated key

        Example:
            >>> generator = LicenseGenerator()
            >>> license = generator.generate("tenant_123", LicensePlan.PRO, 365)
            >>> print(license.license_key)
            AGY-tenant123-20260127-a3f8c9d2
        """

        # Generate timestamp
        issued_at = datetime.utcnow()
        timestamp = issued_at.strftime("%Y%m%d")

        # Generate checksum
        checksum = self._generate_checksum(tenant_id, timestamp)

        # Build license key
        license_key = f"AGY-{tenant_id}-{timestamp}-{checksum}"

        # Calculate expiration
        expires_at = issued_at + timedelta(days=duration_days)

        # Determine plan limits
        limits = self._get_plan_limits(plan)

        return License(
            license_key=license_key,
            tenant_id=tenant_id,
            plan=plan,
            issued_at=issued_at,
            expires_at=expires_at,
            status=LicenseStatus.ACTIVE,
            bound_domain=bound_domain,
            hardware_fingerprint=hardware_fingerprint,
            max_users=limits["max_users"],
            max_agents=limits["max_agents"],
            max_activations=limits["max_activations"],
            features=limits["features"],
        )

    def _generate_checksum(self, tenant_id: str, timestamp: str) -> str:
        """
        Generate cryptographic checksum for license key.

        Args:
            tenant_id: Tenant identifier
            timestamp: Timestamp string

        Returns:
            8-character hexadecimal checksum
        """
        data = f"{tenant_id}{timestamp}{self.salt}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()[:8]

    def _get_plan_limits(self, plan: LicensePlan) -> dict:
        """
        Get resource limits for a plan tier.

        Args:
            plan: License plan

        Returns:
            Dictionary with max_users, max_agents, and features
        """
        limits = {
            LicensePlan.SOLO: {
                "max_users": 1,
                "max_agents": 3,
                "max_activations": 3,
                "features": ["basic_ai", "dashboard", "api_access"],
            },
            LicensePlan.TEAM: {
                "max_users": 5,
                "max_agents": 10,
                "max_activations": 10,
                "features": [
                    "basic_ai",
                    "advanced_ai",
                    "dashboard",
                    "api_access",
                    "multi_user",
                    "team_analytics",
                ],
            },
            LicensePlan.ENTERPRISE: {
                "max_users": 999,
                "max_agents": 999,
                "max_activations": 9999,
                "features": [
                    "basic_ai",
                    "advanced_ai",
                    "custom_ai",
                    "dashboard",
                    "api_access",
                    "multi_user",
                    "team_analytics",
                    "white_label",
                    "sla_support",
                ],
            },
        }

        return limits.get(plan, limits[LicensePlan.SOLO])

    def regenerate_with_same_checksum(self, existing_license: License) -> License:
        """
        Regenerate a license while preserving checksum (for renewal).

        Args:
            existing_license: Current license to renew

        Returns:
            New license with extended expiration
        """
        # Extract checksum from existing key
        parts = existing_license.license_key.split("-")
        if len(parts) != 4:
            raise ValueError("Invalid license key format")

        checksum = parts[3]

        # New timestamp
        issued_at = datetime.utcnow()
        new_timestamp = issued_at.strftime("%Y%m%d")

        # Build renewed key
        renewed_key = f"AGY-{existing_license.tenant_id}-{new_timestamp}-{checksum}"

        # Extend expiration by another year
        new_expiration = issued_at + timedelta(days=365)

        return License(
            license_key=renewed_key,
            tenant_id=existing_license.tenant_id,
            plan=existing_license.plan,
            issued_at=issued_at,
            expires_at=new_expiration,
            status=LicenseStatus.ACTIVE,
            bound_domain=existing_license.bound_domain,
            hardware_fingerprint=existing_license.hardware_fingerprint,
            max_users=existing_license.max_users,
            max_agents=existing_license.max_agents,
            max_activations=existing_license.max_activations,
            features=existing_license.features,
        )
