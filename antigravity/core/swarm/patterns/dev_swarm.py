import logging
from antigravity.core.telemetry import agent_telemetry

from ..agent import BaseSwarmAgent
from ..types import AgentMessage, MessageType

logger = logging.getLogger(__name__)


class ArchitectAgent(BaseSwarmAgent):
    @agent_telemetry(operation="architect_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.type == MessageType.TASK:
            logger.info(f"🏗️ [Architect] Designing solution for: {message.content}")
            # Simulate design work
            plan = f"Plan for {message.content}"
            self.send("coder", {"plan": plan, "original_task": message.content})


class CoderAgent(BaseSwarmAgent):
    @agent_telemetry(operation="coder_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "architect":
            logger.info(f"💻 [Coder] Implementing: {message.content['plan']}")
            # Simulate coding
            code = "def solution(): pass"
            self.send("reviewer", {"code": code})


class ReviewerAgent(BaseSwarmAgent):
    @agent_telemetry(operation="reviewer_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "coder":
            logger.info("🔍 [Reviewer] Reviewing code...")
            # Simulate review
            self.send("orchestrator", "Code Approved", MessageType.RESULT)
