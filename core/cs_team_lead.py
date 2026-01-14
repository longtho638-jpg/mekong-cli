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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    """Real-time availability status of a service agent."""
    AVAILABLE = "available"
    ON_CALL = "on_call"
    BREAK = "break"
    TRAINING = "training"
    OFFLINE = "offline"


@dataclass
class ServiceAgent:
    """A customer service agent entity."""
    id: str
    name: str
    status: AgentStatus = AgentStatus.AVAILABLE
    calls_today: int = 0
    avg_handle_time: float = 0.0  # minutes
    satisfaction_score: float = 0.0  # 1-5
    tickets_resolved: int = 0

    def __post_init__(self):
        if not 0 <= self.satisfaction_score <= 5:
            raise ValueError("Satisfaction score must be between 0 and 5")


@dataclass
class Escalation:
    """A critical service issue requiring leadership attention."""
    id: str
    agent_id: str
    client: str
    issue: str
    escalated_to: str
    resolved: bool = False
    created_at: datetime = field(default_factory=datetime.now)


class CSTeamLead:
    """
    Customer Service Team Lead System.
    
    Manages a roster of agents, tracks performance, and handles escalations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.agents: Dict[str, ServiceAgent] = {}
        self.escalations: List[Escalation] = []
        logger.info(f"CS Team Lead system initialized for {agency_name}")
    
    def add_agent(
        self,
        name: str,
        calls: int = 0,
        handle_time: float = 5.0,
        satisfaction: float = 4.5
    ) -> ServiceAgent:
        """Add a new agent to the CS team."""
        if not name:
            raise ValueError("Agent name is required")

        agent = ServiceAgent(
            id=f"AGT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            calls_today=calls,
            avg_handle_time=handle_time,
            satisfaction_score=satisfaction
        )
        self.agents[agent.id] = agent
        logger.info(f"Agent added: {name} ({agent.id})")
        return agent
    
    def update_agent_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update an agent's current working status."""
        if agent_id not in self.agents:
            return False
        
        old_status = self.agents[agent_id].status
        self.agents[agent_id].status = status
        logger.info(f"Agent {agent_id} status change: {old_status.value} -> {status.value}")
        return True
    
    def trigger_escalation(
        self,
        agent_id: str,
        client: str,
        issue: str,
        target_leader: str = "Manager"
    ) -> Optional[Escalation]:
        """Create a new escalation ticket."""
        if agent_id not in self.agents:
            logger.error(f"Cannot escalate: Agent {agent_id} not found")
            return None

        esc = Escalation(
            id=f"ESC-{uuid.uuid4().hex[:6].upper()}",
            agent_id=agent_id,
            client=client,
            issue=issue,
            escalated_to=target_leader
        )
        self.escalations.append(esc)
        logger.warning(f"ESCALATION: {client} - {issue} (Assigned to {target_leader})")
        return esc
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level team metrics."""
        if not self.agents:
            return {"count": 0, "available": 0, "avg_sat": 0.0}
            
        total_calls = sum(a.calls_today for a in self.agents.values())
        avg_sat = sum(a.satisfaction_score for a in self.agents.values()) / len(self.agents)
        available = sum(1 for a in self.agents.values() if a.status == AgentStatus.AVAILABLE)
        
        return {
            "total_agents": len(self.agents),
            "available_count": available,
            "total_calls": total_calls,
            "avg_satisfaction": avg_sat,
            "open_escalations": sum(1 for e in self.escalations if not e.resolved)
        }
    
    def format_dashboard(self) -> str:
        """Render the Team Lead Dashboard."""
        stats = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👑 CS TEAM LEAD DASHBOARD{' ' * 34}║",
            f"║  {stats.get('total_agents', 0)} agents │ {stats.get('available_count', 0)} available │ {stats.get('total_calls', 0)} calls today  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 ACTIVE TEAM ROSTER                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        status_icons = {
            AgentStatus.AVAILABLE: "🟢", AgentStatus.ON_CALL: "📞", 
            AgentStatus.BREAK: "☕", AgentStatus.TRAINING: "📚", 
            AgentStatus.OFFLINE: "⚪"
        }
        
        for agent in list(self.agents.values())[:5]:
            icon = status_icons.get(agent.status, "⚪")
            # Star rating
            stars = "★" * int(agent.satisfaction_score) + "☆" * (5 - int(agent.satisfaction_score))
            lines.append(f"║  {icon} {agent.name[:15]:<15} │ {agent.calls_today:>3} calls │ {stars}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚨 PRIORITY ESCALATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        active_esc = [e for e in self.escalations if not e.resolved][:3]
        if not active_esc:
            lines.append("║    ✅ No active escalations. Team is operating smoothly.  ║")
        else:
            for esc in active_esc:
                lines.append(f"║    🔴 {esc.client[:15]:<15} │ {esc.issue[:28]:<28} ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [👥 Team View]  [📊 Real-time Stats]  [⚠️ Escalations]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👑 Initializing CS Team Lead...")
    print("=" * 60)
    
    try:
        lead_system = CSTeamLead("Saigon Digital Hub")
        
        # Seed agents
        a1 = lead_system.add_agent("Sarah Kim", 15, 4.5, 4.8)
        lead_system.add_agent("Mike Chen", 12, 5.0, 4.2)
        
        # Interactions
        lead_system.update_agent_status(a1.id, AgentStatus.ON_CALL)
        lead_system.trigger_escalation(a1.id, "TechCorp", "Billing error dispute")
        
        print("\n" + lead_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Lead Error: {e}")
