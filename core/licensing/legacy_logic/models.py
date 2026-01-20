from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

class LicenseTier(Enum):
    """Franchise partnership levels."""
    STARTER = "starter"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"

class LicenseStatus(Enum):
    """Lifecycle status of a license."""
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    TRIAL = "trial"

@dataclass
class License:
    """A digital license entity record."""
    key: str
    tier: LicenseTier
    status: LicenseStatus
    owner_email: str
    owner_name: str
    territories_allowed: int
    activated_at: datetime
    expires_at: Optional[datetime]
    monthly_fee: float

    def __post_init__(self):
        if self.monthly_fee < 0:
            raise ValueError("Fee cannot be negative")
