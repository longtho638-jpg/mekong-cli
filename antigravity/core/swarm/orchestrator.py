import logging
from typing import Any, Dict

from backend.api.security.audit import audit_logger

from ..knowledge.graph_client import GraphClient
from .agent import BaseSwarmAgent
from .bus import MessageBus
from .types import AgentMessage, MessageType

logger = logging.getLogger(__name__)


class SwarmOrchestrator:
    """
    The Hive Mind.
    Manages the lifecycle of the swarm and routes high-level intents.
    """

    def __init__(self, websocket_manager: Any = None):
        self.bus = MessageBus(websocket_manager=websocket_manager)
        self.graph = GraphClient() # Initialize Graph Connection
        self.agents: Dict[str, BaseSwarmAgent] = {}

    def register_agent(self, agent: BaseSwarmAgent):
        """Register an agent to the swarm."""
        self.agents[agent.id] = agent
        logger.info(f"🐝 Swarm: Agent '{agent.name}' ({agent.id}) joined.")
        audit_logger.log_event(
            event_type="SWARM",
            user="system",
            action="AGENT_REGISTER",
            resource=agent.id,
            details={"name": agent.name}
        )

    def broadcast(self, content: Any):
        """Send a message to all agents."""
        msg = AgentMessage(
            sender="orchestrator",
            recipient="all",
            type=MessageType.TASK,
            content=content,
        )
        self.bus.publish(msg)
        audit_logger.log_event(
            event_type="SWARM",
            user="orchestrator",
            action="BROADCAST",
            resource="all",
            details={"content": str(content)[:100]}
        )

    def dispatch(self, agent_id: str, content: Any):
        """Send a task to a specific agent."""
        if agent_id not in self.agents:
            logger.error(f"❌ Agent {agent_id} not found")
            return

        msg = AgentMessage(
            sender="orchestrator",
            recipient=agent_id,
            type=MessageType.TASK,
            content=content,
        )
        self.bus.publish(msg)
        audit_logger.log_event(
            event_type="SWARM",
            user="orchestrator",
            action="DISPATCH",
            resource=agent_id,
            details={"content": str(content)[:100]}
        )
