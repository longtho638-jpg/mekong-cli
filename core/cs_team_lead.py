"""
👑 Customer Service Team Lead - Team Leadership
=================================================

Lead the customer service team.
Excellence in service!

Roles:
- Team management
- Performance monitoring
- Quality assurance
- Escalation handling
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class AgentStatus(Enum):
    """Agent status."""
    AVAILABLE = "available"
    ON_CALL = "on_call"
    BREAK = "break"
    TRAINING = "training"
    OFFLINE = "offline"


@dataclass
class ServiceAgent:
    """A customer service agent."""
    id: str
    name: str
    status: AgentStatus = AgentStatus.AVAILABLE
    calls_today: int = 0
    avg_handle_time: float = 0  # minutes
    satisfaction_score: float = 0  # 1-5
    tickets_resolved: int = 0


@dataclass
class Escalation:
    """A service escalation."""
    id: str
    agent_id: str
    client: str
    issue: str
    escalated_to: str
    resolved: bool = False
    created_at: datetime = field(default_factory=datetime.now)


class CSTeamLead:
    """
    Customer Service Team Lead.
    
    Lead service excellence.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.agents: Dict[str, ServiceAgent] = {}
        self.escalations: List[Escalation] = []
    
    def add_agent(
        self,
        name: str,
        calls: int = 0,
        handle_time: float = 5,
        satisfaction: float = 4.5
    ) -> ServiceAgent:
        """Add a service agent."""
        agent = ServiceAgent(
            id=f"AGT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            calls_today=calls,
            avg_handle_time=handle_time,
            satisfaction_score=satisfaction
        )
        self.agents[agent.id] = agent
        return agent
    
    def set_status(self, agent: ServiceAgent, status: AgentStatus):
        """Set agent status."""
        agent.status = status
    
    def create_escalation(
        self,
        agent: ServiceAgent,
        client: str,
        issue: str,
        escalated_to: str
    ) -> Escalation:
        """Create an escalation."""
        esc = Escalation(
            id=f"ESC-{uuid.uuid4().hex[:6].upper()}",
            agent_id=agent.id,
            client=client,
            issue=issue,
            escalated_to=escalated_to
        )
        self.escalations.append(esc)
        return esc
    
    def get_team_stats(self) -> Dict[str, Any]:
        """Get team statistics."""
        if not self.agents:
            return {}
        
        total_calls = sum(a.calls_today for a in self.agents.values())
        avg_satisfaction = sum(a.satisfaction_score for a in self.agents.values()) / len(self.agents)
        available = sum(1 for a in self.agents.values() if a.status == AgentStatus.AVAILABLE)
        
        return {
            "total_agents": len(self.agents),
            "available": available,
            "total_calls": total_calls,
            "avg_satisfaction": avg_satisfaction,
            "open_escalations": sum(1 for e in self.escalations if not e.resolved)
        }
    
    def format_dashboard(self) -> str:
        """Format team lead dashboard."""
        stats = self.get_team_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👑 CS TEAM LEAD                                          ║",
            f"║  {stats.get('total_agents', 0)} agents │ {stats.get('available', 0)} available │ {stats.get('total_calls', 0)} calls today  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 TEAM STATUS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"available": "🟢", "on_call": "📞", "break": "☕", "training": "📚", "offline": "⚪"}
        
        for agent in list(self.agents.values())[:5]:
            icon = status_icons.get(agent.status.value, "⚪")
            stars = "⭐" * int(agent.satisfaction_score)
            
            lines.append(f"║  {icon} {agent.name[:15]:<15} │ {agent.calls_today:>2} calls │ {stars:<5}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 TEAM METRICS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📞 Total Calls:        {stats.get('total_calls', 0):>5}                       ║",
            f"║    ⭐ Avg Satisfaction:   {stats.get('avg_satisfaction', 0):>5.1f}                       ║",
            f"║    ⚠️ Open Escalations:   {stats.get('open_escalations', 0):>5}                       ║",
            "║                                                           ║",
            "║  ⚠️ RECENT ESCALATIONS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for esc in self.escalations[-3:]:
            icon = "✅" if esc.resolved else "🔴"
            lines.append(f"║  {icon} {esc.client[:15]:<15} │ {esc.issue[:25]:<25}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [👥 Team View]  [📊 Reports]  [⚠️ Escalations]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Service excellence!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    lead = CSTeamLead("Saigon Digital Hub")
    
    print("👑 CS Team Lead")
    print("=" * 60)
    print()
    
    a1 = lead.add_agent("Sarah Kim", 15, 4.5, 4.8)
    a2 = lead.add_agent("Mike Chen", 12, 5.0, 4.5)
    a3 = lead.add_agent("Lisa Tran", 18, 3.8, 4.9)
    a4 = lead.add_agent("Tom Lee", 8, 6.2, 4.2)
    
    # Set statuses
    lead.set_status(a1, AgentStatus.ON_CALL)
    lead.set_status(a4, AgentStatus.BREAK)
    
    # Create escalation
    lead.create_escalation(a2, "Tech Startup", "Refund request dispute", "Manager")
    
    print(lead.format_dashboard())
