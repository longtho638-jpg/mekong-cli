"""
Chatbot Agent Facade.
"""
from typing import Dict

from .engine import ChatbotEngine
from .models import Channel, Conversation, Intent, Message


class ChatbotAgent(ChatbotEngine):
    """Refactored Chatbot Agent."""
    def __init__(self, vibe: str = "mien-tay"):
        super().__init__(vibe)
        self.name = "Chatbot"
        self.status = "ready"

    def handle_message(self, channel: Channel, sender_id: str, sender_name: str, content: str) -> Message:
        conv_id = f"{channel.value}_{sender_id}"
        if conv_id not in self.conversations:
            self.conversations[conv_id] = Conversation(id=conv_id, channel=channel, customer_id=sender_id, customer_name=sender_name)
        conv = self.conversations[conv_id]
        intent = self.classify_intent(content)
        customer_msg = Message(id=f"msg_{len(conv.messages)}", channel=channel, sender_id=sender_id, content=content, intent=intent)
        conv.messages.append(customer_msg)
        reply_text = self.generate_reply(intent, sender_name)
        bot_msg = Message(id=f"msg_{len(conv.messages)}", channel=channel, sender_id="bot", content=reply_text, is_bot=True)
        conv.messages.append(bot_msg)
        return bot_msg

__all__ = ['ChatbotAgent', 'Intent', 'Channel', 'Message', 'Conversation']
