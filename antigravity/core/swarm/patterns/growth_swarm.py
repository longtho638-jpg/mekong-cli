from antigravity.core.telemetry import agent_telemetry
from ..agent import BaseSwarmAgent
from ..types import AgentMessage, MessageType


class StrategistAgent(BaseSwarmAgent):
    @agent_telemetry(operation="strategist_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.type == MessageType.TASK:
            print(f"🧠 [Strategist] Analyzing market for: {message.content}")
            strategy = "Viral Tweet Campaign"
            self.send("creator", strategy)


class ContentCreatorAgent(BaseSwarmAgent):
    @agent_telemetry(operation="creator_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "strategist":
            print(f"✍️ [Creator] Writing content for: {message.content}")
            content = "Exciting news! #AI"
            self.send("social", content)


class SocialManagerAgent(BaseSwarmAgent):
    @agent_telemetry(operation="social_on_message")
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "creator":
            print(f"📢 [Social] Posting: {message.content}")
            self.send("orchestrator", "Campaign Launched", MessageType.RESULT)
