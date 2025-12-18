"""
⚖️ Legal Hub - Legal Operations
==================================

Central hub connecting all Legal roles.

Integrates:
- Contract Manager (contract_manager.py)
- IP Manager (ip_manager.py)
- Compliance Officer (compliance_officer.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.contract_manager import ContractManager
from core.ip_manager import IPManager
from core.compliance_officer import ComplianceOfficer


@dataclass
class LegalMetrics:
    """Department-wide metrics."""
    active_contracts: int
    contract_value: float
    ip_assets: int
    compliance_score: float
    pending_signatures: int
    expiring_contracts: int


class LegalHub:
    """
    Legal Hub.
    
    Legal operations center.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.contracts = ContractManager(agency_name)
        self.ip = IPManager(agency_name)
        self.compliance = ComplianceOfficer(agency_name)
    
    def get_department_metrics(self) -> LegalMetrics:
        """Get department-wide metrics."""
        contract_stats = self.contracts.get_stats()
        ip_stats = self.ip.get_stats()
        compliance_stats = self.compliance.get_stats()
        
        return LegalMetrics(
            active_contracts=contract_stats.get("active", 0),
            contract_value=contract_stats.get("total_value", 0),
            ip_assets=ip_stats.get("registered", 0),
            compliance_score=compliance_stats.get("overall_score", 0),
            pending_signatures=contract_stats.get("pending_signature", 0),
            expiring_contracts=contract_stats.get("expiring_soon", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        score_icon = "🟢" if metrics.compliance_score >= 80 else "🟡" if metrics.compliance_score >= 60 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚖️ LEGAL HUB                                             ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Active Contracts:   {metrics.active_contracts:>5}                          ║",
            f"║    💰 Contract Value:     ${metrics.contract_value:>10,.0f}                ║",
            f"║    ©️ IP Assets:           {metrics.ip_assets:>5}                          ║",
            f"║    {score_icon} Compliance Score:   {metrics.compliance_score:>5.0f}%                         ║",
            f"║    ✍️ Pending Signatures:  {metrics.pending_signatures:>5}                          ║",
            f"║    ⏰ Expiring Soon:       {metrics.expiring_contracts:>5}                          ║",
            "║                                                           ║",
            "║  🔗 LEGAL ROLES                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📋 Contract Manager  → MSA, SOW, NDA, e-sign          ║",
            "║    ©️ IP Manager        → Trademarks, copyrights         ║",
            "║    🔒 Compliance        → GDPR, privacy, audits          ║",
            "║                                                           ║",
            "║  📋 LEGAL TEAM                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Contracts        │ {metrics.active_contracts} active, ${metrics.contract_value:,.0f}    ║",
            f"║    ©️ IP               │ {metrics.ip_assets} registered assets    ║",
            f"║    🔒 Compliance       │ {metrics.compliance_score:.0f}% compliant          ║",
            "║                                                           ║",
            "║  [📋 Contracts]  [©️ IP]  [🔒 Compliance]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Legal protection!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = LegalHub("Saigon Digital Hub")
    
    print("⚖️ Legal Hub")
    print("=" * 60)
    print()
    
    print(hub.format_hub_dashboard())
