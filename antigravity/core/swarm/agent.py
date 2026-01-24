import logging
from typing import Any

from antigravity.core.telemetry import agent_telemetry
from .bus import MessageBus
from .types import AgentMessage, MessageType

logger = logging.getLogger(__name__)


class BaseSwarmAgent:
    """
    Base class for Swarm-compatible agents.
    Wraps existing specialized agents or creates new ones.
    """

    def __init__(self, agent_id: str, name: str, bus: MessageBus):
        self.id = agent_id
        self.name = name
        self.bus = bus
        self.bus.subscribe(self.id, self.on_message)
        self.bus.subscribe("all", self.on_message)

    @agent_telemetry(operation="swarm_on_message")
    def on_message(self, message: AgentMessage):
        """Handle incoming message."""
        # Override this
        logger.debug(f"[{self.name}] Received: {message.type.value} from {message.sender}")

    def send(
        self, recipient: str, content: Any, msg_type: MessageType = MessageType.TASK
    ):
        """Send a message to another agent."""
        msg = AgentMessage(
            sender=self.id, recipient=recipient, type=msg_type, content=content
        )
        self.bus.publish(msg)

    @agent_telemetry(operation="swarm_process")
    async def process(self, task: Any) -> Any:
        """Main processing logic."""
        raise NotImplementedError
