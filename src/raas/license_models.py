"""
RaaS License Models - Pydantic v2 models for license payloads

All license operations use typed Pydantic models for consistent validation.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field, field_validator


# ============= License Key Payload =============


class LicenseKeyPayload(BaseModel):
    """Decoded JWT license claims."""

    sub: str = Field(..., description="Subject (organization ID)")
    tier: str = Field(..., description="License tier")
    exp: datetime = Field(..., description="Expiration timestamp")
    iat: datetime = Field(default_factory=datetime.utcnow, description="Issued at")
    email: EmailStr = Field(..., description="License holder email")
    org_name: str = Field(..., description="Organization name")
    features: list[str] = Field(default_factory=list, description="Enabled features")
    tenant_id: str = Field(default_factory=lambda: str(uuid4()), description="Tenant identifier")
    jti: str = Field(default_factory=lambda: str(uuid4()), description="JWT ID (unique identifier)")

    @field_validator("tier")
    @classmethod
    def validate_tier(cls, v: str) -> str:
        """Validate license tier."""
        valid_tiers = {"free", "pro", "enterprise"}
        if v.lower() not in valid_tiers:
            raise ValueError(f"Tier must be one of: {valid_tiers}")
        return v.lower()

    @field_validator("features")
    @classmethod
    def validate_features(cls, v: list[str]) -> list[str]:
        """Validate feature names."""
        valid_features = {
            "agents",
            "plans",
            "swarm",
            "usage_metering",
            "analytics",
            "priority_support",
            "custom_models",
            "webhook_integration",
        }
        for feature in v:
            if feature not in valid_features:
                raise ValueError(f"Unknown feature: {feature}")
        return v

    @property
    def is_expired(self) -> bool:
        """Check if license is expired."""
        return datetime.utcnow() > self.exp

    @property
    def days_until_expiry(self) -> int:
        """Get days until license expires."""
        delta = self.exp - datetime.utcnow()
        return max(0, delta.days)


# ============= License Validation =============


class LicenseValidationRequest(BaseModel):
    """License validation request."""

    key: str = Field(..., description="License key to validate")
    tenant_id: Optional[str] = Field(None, description="Tenant ID for validation")
    feature: Optional[str] = Field(None, description="Specific feature to check")
    action: str = Field(default="validate", description="Validation action")

    @field_validator("key")
    @classmethod
    def validate_license_key_format(cls, v: str) -> str:
        """Validate license key format (RPP-/REP- prefix)."""
        pattern = r"^(RPP|REP)-[A-Za-z0-9]{16,}$"
        if not re.match(pattern, v):
            raise ValueError(
                "License key must start with RPP- or REP- followed by at least 16 alphanumeric characters"
            )
        return v


class LicenseValidationResponse(BaseModel):
    """License validation response."""

    valid: bool = Field(..., description="Whether license is valid")
    tier: Optional[str] = Field(None, description="License tier if valid")
    features: list[str] = Field(default_factory=list, description="Enabled features")
    error: Optional[str] = Field(None, description="Error message if invalid")
    expires_at: Optional[datetime] = Field(None, description="License expiration date")
    tenant_id: Optional[str] = Field(None, description="Tenant ID")

    @classmethod
    def success(
        cls,
        tier: str,
        features: list[str],
        expires_at: datetime,
        tenant_id: str,
    ) -> LicenseValidationResponse:
        """Create a success response."""
        return cls(
            valid=True,
            tier=tier,
            features=features,
            expires_at=expires_at,
            tenant_id=tenant_id,
        )

    @classmethod
    def failure(cls, error: str) -> LicenseValidationResponse:
        """Create a failure response."""
        return cls(valid=False, error=error)


# ============= License Audit Log =============


class AuditAction(str):
    """Audit log actions."""

    LICENSE_GENERATED = "license.generated"
    LICENSE_VALIDATED = "license.validated"
    LICENSE_EXPIRED = "license.expired"
    LICENSE_REVOKED = "license.revoked"
    FEATURE_ACCESSED = "feature.accessed"
    USAGE_RECORDED = "usage.recorded"
    SWARM_REGISTERED = "swarm.registered"


class LicenseAuditLog(BaseModel):
    """Audit log entry for license operations."""

    id: str = Field(default_factory=lambda: str(uuid4()), description="Audit log entry ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    tenant_id: str = Field(..., description="Tenant identifier")
    action: str = Field(..., description="Audit action")
    result: str = Field(..., description="Result: success, failure, warning")
    trace_id: Optional[str] = Field(None, description="Trace ID for request tracking")
    details: Optional[dict] = Field(None, description="Additional details")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    user_agent: Optional[str] = Field(None, description="Client user agent")

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        """Validate action format."""
        if "." not in v:
            raise ValueError("Action must be in format 'entity.action' (e.g., 'license.validated')")
        return v

    @field_validator("result")
    @classmethod
    def validate_result(cls, v: str) -> str:
        """Validate result value."""
        valid_results = {"success", "failure", "warning"}
        if v.lower() not in valid_results:
            raise ValueError(f"Result must be one of: {valid_results}")
        return v.lower()


# ============= License Generation Request =============


class GenerateLicenseRequest(BaseModel):
    """License generation request."""

    tier: str = Field(..., description="License tier")
    email: EmailStr = Field(..., description="License holder email")
    org_name: str = Field(..., description="Organization name")
    duration_days: int = Field(default=365, ge=1, le=730)
    features: Optional[list[str]] = Field(None, description="Custom features")

    @field_validator("tier")
    @classmethod
    def validate_tier(cls, v: str) -> str:
        """Validate license tier."""
        valid_tiers = {"free", "pro", "enterprise"}
        if v.lower() not in valid_tiers:
            raise ValueError(f"Tier must be one of: {valid_tiers}")
        return v.lower()


class GenerateLicenseResponse(BaseModel):
    """License generation response."""

    success: bool = Field(..., description="Whether generation succeeded")
    license_key: Optional[str] = Field(None, description="Generated license key")
    license_payload: Optional[LicenseKeyPayload] = Field(None, description="Decoded license payload")
    error: Optional[str] = Field(None, description="Error message if failed")
    download_url: Optional[str] = Field(None, description="URL to download license file")


__all__ = [
    "LicenseKeyPayload",
    "LicenseValidationRequest",
    "LicenseValidationResponse",
    "LicenseAuditLog",
    "AuditAction",
    "GenerateLicenseRequest",
    "GenerateLicenseResponse",
]
