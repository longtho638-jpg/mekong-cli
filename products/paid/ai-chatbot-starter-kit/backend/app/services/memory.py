import redis.asyncio as redis
import json
from typing import List
from app.config import get_settings
from app.models.chat import Message, Role

settings = get_settings()

class MemoryService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.ttl = 86400 * 7  # 7 days retention for active chats

    def _get_key(self, conversation_id: str) -> str:
        return f"chat:{conversation_id}"

    async def add_message(self, conversation_id: str, message: Message):
        """Add a message to the conversation history"""
        key = self._get_key(conversation_id)
        # Serialize message to JSON
        msg_json = message.model_dump_json()
        await self.redis.rpush(key, msg_json)
        await self.redis.expire(key, self.ttl)

    async def get_history(self, conversation_id: str) -> List[Message]:
        """Get full conversation history"""
        key = self._get_key(conversation_id)
        raw_msgs = await self.redis.lrange(key, 0, -1)
        return [Message.model_validate_json(msg) for msg in raw_msgs]

    async def clear_history(self, conversation_id: str):
        """Clear conversation history"""
        key = self._get_key(conversation_id)
        await self.redis.delete(key)
