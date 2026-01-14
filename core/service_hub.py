"""
📞 Customer Service Hub - Department Integration
==================================================

Central hub connecting all Customer Service roles within the agency operations.

Integrates:
- Technical Support Specialist
- CS Team Lead
- Customer Service Rep
- Call Center Agent
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime

# Import existing Ops modules with fallback
try:
    from core.support_tickets import SupportTickets, TicketPriority, TicketStatus
    from core.tech_support import TechSupportSpecialist, IssueCategory
    from core.cs_team_lead import CSTeamLead, AgentStatus
    from core.cs_rep import CustomerServiceRep, InquiryType
    from core.call_center import CallCenterAgent, CallType
except ImportError:
    from support_tickets import SupportTickets, TicketPriority, TicketStatus
    from tech_support import TechSupportSpecialist, IssueCategory
    from cs_team_lead import CSTeamLead, AgentStatus
    from cs_rep import CustomerServiceRep, InquiryType
    from call_center import CallCenterAgent, CallType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CustomerServiceMetrics:
    """Department-wide Customer Service performance metrics."""
    total_agents: int = 0
    agents_available: int = 0
    open_tickets: int = 0
    calls_today: int = 0
    avg_satisfaction: float = 0.0
    escalations: int = 0


class CustomerServiceHub:
    """
    Customer Service Hub System.
    
    Orchestrates department-wide integration between ticket management, call logging, and support team leadership.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        logger.info(f"Initializing Customer Service Hub for {agency_name}")
        
        try:
            self.tickets_ops = SupportTickets(agency_name)
            self.tech_support = TechSupportSpecialist(agency_name)
            self.team_lead = CSTeamLead(agency_name)
            self.service_rep = CustomerServiceRep(agency_name)
            self.call_center = CallCenterAgent(agency_name)
        except Exception as e:
            logger.error(f"CS Hub initialization failed: {e}")
            raise
    
    def get_aggregate_stats(self) -> CustomerServiceMetrics:
        """Fetch and aggregate data from all support sub-modules."""
        m = CustomerServiceMetrics()
        
        try:
            # 1. Team Data
            t_stats = self.team_lead.get_team_stats()
            m.total_agents = t_stats.get("total_agents", 0)
            m.agents_available = t_stats.get("available", 0)
            m.avg_satisfaction = float(t_stats.get("avg_satisfaction", 0.0))
            m.escalations = t_stats.get("open_escalations", 0)
            
            # 2. Ticket Data
            tk_stats = self.tickets_ops.get_stats()
            m.open_tickets = tk_stats.get("open", 0)
            
            # 3. Call Data
            c_stats = self.call_center.get_stats()
            m.calls_today = c_stats.get("calls_today", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating CS metrics: {e}")
            
        return m
    
    def format_hub_dashboard(self) -> str:
        """Render the unified Customer Service Department Dashboard."""
        m = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📞 CUSTOMER SERVICE HUB DASHBOARD{' ' * 31}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT PERFORMANCE METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    👥 Total Agents:       {m.total_agents:>5}                          ║",
            f"║    🟢 Agents Available:   {m.agents_available:>5}                          ║",
            f"║    🎫 Open Tickets:       {m.open_tickets:>5}                          ║",
            f"║    📞 Calls Today:        {m.calls_today:>5}                          ║",
            f"║    ⭐ Avg Satisfaction:   {m.avg_satisfaction:>5.1f}                          ║",
            f"║    ⚠️ Open Escalations:   {m.escalations:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🔧 Tech Support │ 👑 Team Lead │ 🎧 CS Rep │ 📞 Call Ctr ║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 Team Ops]  [🎫 Tickets]  [⚙️ Setup]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📞 Initializing CS Hub...")
    print("=" * 60)
    
    try:
        hub = CustomerServiceHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"CS Hub Error: {e}")
