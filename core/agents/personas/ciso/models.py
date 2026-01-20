"""
Chief Information Security Officer (CISO) Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class RiskLevel(Enum):
    """Security risk and severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def weight(self) -> int:
        """Numeric weight for risk score calculations."""
        mapping = {RiskLevel.CRITICAL: 10, RiskLevel.HIGH: 7, RiskLevel.MEDIUM: 4, RiskLevel.LOW: 2}
        return mapping[self]

class SecurityDomain(Enum):
    """Security domains for classification."""
    DATA_PROTECTION = "data_protection"
    ACCESS_CONTROL = "access_control"
    NETWORK = "network"
    APPLICATION = "application"
    COMPLIANCE = "compliance"
    INCIDENT = "incident"

class IncidentStatus(Enum):
    """Security incident lifecycle status."""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    POST_MORTEM = "post_mortem"

@dataclass
class SecurityRisk:
    """A security risk record entity."""
    id: str
    title: str
    domain: SecurityDomain
    risk_level: RiskLevel
    description: str
    mitigation: str = ""
    status: str = "open"  # open, mitigated
    identified_at: datetime = field(default_factory=datetime.now)

@dataclass
class SecurityIncident:
    """A security incident record entity."""
    id: str
    title: str
    severity: RiskLevel
    status: IncidentStatus = IncidentStatus.DETECTED
    affected_systems: List[str] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None

@dataclass
class ComplianceItem:
    """A compliance requirement entity."""
    id: str
    standard: str  # e.g., GDPR, SOC2, ISO27001
    requirement: str
    status: str = "pending"  # pending, compliant, non_compliant
    last_audit: Optional[datetime] = None
