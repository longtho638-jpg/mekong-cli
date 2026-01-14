"""
💻 IT Hub - Department Integration
====================================

Central hub connecting all IT roles with their operational tools.

Integrates:
- CISO
- IT Manager
- CTO
- Systems Administrator
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.ciso import CISO, RiskLevel, SecurityDomain
    from core.it_manager import ITManager, ITProjectStatus, VendorType
    from core.cto import CTO, InitiativeStatus, TechStack
    from core.sysadmin import SysAdmin, ServerType
except ImportError:
    from ciso import CISO, RiskLevel, SecurityDomain
    from it_manager import ITManager, ITProjectStatus, VendorType
    from cto import CTO, InitiativeStatus, TechStack
    from sysadmin import SysAdmin, ServerType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ITMetrics:
    """Department-wide IT metrics container."""
    security_score: int = 0
    open_risks: int = 0
    active_incidents: int = 0
    it_projects: int = 0
    vendors: int = 0
    initiatives: int = 0
    tech_debt_days: int = 0
    servers_running: int = 0
    active_users: int = 0


class ITHub:
    """
    Information Technology Hub System.
    
    Orchestrates infrastructure, security, strategy, and operational IT management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing IT Hub for {agency_name}")
        try:
            self.ciso = CISO(agency_name)
            self.it_manager = ITManager(agency_name)
            self.cto = CTO(agency_name)
            self.sysadmin = SysAdmin(agency_name)
        except Exception as e:
            logger.error(f"IT Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> ITMetrics:
        """Aggregate data from all IT specialized sub-modules."""
        metrics = ITMetrics()
        
        try:
            # 1. Security Metrics
            metrics.security_score = self.ciso.get_security_score()
            metrics.open_risks = sum(1 for r in self.ciso.risks.values() if r.status == "open")
            metrics.active_incidents = len([i for i in self.ciso.incidents if i.status.value not in ["resolved", "post_mortem"]])
            
            # 2. Strategy & Debt
            cto_stats = self.cto.get_stats()
            metrics.initiatives = cto_stats.get("initiatives", 0)
            metrics.tech_debt_days = cto_stats.get("debt_days", 0)
            
            # 3. Operations & Infra
            metrics.it_projects = len(self.it_manager.projects)
            metrics.vendors = len(self.it_manager.vendors)
            
            sys_stats = self.sysadmin.get_stats()
            metrics.servers_running = sys_stats.get("running", 0)
            metrics.active_users = sys_stats.get("active_users", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating IT metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the IT Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💻 INFORMATION TECHNOLOGY HUB{' ' * 31}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CONSOLIDATED IT METRICS                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🔒 Security Score:     {m.security_score:>5}%                         ║",
            f"║    ⚠️ Open Risks:         {m.open_risks:>5}                          ║",
            f"║    📋 IT Projects:        {m.it_projects:>5}                          ║",
            f"║    🚀 Initiatives:        {m.initiatives:>5}                          ║",
            f"║    ⚠️ Tech Debt:          {m.tech_debt_days:>5} days                      ║",
            f"║    🖥️ Servers Running:    {m.servers_running:>5}                          ║",
            f"║    👥 Active Users:       {m.active_users:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🔒 CISO (Security) │ 💼 IT Mgr (Ops) │ 🚀 CTO (Strategy)║",
            "║    🔧 SysAdmin (Infra)                                    ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🔒 Security]  [🖥️ Servers]  [⚙️ Setup]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Leadership!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💻 Initializing IT Hub...")
    print("=" * 60)
    
    try:
        hub = ITHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")