"""
💻 IT Hub - Department Integration
====================================

Central hub connecting all IT roles.

Integrates:
- CISO - Security
- IT Manager - Operations
- CTO - Strategy
- Systems Administrator - Infrastructure
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.ciso import CISO, RiskLevel, SecurityDomain
from core.it_manager import ITManager, ITProjectStatus, VendorType
from core.cto import CTO, InitiativeStatus, TechStack
from core.sysadmin import SysAdmin, ServerType


@dataclass
class ITMetrics:
    """Department-wide metrics."""
    security_score: int
    open_risks: int
    active_incidents: int
    it_projects: int
    vendors: int
    initiatives: int
    tech_debt_days: int
    servers_running: int
    active_users: int


class ITHub:
    """
    Information Technology Hub.
    
    Connects all IT roles.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.ciso = CISO(agency_name)
        self.it_manager = ITManager(agency_name)
        self.cto = CTO(agency_name)
        self.sysadmin = SysAdmin(agency_name)
    
    def get_department_metrics(self) -> ITMetrics:
        """Get department-wide metrics."""
        ciso_score = self.ciso.get_security_score()
        cto_stats = self.cto.get_stats()
        sysadmin_stats = self.sysadmin.get_stats()
        
        open_risks = sum(1 for r in self.ciso.risks.values() if r.status == "open")
        active_incidents = sum(1 for i in self.ciso.incidents 
                              if i.status.value not in ["resolved", "post_mortem"])
        
        return ITMetrics(
            security_score=ciso_score,
            open_risks=open_risks,
            active_incidents=active_incidents,
            it_projects=len(self.it_manager.projects),
            vendors=len(self.it_manager.vendors),
            initiatives=cto_stats.get("initiatives", 0),
            tech_debt_days=cto_stats.get("debt_days", 0),
            servers_running=sysadmin_stats.get("running", 0),
            active_users=sysadmin_stats.get("active_users", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💻 INFORMATION TECHNOLOGY HUB                            ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🔒 Security Score:     {metrics.security_score:>5}%                         ║",
            f"║    ⚠️ Open Risks:         {metrics.open_risks:>5}                          ║",
            f"║    🚨 Active Incidents:   {metrics.active_incidents:>5}                          ║",
            f"║    📋 IT Projects:        {metrics.it_projects:>5}                          ║",
            f"║    🏢 Vendors:            {metrics.vendors:>5}                          ║",
            f"║    🚀 Initiatives:        {metrics.initiatives:>5}                          ║",
            f"║    ⚠️ Tech Debt (days):   {metrics.tech_debt_days:>5}                          ║",
            f"║    🖥️ Servers Running:    {metrics.servers_running:>5}                          ║",
            f"║    👥 Active Users:       {metrics.active_users:>5}                          ║",
            "║                                                           ║",
            "║  🔗 IT ROLES                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🔒 CISO               → Security, Compliance          ║",
            "║    💼 IT Manager         → Operations, Vendors           ║",
            "║    🚀 CTO                → Strategy, Innovation          ║",
            "║    🔧 SysAdmin           → Infrastructure, Users         ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🔒 CISO              │ {metrics.security_score}% secure, {metrics.open_risks} risks     ║",
            f"║    💼 IT Manager        │ {metrics.it_projects} projects, {metrics.vendors} vendors   ║",
            f"║    🚀 CTO               │ {metrics.initiatives} initiatives           ║",
            f"║    🔧 SysAdmin          │ {metrics.servers_running} servers, {metrics.active_users} users       ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🔒 Security]  [⚙️ Settings]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Technology leadership!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = ITHub("Saigon Digital Hub")
    
    print("💻 Information Technology Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.ciso.identify_risk("Weak passwords", SecurityDomain.ACCESS_CONTROL, RiskLevel.HIGH, "desc")
    hub.it_manager.create_project("Cloud Migration", "desc", 50000)
    hub.it_manager.add_vendor("AWS", VendorType.CLOUD, 24000)
    hub.cto.add_initiative("AI Integration", "desc", "high")
    hub.cto.add_to_stack(TechStack.BACKEND, "FastAPI")
    hub.sysadmin.add_server("Web-01", ServerType.WEB, "10.0.1.10")
    hub.sysadmin.add_user("admin", "admin@test.com", "IT", "admin")
    
    print(hub.format_hub_dashboard())
