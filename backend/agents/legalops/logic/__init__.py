"""
Compliance Agent Facade.
"""
from typing import Dict
from .models import ComplianceStatus, RegulationType, RiskLevel, ComplianceItem
from .engine import ComplianceEngine

class ComplianceAgent(ComplianceEngine):
    """Refactored Compliance Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Compliance"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_items": len(self.items), "compliance_rate": f"{len([i for i in self.items.values() if i.status == ComplianceStatus.COMPLIANT]) / len(self.items) * 100 if self.items else 100:.0f}%"}

__all__ = ['ComplianceAgent', 'ComplianceStatus', 'RegulationType', 'RiskLevel', 'ComplianceItem']
