"""
Compliance Agent - Regulatory & Policy Compliance (Refactored)
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List

from .models import ComplianceItem, ComplianceStatus, RegulationType, RiskLevel


class ComplianceAgent:
    """
    Compliance Agent - Quản lý Tuân thủ
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
