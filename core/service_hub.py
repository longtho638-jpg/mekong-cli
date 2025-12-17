"""
📞 Customer Service Hub - Department Integration
==================================================

Central hub connecting all Customer Service roles
with their operational tools.

Integrates:
- Technical Support Specialist → support_tickets.py
- CS Team Lead → team management
- Customer Service Rep → support_tickets.py
- Call Center Agent → call logging
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import existing Ops modules
from core.support_tickets import SupportTickets, TicketPriority, TicketStatus

# Import role modules
from core.tech_support import TechSupportSpecialist, IssueCategory
from core.cs_team_lead import CSTeamLead, AgentStatus
from core.cs_rep import CustomerServiceRep, InquiryType
from core.call_center import CallCenterAgent, CallType


@dataclass
class CustomerServiceMetrics:
    """Department-wide metrics."""
    total_agents: int
    agents_available: int
    open_tickets: int
    calls_today: int
    avg_satisfaction: float
    escalations: int


class CustomerServiceHub:
    """
    Customer Service Hub.
    
    Connects all CS roles with their tools.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize Ops modules
        self.tickets_ops = SupportTickets(agency_name)
        
        # Initialize role modules
        self.tech_support = TechSupportSpecialist(agency_name)
        self.team_lead = CSTeamLead(agency_name)
        self.service_rep = CustomerServiceRep(agency_name)
        self.call_center = CallCenterAgent(agency_name)
    
    def get_department_metrics(self) -> CustomerServiceMetrics:
        """Get department-wide metrics."""
        team_stats = self.team_lead.get_team_stats()
        ticket_stats = self.tickets_ops.get_stats()
        call_stats = self.call_center.get_stats()
        
        return CustomerServiceMetrics(
            total_agents=team_stats.get("total_agents", 0),
            agents_available=team_stats.get("available", 0),
            open_tickets=ticket_stats.get("open", 0),
            calls_today=call_stats.get("calls_today", 0),
            avg_satisfaction=team_stats.get("avg_satisfaction", 0),
            escalations=team_stats.get("open_escalations", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📞 CUSTOMER SERVICE HUB                                  ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👥 Total Agents:       {metrics.total_agents:>5}                          ║",
            f"║    🟢 Agents Available:   {metrics.agents_available:>5}                          ║",
            f"║    🎫 Open Tickets:       {metrics.open_tickets:>5}                          ║",
            f"║    📞 Calls Today:        {metrics.calls_today:>5}                          ║",
            f"║    ⭐ Avg Satisfaction:   {metrics.avg_satisfaction:>5.1f}                          ║",
            f"║    ⚠️ Open Escalations:   {metrics.escalations:>5}                          ║",
            "║                                                           ║",
            "║  🔗 ROLE → OPS CONNECTIONS                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🔧 Tech Support        → support_tickets.py           ║",
            "║    👑 Team Lead           → team management              ║",
            "║    🎧 Service Rep         → support_tickets.py           ║",
            "║    📞 Call Center         → call logging                 ║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 Team]  [⚙️ Settings]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Service Excellence!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = CustomerServiceHub("Saigon Digital Hub")
    
    print("📞 Customer Service Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.team_lead.add_agent("Sarah", 15, 4.5, 4.8)
    hub.team_lead.add_agent("Mike", 12, 5.0, 4.5)
    
    hub.tickets_ops.create_ticket("Sunrise Realty", "Help needed", "desc", TicketPriority.MEDIUM)
    
    print(hub.format_hub_dashboard())
