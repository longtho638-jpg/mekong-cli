"""
⚖️ Legal Hub - Legal Operations
==================================

Central hub connecting all Legal roles with their operational tools.

Integrates:
- Contract Manager
- IP Manager
- Compliance Officer
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.contract_manager import ContractManager
    from core.ip_manager import IPManager
    from core.compliance_officer import ComplianceOfficer
except ImportError:
    from contract_manager import ContractManager
    from ip_manager import IPManager
    from compliance_officer import ComplianceOfficer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class LegalMetrics:
    """Department-wide legal metrics container."""
    active_contracts: int = 0
    contract_value: float = 0.0
    ip_assets: int = 0
    compliance_score: float = 0.0
    pending_signatures: int = 0
    expiring_contracts: int = 0


class LegalHub:
    """
    Legal Hub System.
    
    Orchestrates contracts, IP protections, and regulatory compliance across the agency.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Legal Hub for {agency_name}")
        try:
            self.contracts = ContractManager(agency_name)
            self.ip = IPManager(agency_name)
            self.compliance = ComplianceOfficer(agency_name)
        except Exception as e:
            logger.error(f"Legal Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> LegalMetrics:
        """Aggregate data from all legal specialized sub-modules."""
        metrics = LegalMetrics()
        
        try:
            # 1. Contract Metrics
            c_stats = self.contracts.get_stats()
            metrics.active_contracts = c_stats.get("active_count", 0)
            metrics.contract_value = float(c_stats.get("total_value", 0.0))
            metrics.pending_signatures = c_stats.get("pending_count", 0)
            
            # 2. IP Metrics
            i_stats = self.ip.get_stats()
            metrics.ip_assets = i_stats.get("registered_count", 0)
            
            # 3. Compliance Metrics
            co_stats = self.compliance.get_stats()
            metrics.compliance_score = float(co_stats.get("overall_score", 0.0))
            
        except Exception as e:
            logger.warning(f"Error aggregating Legal metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Legal Hub Dashboard."""
        m = self.get_department_metrics()
        
        score_icon = "🟢" if m.compliance_score >= 80 else "🟡" if m.compliance_score >= 60 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚖️ LEGAL HUB{' ' * 47}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CONSOLIDATED LEGAL METRICS                            ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📋 Active Contracts:   {m.active_contracts:>5}                          ║",
            f"║    💰 Total Contract Val: ${m.contract_value:>10,.0f}                ║",
            f"║    ©️ Registered IP:       {m.ip_assets:>5}                          ║",
            f"║    {score_icon} Compliance Score:   {m.compliance_score:>5.0f}%                         ║",
            f"║    ✍️ Pending Signatures:  {m.pending_signatures:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    📋 Contracts │ ©️ IP Protection │ 🔒 Compliance Audit  ║",
            "║                                                           ║",
            "║  [📋 Contracts]  [©️ IP]  [🔒 Audit]  [⚙️ Settings]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Protected!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("⚖️ Initializing Legal Hub...")
    print("=" * 60)
    
    try:
        hub = LegalHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")
