"""
Agent Registry Module.
"""
import logging
import threading
import uuid
from typing import Callable, Dict, List, Optional

from .enums import AgentRole
from .models import SwarmAgent

logger = logging.getLogger(__name__)


class AgentRegistry:
    """Manages agent registration and retrieval."""

    def __init__(self):
        self.agents: Dict[str, SwarmAgent] = {}
        self._lock = threading.Lock()

    def register(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: List[str] = None,
    ) -> str:
        """Register an agent."""
        agent_id = f"agent_{uuid.uuid4().hex[:8]}"

        agent = SwarmAgent(
            id=agent_id,
            name=name,
            role=role,
            handler=handler,
            specialties=specialties or [],
        )

        with self._lock:
            self.agents[agent_id] = agent

        logger.info(f"🔗 Agent registered: {name} ({role.value})")
        return agent_id

    def get_agent(self, agent_id: str) -> Optional[SwarmAgent]:
        """Get agent by ID."""
        with self._lock:
            return self.agents.get(agent_id)

    def get_all_agents(self) -> Dict[str, SwarmAgent]:
        """Get all agents."""
        with self._lock:
            return self.agents.copy()

    def get_available_agents(self) -> List[SwarmAgent]:
        """Get available agents for work."""
        with self._lock:
            return [
                a
                for a in self.agents.values()
                if not a.is_busy and a.role in [AgentRole.WORKER, AgentRole.SPECIALIST]
            ]
