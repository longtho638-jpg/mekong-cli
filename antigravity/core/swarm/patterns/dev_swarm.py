from ..agent import BaseSwarmAgent
from ..types import AgentMessage, MessageType


class ArchitectAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.type == MessageType.TASK:
            print(f"🏗️ [Architect] Designing solution for: {message.content}")
            # Simulate design work
            plan = f"Plan for {message.content}"
            self.send("coder", {"plan": plan, "original_task": message.content})


class CoderAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "architect":
            print(f"💻 [Coder] Implementing: {message.content['plan']}")
            # Simulate coding
            code = "def solution(): pass"
            self.send("reviewer", {"code": code})


class ReviewerAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "coder":
            print(f"🔍 [Reviewer] Reviewing code...")
            # Simulate review
            self.send("orchestrator", "Code Approved", MessageType.RESULT)
