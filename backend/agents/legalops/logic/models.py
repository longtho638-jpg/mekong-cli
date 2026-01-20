"""
Compliance Agent Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

class ComplianceStatus(Enum):
    COMPLIANT = "compliant"
    PARTIAL = "partial"
    NON_COMPLIANT = "non_compliant"
    UNDER_REVIEW = "under_review"

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RegulationType(Enum):
    GDPR = "gdpr"
    SOC2 = "soc2"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    LOCAL = "local"

@dataclass
class ComplianceItem:
    id: str
    name: str
    regulation: RegulationType
    description: str
    status: ComplianceStatus = ComplianceStatus.UNDER_REVIEW
    risk_level: RiskLevel = RiskLevel.MEDIUM
    due_date: Optional[datetime] = None
    owner: str = ""
    last_audit: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def is_overdue(self) -> bool:
        return self.due_date is not None and datetime.now() > self.due_date and self.status != ComplianceStatus.COMPLIANT
