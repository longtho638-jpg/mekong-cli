"""
👥 Customer Success Hub - Department Integration
==================================================

Central hub connecting all Customer Success roles with their operational tools.

Integrates:
- Account Manager
- Onboarding Specialist
- Customer Success Manager
- CS Coordinator
- CS Analyst
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import existing modules with fallback for direct testing
try:
    from core.client_health import ClientHealthScore, HealthLevel
    from core.client_onboarding import ClientOnboardingFlow, OnboardingStep
    from core.support_tickets import SupportTickets, TicketPriority
    from core.account_manager import AccountManager, AccountTier
    from core.onboarding_specialist import OnboardingSpecialist
    from core.csm import CustomerSuccessManager, SuccessStage
    from core.cs_coordinator import CSCoordinator, TaskType
    from core.cs_analyst import CSAnalyst, RiskLevel
except ImportError:
    from client_health import ClientHealthScore, HealthLevel
    from client_onboarding import ClientOnboardingFlow, OnboardingStep
    from support_tickets import SupportTickets, TicketPriority
    from account_manager import AccountManager, AccountTier
    from onboarding_specialist import OnboardingSpecialist
    from csm import CustomerSuccessManager, SuccessStage
    from cs_coordinator import CSCoordinator, TaskType
    from cs_analyst import CSAnalyst, RiskLevel

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CustomerSuccessMetrics:
    """Department-wide metrics container."""
    total_accounts: int = 0
    active_onboardings: int = 0
    avg_health_score: float = 0.0
    at_risk_count: int = 0
    open_tickets: int = 0
    nps_score: float = 0.0


class CustomerSuccessHub:
    """
    Customer Success Hub System.
    
    Orchestrates account health, onboarding, support, and relationship management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Customer Success Hub for {agency_name}")
        try:
            # Ops modules
            self.health_ops = ClientHealthScore(agency_name)
            self.onboarding_ops = ClientOnboardingFlow(agency_name)
            self.tickets_ops = SupportTickets(agency_name)
            
            # Role modules
            self.account_manager = AccountManager(agency_name)
            self.onboarding_specialist = OnboardingSpecialist(agency_name)
            self.csm = CustomerSuccessManager(agency_name)
            self.coordinator = CSCoordinator(agency_name)
            self.analyst = CSAnalyst(agency_name)
        except Exception as e:
            logger.error(f"CS Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> CustomerSuccessMetrics:
        """Aggregate data from all Customer Success sub-modules."""
        metrics = CustomerSuccessMetrics()
        
        try:
            metrics.total_accounts = len(self.account_manager.accounts)
            
            # Safe phase check for onboarding
            active_onb = [
                o for o in self.onboarding_specialist.onboardings.values() 
                if getattr(o.current_phase, 'value', str(o.current_phase)) != "complete"
            ]
            metrics.active_onboardings = len(active_onb)
            
            # Health aggregation
            if self.health_ops.clients:
                metrics.avg_health_score = sum(c.overall_score for c in self.health_ops.clients.values()) / len(self.health_ops.clients)
            
            metrics.at_risk_count = len(self.analyst.get_at_risk_list())
            metrics.open_tickets = self.tickets_ops.get_stats().get("open", 0)
            metrics.nps_score = 72.0  # Placeholder for real NPS module
            
        except Exception as e:
            logger.warning(f"Error aggregating CS metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render Customer Success Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 CUSTOMER SUCCESS HUB{' ' * 34}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PERFORMANCE METRICS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    👤 Total Accounts:     {m.total_accounts:>5}                          ║",
            f"║    👋 Active Onboardings: {m.active_onboardings:>5}                          ║",
            f"║    ❤️ Avg Health Score:   {m.avg_health_score:>5.0f}%                         ║",
            f"║    ⚠️ At-Risk Clients:    {m.at_risk_count:>5}                          ║",
            f"║    🎫 Open Tickets:       {m.open_tickets:>5}                          ║",
            f"║    ⭐ NPS Score:          {m.nps_score:>5.0f}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE CONNECTIONS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    👤 AM   → account_manager.py (Tiers, MRR)             ║",
            "║    👋 OS   → onboarding_specialist.py (Setup)            ║",
            "║    🎯 CSM  → csm.py (Relationship, Upsell)               ║",
            "║    🤝 CO   → cs_coordinator.py (Tasks, Touches)          ║",
            "║    📊 AN   → cs_analyst.py (Data, Risk)                  ║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 Team]  [🎫 Tickets]  [⚙️ Settings]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👥 Initializing CS Hub...")
    print("=" * 60)
    
    try:
        hub = CustomerSuccessHub("Saigon Digital Hub")
        # Add sample data
        hub.account_manager.add_account("Acme Corp", AccountTier.ENTERPRISE, 5000.0, "Alex")
        hub.health_ops.add_client("Acme Corp", 85, 100, 80, 90)
        
        print("\n" + hub.format_hub_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")
