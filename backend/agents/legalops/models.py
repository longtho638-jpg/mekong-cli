"""
Compliance Models
"""
from dataclasses import dataclass
from datetime import datetime
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
    ISO_27001 = "iso_27001"
    LOCAL = "local"

@dataclass
class ComplianceItem:
    """Compliance requirement"""
    id: str
    name: str
    regulation: RegulationType
    description: str
    status: ComplianceStatus = ComplianceStatus.UNDER_REVIEW
    risk_level: RiskLevel = RiskLevel.MEDIUM
    due_date: Optional[datetime] = None
    owner: str = ""
    notes: str = ""
    last_audit: Optional[datetime] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def is_overdue(self) -> bool:
        if self.due_date:
            return datetime.now() > self.due_date and self.status != ComplianceStatus.COMPLIANT
        return False
