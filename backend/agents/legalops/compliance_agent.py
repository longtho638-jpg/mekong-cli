"""
Compliance Agent - Regulatory & Policy Compliance
Tracks regulatory requirements and compliance status.
"""

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


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


class ComplianceAgent:
    """
    Compliance Agent - Quản lý Tuân thủ

    Responsibilities:
    - Track regulations
    - Monitor compliance
    - Assess risks
    - Prepare audits
    """

    def __init__(self):
        self.name = "Compliance"
        self.status = "ready"
        self.items: Dict[str, ComplianceItem] = {}

    def add_requirement(
        self,
        name: str,
        regulation: RegulationType,
        description: str,
        risk_level: RiskLevel = RiskLevel.MEDIUM,
        due_days: int = 30,
        owner: str = "",
    ) -> ComplianceItem:
        """Add compliance requirement"""
        item_id = f"compliance_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        item = ComplianceItem(
            id=item_id,
            name=name,
            regulation=regulation,
            description=description,
            risk_level=risk_level,
            due_date=datetime.now() + timedelta(days=due_days),
            owner=owner,
        )

        self.items[item_id] = item
        return item

    def update_status(self, item_id: str, status: ComplianceStatus) -> ComplianceItem:
        """Update compliance status"""
        if item_id not in self.items:
            raise ValueError(f"Compliance item not found: {item_id}")

        item = self.items[item_id]
        item.status = status

        if status == ComplianceStatus.COMPLIANT:
            item.last_audit = datetime.now()

        return item

    def record_audit(self, item_id: str, notes: str = "") -> ComplianceItem:
        """Record audit completion"""
        if item_id not in self.items:
            raise ValueError(f"Compliance item not found: {item_id}")

        item = self.items[item_id]
        item.last_audit = datetime.now()
        if notes:
            item.notes = notes

        return item

    def get_by_regulation(self, regulation: RegulationType) -> List[ComplianceItem]:
        """Get items by regulation"""
        return [i for i in self.items.values() if i.regulation == regulation]

    def get_non_compliant(self) -> List[ComplianceItem]:
        """Get non-compliant items"""
        return [i for i in self.items.values() if i.status == ComplianceStatus.NON_COMPLIANT]

    def get_high_risk(self) -> List[ComplianceItem]:
        """Get high/critical risk items"""
        return [
            i for i in self.items.values() if i.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        ]

    def get_stats(self) -> Dict:
        """Get compliance statistics"""
        items = list(self.items.values())

        compliant = len([i for i in items if i.status == ComplianceStatus.COMPLIANT])

        return {
            "total_items": len(items),
            "compliant": compliant,
            "partial": len([i for i in items if i.status == ComplianceStatus.PARTIAL]),
            "non_compliant": len([i for i in items if i.status == ComplianceStatus.NON_COMPLIANT]),
            "compliance_rate": f"{compliant / len(items) * 100:.0f}%" if items else "100%",
            "high_risk": len(self.get_high_risk()),
            "overdue": len([i for i in items if i.is_overdue]),
        }


# Demo
if __name__ == "__main__":
    agent = ComplianceAgent()

    print("✅ Compliance Agent Demo\n")

    # Add requirements
    c1 = agent.add_requirement(
        "Data Processing Agreement",
        RegulationType.GDPR,
        "DPA for customer data",
        RiskLevel.HIGH,
        owner="Legal_001",
    )
    c2 = agent.add_requirement(
        "Access Controls",
        RegulationType.SOC2,
        "Implement role-based access",
        RiskLevel.MEDIUM,
        owner="IT_001",
    )
    c3 = agent.add_requirement(
        "Encryption at Rest",
        RegulationType.SOC2,
        "Encrypt all stored data",
        RiskLevel.HIGH,
        owner="IT_002",
    )

    print(f"📋 Requirement: {c1.name}")
    print(f"   Regulation: {c1.regulation.value}")
    print(f"   Risk: {c1.risk_level.value}")

    # Update status
    agent.update_status(c1.id, ComplianceStatus.COMPLIANT)
    agent.update_status(c2.id, ComplianceStatus.PARTIAL)
    agent.record_audit(c1.id, "All DPAs signed")

    print(f"\n✅ Status: {c1.status.value}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Compliance Rate: {stats['compliance_rate']}")
    print(f"   High Risk: {stats['high_risk']}")
    print(f"   Non-Compliant: {stats['non_compliant']}")
