from ..agent import BaseSwarmAgent
from ..types import AgentMessage, MessageType

class StrategistAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.type == MessageType.TASK:
            print(f"🧠 [Strategist] Analyzing market for: {message.content}")
            strategy = "Viral Tweet Campaign"
            self.send("creator", strategy)

class ContentCreatorAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "strategist":
            print(f"✍️ [Creator] Writing content for: {message.content}")
            content = "Exciting news! #AI"
            self.send("social", content)

class SocialManagerAgent(BaseSwarmAgent):
    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.sender == "creator":
            print(f"📢 [Social] Posting: {message.content}")
            self.send("orchestrator", "Campaign Launched", MessageType.RESULT)
