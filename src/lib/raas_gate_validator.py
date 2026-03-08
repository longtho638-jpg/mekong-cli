"""
RAAS License Gate Validator - Gateway-Only Validation

Validates license keys directly against RaaS Gateway at raas.agencyos.network.
No local license generation - fully delegated to gateway.

Reference: docs/HIEN_PHAP_ROIAAS.md - ROIaaS Phase 1
"""

import os
from typing import Optional, Tuple, Dict, Any

from src.core.raas_auth import RaaSAuthClient


class LicenseValidationError(Exception):
    """Raised when license validation fails."""

    def __init__(self, message: str, tier: str = "free", error_code: str = "unknown"):
        super().__init__(message)
        self.tier = tier
        self.error_code = error_code


class RaasGateValidator:
    """
    Gateway-only license validation.

    All validation delegated to RaaS Gateway.
    No local license generation or validation.
    """

    def __init__(self):
        self._client: Optional[RaaSAuthClient] = None
        self._last_result: Optional[Dict[str, Any]] = None

    @property
    def client(self) -> RaaSAuthClient:
        """Get or create RaaS auth client."""
        if self._client is None:
            self._client = RaaSAuthClient()
        return self._client

    def validate(self, license_key: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate license against RaaS Gateway.

        Args:
            license_key: Optional license key (defaults to RAAS_LICENSE_KEY env)

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Get license key from parameter or environment
            token = license_key or os.getenv("RAAS_LICENSE_KEY")

            if not token:
                self._last_result = {
                    "valid": False,
                    "tier": "free",
                    "error": "No license key provided",
                    "error_code": "missing_credentials",
                }
                return False, "No license key provided. Set RAAS_LICENSE_KEY environment variable."

            # Validate credentials against gateway
            result = self.client.validate_credentials(token)

            if result.valid and result.tenant:
                self._last_result = {
                    "valid": True,
                    "tier": result.tenant.tier,
                    "tenant_id": result.tenant.tenant_id,
                    "features": result.tenant.features,
                    "expires_at": result.tenant.expires_at.isoformat() if result.tenant.expires_at else None,
                }
                return True, None
            else:
                self._last_result = {
                    "valid": False,
                    "tier": "free",
                    "error": result.error,
                    "error_code": result.error_code,
                }
                error_message = self._format_error(result.error, result.error_code)
                return False, error_message

        except Exception as e:
            self._last_result = {
                "valid": False,
                "tier": "free",
                "error": str(e),
                "error_code": "validation_error",
            }
            return False, f"Validation error: {str(e)}"

    def _format_error(self, error: Optional[str], error_code: Optional[str]) -> str:
        """Format error message for user display."""
        error_messages = {
            "missing_credentials": "No license key provided. Set RAAS_LICENSE_KEY environment variable.",
            "invalid_api_key_format": "Invalid API key format. Must start with 'mk_' and be at least 8 characters.",
            "invalid_jwt_format": "Invalid JWT format. Expected: header.payload.signature",
            "token_expired": "License token expired. Please renew or generate a new token.",
            "unknown_format": "Unrecognized license format. Use mk_* (API key) or JWT format.",
            "gateway_error": "RaaS Gateway unreachable. Check your internet connection.",
            "invalid_license": "License key is invalid or has been revoked.",
            "insufficient_permissions": "License key lacks required permissions.",
            "credentials_revoked": "Credentials have been revoked.",
        }

        return error_messages.get(error_code, error or "License validation failed")

    def get_last_result(self) -> Optional[Dict[str, Any]]:
        """Get last validation result."""
        return self._last_result

    def get_tier(self) -> str:
        """Get tier from last validation result."""
        if self._last_result:
            return self._last_result.get("tier", "free")
        return "free"

    def get_features(self) -> list:
        """Get features from last validation result."""
        if self._last_result:
            return self._last_result.get("features", [])
        return []

    def _fallback_validate(self, license_key: Optional[str]) -> Dict[str, Any]:
        """
        Offline/fallback license validation by key format.

        Used when gateway is unreachable. Checks key prefix patterns.

        Args:
            license_key: License key to validate

        Returns:
            Dict with valid, tier, and optional no_license flag
        """
        if not license_key:
            return {"valid": False, "tier": "free", "no_license": True}

        # Enterprise prefixes
        if license_key.startswith("raas_ent_") or license_key.startswith("REP-"):
            return {"valid": True, "tier": "enterprise"}

        # Pro prefixes
        if license_key.startswith("raas_pro_") or license_key.startswith("RPP-"):
            return {"valid": True, "tier": "pro"}

        # API key format (mk_*)
        if license_key.startswith("mk_") and len(license_key) >= 8:
            return {"valid": True, "tier": "member"}

        return {"valid": False, "tier": "free"}


# Global instance for reuse
_validator: Optional[RaasGateValidator] = None


def get_validator() -> RaasGateValidator:
    """Get global validator instance."""
    global _validator
    if _validator is None:
        _validator = RaasGateValidator()
    return _validator


def reset_validator() -> None:
    """Reset global validator instance (for testing)."""
    global _validator
    _validator = None


def validate_license(license_key: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """
    Convenience function for license validation.

    Args:
        license_key: Optional license key

    Returns:
        Tuple of (is_valid, error_message)
    """
    return get_validator().validate(license_key)


def validate_at_startup() -> Tuple[bool, Optional[str]]:
    """
    Validate license at application startup.

    Returns:
        Tuple of (is_valid, error_message)
    """
    return validate_license()
