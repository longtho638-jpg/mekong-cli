"""
License Data Models

Defines the structure for license objects and status tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LicenseStatus(str, Enum):
    """License status enumeration"""

    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    PENDING = "pending"


class LicensePlan(str, Enum):
    """License plan tiers"""

    SOLO = "solo"  # $395/year - 1 user, 3 agents
    TEAM = "team"  # $995/year - 5 users, 10 agents
    ENTERPRISE = "enterprise"  # Custom - unlimited


class License(BaseModel):
    """License object model"""

    license_key: str = Field(..., description="Unique license key")
    tenant_id: str = Field(..., description="Tenant/customer identifier")
    plan: LicensePlan = Field(..., description="License plan tier")

    issued_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="License expiration date")

    status: LicenseStatus = Field(default=LicenseStatus.ACTIVE)

    # Hardware binding (prevents license transfer)
    bound_domain: Optional[str] = Field(None, description="Bound domain name")
    hardware_fingerprint: Optional[str] = Field(None, description="Hardware identifier")

    # Metadata
    max_users: int = Field(1, description="Maximum concurrent users")
    max_agents: int = Field(3, description="Maximum AI agents")
    max_activations: int = Field(3, description="Maximum concurrent activations (seats)")
    features: list[str] = Field(default_factory=list, description="Enabled features")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")

    # Audit
    last_validated_at: Optional[datetime] = None
    validation_count: int = 0

    model_config = ConfigDict(use_enum_values=True)
