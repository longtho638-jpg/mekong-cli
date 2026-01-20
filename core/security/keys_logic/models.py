"""
API Key data models and Enums.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class IntegrationType(Enum):
    """Integration types."""
    PAYMENT = "payment"
    EMAIL = "email"
    ANALYTICS = "analytics"
    CRM = "crm"
    SOCIAL = "social"
    STORAGE = "storage"

class KeyStatus(Enum):
    """API key status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    REVOKED = "revoked"

@dataclass
class APIKey:
    """An API key entry entity."""
    id: str
    name: str
    service: str
    type: IntegrationType
    key_masked: str
    status: KeyStatus
    last_used: Optional[datetime] = None
    usage_count: int = 0
    expires_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
