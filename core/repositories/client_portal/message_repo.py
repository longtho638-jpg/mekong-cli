"""
Message database operations.
"""
import json
import logging
from datetime import datetime
from typing import Dict, List

from .base import BaseRepository

try:
    from ...services.client_portal_service import Message
except ImportError:
    from services.client_portal_service import Message

logger = logging.getLogger(__name__)

class MessageRepo(BaseRepository):
    def save_messages(self, messages: Dict[str, List[Message]]) -> bool:
        """Lưu messages theo client."""
        try:
            data = {}
            for client_id, message_list in messages.items():
                messages_data = []
                for message in message_list:
                    messages_data.append(
                        {
                            "id": message.id,
                            "client_id": message.client_id,
                            "sender": message.sender,
                            "content": message.content,
                            "timestamp": message.timestamp.isoformat(),
                            "read": message.read,
                        }
                    )
                data[client_id] = messages_data

            with open(self.messages_file, "w") as f:
                json.dump(data, f, indent=2)

            total_messages = sum(len(msg_list) for msg_list in messages.values())
            logger.info(f"Saved {total_messages} messages for {len(messages)} clients")
            return True
        except Exception as e:
            logger.error(f"Failed to save messages: {e}")
            return False

    def load_messages(self) -> Dict[str, List[Message]]:
        """Tải messages theo client."""
        try:
            if not self.messages_file.exists():
                return {}

            with open(self.messages_file, "r") as f:
                data = json.load(f)

            messages = {}
            for client_id, messages_data in data.items():
                message_list = []
                for message_data in messages_data:
                    message = Message(
                        id=message_data["id"],
                        client_id=message_data["client_id"],
                        sender=message_data["sender"],
                        content=message_data["content"],
                        timestamp=datetime.fromisoformat(message_data["timestamp"]),
                        read=message_data.get("read", False),
                    )
                    message_list.append(message)
                messages[client_id] = message_list

            total_messages = sum(len(msg_list) for msg_list in messages.values())
            logger.info(f"Loaded {total_messages} messages for {len(messages)} clients")
            return messages
        except Exception as e:
            logger.error(f"Failed to load messages: {e}")
            return {}
