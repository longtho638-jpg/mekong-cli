from typing import Any, Dict

from ..knowledge.graph_client import GraphClient
from .agent import BaseSwarmAgent
from .bus import MessageBus
from .types import AgentMessage, MessageType


class SwarmOrchestrator:
    """
    The Hive Mind.
    Manages the lifecycle of the swarm and routes high-level intents.
    """

    def __init__(self):
        self.bus = MessageBus()
        self.graph = GraphClient() # Initialize Graph Connection
        self.agents: Dict[str, BaseSwarmAgent] = {}

    def register_agent(self, agent: BaseSwarmAgent):
        """Register an agent to the swarm."""
        self.agents[agent.id] = agent
        print(f"🐝 Swarm: Agent '{agent.name}' ({agent.id}) joined.")

    def broadcast(self, content: Any):
        """Send a message to all agents."""
        msg = AgentMessage(
            sender="orchestrator",
            recipient="all",
            type=MessageType.TASK,
            content=content,
        )
        self.bus.publish(msg)

    def dispatch(self, agent_id: str, content: Any):
        """Send a task to a specific agent."""
        if agent_id not in self.agents:
            print(f"❌ Agent {agent_id} not found")
            return

        msg = AgentMessage(
            sender="orchestrator",
            recipient=agent_id,
            type=MessageType.TASK,
            content=content,
        )
        self.bus.publish(msg)
