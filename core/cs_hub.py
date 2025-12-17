"""
👥 Customer Success Hub - Department Integration
==================================================

Central hub connecting all Customer Success roles
with their operational tools.

Integrates:
- Account Manager → client_portal.py
- Onboarding Specialist → client_onboarding.py
- Customer Success Manager → client_health.py
- CS Coordinator → support_tickets.py
- CS Analyst → client_health.py
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import existing Ops modules
from core.client_health import ClientHealthScore, HealthLevel
from core.client_onboarding import ClientOnboardingFlow, OnboardingStep
from core.support_tickets import SupportTickets, TicketPriority

# Import role modules
from core.account_manager import AccountManager, AccountTier
from core.onboarding_specialist import OnboardingSpecialist
from core.csm import CustomerSuccessManager, SuccessStage
from core.cs_coordinator import CSCoordinator, TaskType
from core.cs_analyst import CSAnalyst, RiskLevel


@dataclass
class CustomerSuccessMetrics:
    """Department-wide metrics."""
    total_accounts: int
    active_onboardings: int
    avg_health_score: float
    at_risk_count: int
    open_tickets: int
    nps_score: float


class CustomerSuccessHub:
    """
    Customer Success Hub.
    
    Connects all CS roles with their tools.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize Ops modules
        self.health_ops = ClientHealthScore(agency_name)
        self.onboarding_ops = ClientOnboardingFlow(agency_name)
        self.tickets_ops = SupportTickets(agency_name)
        
        # Initialize role modules
        self.account_manager = AccountManager(agency_name)
        self.onboarding_specialist = OnboardingSpecialist(agency_name)
        self.csm = CustomerSuccessManager(agency_name)
        self.coordinator = CSCoordinator(agency_name)
        self.analyst = CSAnalyst(agency_name)
    
    def get_department_metrics(self) -> CustomerSuccessMetrics:
        """Get department-wide metrics."""
        return CustomerSuccessMetrics(
            total_accounts=len(self.account_manager.accounts),
            active_onboardings=len([o for o in self.onboarding_specialist.onboardings.values() 
                                   if o.current_phase.value != "complete"]),
            avg_health_score=sum(c.overall_score for c in self.health_ops.clients.values()) / 
                            len(self.health_ops.clients) if self.health_ops.clients else 0,
            at_risk_count=len(self.analyst.get_at_risk()),
            open_tickets=self.tickets_ops.get_stats().get("open", 0),
            nps_score=72  # Example
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 CUSTOMER SUCCESS HUB                                  ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👤 Total Accounts:     {metrics.total_accounts:>5}                          ║",
            f"║    👋 Active Onboardings: {metrics.active_onboardings:>5}                          ║",
            f"║    ❤️ Avg Health Score:   {metrics.avg_health_score:>5.0f}%                         ║",
            f"║    ⚠️ At-Risk Clients:    {metrics.at_risk_count:>5}                          ║",
            f"║    🎫 Open Tickets:       {metrics.open_tickets:>5}                          ║",
            f"║    ⭐ NPS Score:          {metrics.nps_score:>5.0f}                          ║",
            "║                                                           ║",
            "║  🔗 ROLE → OPS CONNECTIONS                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    👤 Account Manager     → client_portal.py             ║",
            "║    👋 Onboarding          → client_onboarding.py         ║",
            "║    🎯 CSM                 → client_health.py             ║",
            "║    🤝 Coordinator         → support_tickets.py           ║",
            "║    📊 Analyst             → client_health.py             ║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 Team]  [⚙️ Settings]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Customer Success Excellence!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = CustomerSuccessHub("Saigon Digital Hub")
    
    print("👥 Customer Success Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.account_manager.add_account("Sunrise Realty", AccountTier.ENTERPRISE, 5000, "Alex")
    hub.account_manager.add_account("Coffee Lab", AccountTier.BUSINESS, 2500, "Sarah")
    
    hub.onboarding_specialist.start_onboarding("Tech Startup", "Mike")
    
    hub.health_ops.add_client("Sunrise Realty", 85, 100, 80, 90)
    hub.health_ops.add_client("Coffee Lab", 70, 90, 65, 75)
    
    print(hub.format_hub_dashboard())
