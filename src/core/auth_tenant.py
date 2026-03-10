"""
RaaS Auth Tenant - Tenant Isolation and RBAC

Tenant context management, license validation, and feature flags.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .auth_types import TenantContext, AuthResult
from .auth_jwt import decode_jwt, validate_jwt_expiry, extract_tenant_from_jwt


class TenantManager:
    """
    Tenant isolation and RBAC manager.

    Manages:
    - Tenant context extraction from credentials
    - Tier-based feature flags
    - License key validation
    - Local mock for offline testing

    Attributes:
        local_test_mode: If True, use mock validation without gateway calls
    """

    # Tier definitions with feature flags
    TIER_FEATURES: Dict[str, list[str]] = {
        "free": ["cli_commands", "local_testing"],
        "trial": ["cli_commands", "local_testing", "gateway_mock", "limited_raas"],
        "pro": ["cli_commands", "local_testing", "gateway_mock", "raas_basic"],
        "enterprise": ["cli_commands", "local_testing", "gateway_mock", "raas_full", "priority_support"],
    }

    def __init__(self, local_test_mode: bool = False):
        """
        Initialize Tenant Manager.

        Args:
            local_test_mode: If True, use mock validation (RAAS_LOCAL_TEST=true)
        """
        self.local_test_mode = local_test_mode

    def validate_token_format(self, token: str) -> tuple[bool, Optional[str], Optional[str]]:
        """
        Validate token format without gateway call.

        Args:
            token: Token to validate (mk_ API key or JWT)

        Returns:
            Tuple of (is_valid, error_message, error_code)
        """
        if not token:
            return False, "No credentials provided", "missing_credentials"

        token = token.strip()

        # mk_ API key format
        if token.startswith("mk_"):
            if len(token) < 8:
                return False, "Invalid API key format (too short)", "invalid_api_key_format"
            return True, None, None

        # JWT format
        elif "." in token:
            payload = decode_jwt(token)
            if not payload:
                return False, "Invalid JWT format", "invalid_jwt_format"
            if not validate_jwt_expiry(payload):
                return False, "Token expired", "token_expired"
            return True, None, None

        # Unknown format
        else:
            return False, "Unrecognized credential format", "unknown_format"

    def extract_tier_from_token(self, token: str) -> str:
        """
        Extract tier from token prefix.

        Args:
            token: mk_ API key token

        Returns:
            Tier string (free/trial/pro/enterprise)
        """
        if token.startswith("mk_free"):
            return "free"
        elif token.startswith("mk_trial"):
            return "trial"
        elif token.startswith("mk_enterprise"):
            return "enterprise"
        else:
            return "pro"  # Default to pro for other mk_ keys

    def generate_mock_tenant_id(self, token: str) -> str:
        """
        Generate deterministic mock tenant ID from token.

        Args:
            token: Token to hash

        Returns:
            Mock tenant ID (e.g., "local_abc123def")
        """
        hash_value = hashlib.md5(token.encode()).hexdigest()[:8]
        return f"local_{hash_value}"

    def local_validate(self, token: str) -> AuthResult:
        """
        Local mock validation for offline testing (gateway fallback).

        Note: This matches original _local_validate behavior:
        - mk_ keys: hardcoded tenant_id="local", tier="free"
        - JWT: extract from payload
        - Otherwise: invalid

        Args:
            token: Token to validate

        Returns:
            AuthResult with mock tenant context
        """
        # Validate format first
        is_valid, error, error_code = self.validate_token_format(token)
        if not is_valid:
            return AuthResult(valid=False, error=error, error_code=error_code)

        # mk_ API key - hardcoded "local" tenant, "free" tier (original behavior)
        if token.startswith("mk_"):
            return AuthResult(
                valid=True,
                tenant=TenantContext(
                    tenant_id="local",
                    tier="free",
                    role="free",
                    license_key=token,
                    features=self.TIER_FEATURES["free"],
                ),
            )

        # JWT - extract from payload
        payload = decode_jwt(token)
        if payload and validate_jwt_expiry(payload):
            return AuthResult(
                valid=True,
                tenant=extract_tenant_from_jwt(payload),
            )

        return AuthResult(
            valid=False,
            error="Local validation failed",
            error_code="local_validation_failed",
        )

    def extract_from_jwt(self, token: str) -> Optional[TenantContext]:
        """
        Extract tenant context from JWT token.

        Args:
            token: JWT token

        Returns:
            TenantContext if valid, None otherwise
        """
        payload = decode_jwt(token)
        if not payload:
            return None

        if not validate_jwt_expiry(payload):
            return None

        return extract_tenant_from_jwt(payload)

    def extract_from_api_key(self, token: str) -> TenantContext:
        """
        Create tenant context from mk_ API key.

        Args:
            token: mk_ API key

        Returns:
            TenantContext with free tier defaults
        """
        tier = self.extract_tier_from_token(token)
        features = self.TIER_FEATURES.get(tier, self.TIER_FEATURES["free"])

        return TenantContext(
            tenant_id=f"ak_{hashlib.md5(token.encode()).hexdigest()[:8]}",
            tier=tier,
            role=tier,
            license_key=token,
            features=features,
        )

    def get_features_for_tier(self, tier: str) -> list[str]:
        """
        Get feature list for a given tier.

        Args:
            tier: Tier name (free/trial/pro/enterprise)

        Returns:
            List of feature flags
        """
        return self.TIER_FEATURES.get(tier, self.TIER_FEATURES["free"])

    def has_feature(self, tenant: TenantContext, feature: str) -> bool:
        """
        Check if tenant has access to a specific feature.

        Args:
            tenant: Tenant context
            feature: Feature name to check

        Returns:
            True if feature is enabled for tenant
        """
        return feature in tenant.features

    def is_license_expired(self, tenant: TenantContext) -> bool:
        """
        Check if tenant license is expired.

        Args:
            tenant: Tenant context

        Returns:
            True if expired, False if still valid or no expiry set
        """
        if not tenant.expires_at:
            return False
        return datetime.now(timezone.utc) >= tenant.expires_at

    def get_license_status(self, tenant: TenantContext) -> Dict[str, Any]:
        """
        Get license status information.

        Args:
            tenant: Tenant context

        Returns:
            Dictionary with license status details
        """
        now = datetime.now(timezone.utc)

        return {
            "tenant_id": tenant.tenant_id,
            "tier": tenant.tier,
            "is_active": not self.is_license_expired(tenant),
            "expires_at": tenant.expires_at.isoformat() if tenant.expires_at else None,
            "days_until_expiry": (
                (tenant.expires_at - now).days if tenant.expires_at else None
            ),
            "features": tenant.features,
            "has_license_key": tenant.license_key is not None,
        }
