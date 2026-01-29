"""
Compliance Agent engine logic.
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List

from .models import ComplianceItem, ComplianceStatus, RegulationType, RiskLevel


class ComplianceEngine:
    def __init__(self):
        self.items: Dict[str, ComplianceItem] = {}

    def add_requirement(
        self,
        name: str,
        regulation: RegulationType,
        description: str,
        risk: RiskLevel = RiskLevel.MEDIUM,
        due_days: int = 30,
    ) -> ComplianceItem:
        iid = f"compliance_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        item = ComplianceItem(
            id=iid,
            name=name,
            regulation=regulation,
            description=description,
            risk_level=risk,
            due_date=datetime.now() + timedelta(days=due_days),
        )
        self.items[iid] = item
        return item

    def update_status(self, item_id: str, status: ComplianceStatus) -> ComplianceItem:
        if item_id not in self.items:
            raise ValueError("Item not found")
        item = self.items[item_id]
        item.status = status
        if status == ComplianceStatus.COMPLIANT:
            item.last_audit = datetime.now()
        return item
