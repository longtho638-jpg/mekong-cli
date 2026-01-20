"""
Messaging operations for the portal.
"""
import logging
from typing import List

from .base import BasePortal
from .entities_proxy import Message

logger = logging.getLogger(__name__)

class MessageOps(BasePortal):
    def send_message(self, client_id: str, content: str, sender: str = "agency") -> bool:
        """Gửi message trong portal."""
        if client_id not in self.messages:
            return False

        message = self.service.create_message_entity(
            client_id=client_id, content=content, sender=sender
        )

        self.messages[client_id].append(message)
        self.repository.save_messages(self.messages)

        logger.info(f"Message sent to {client_id} from {sender}")
        return True

    def get_client_messages(self, client_id: str, unread_only: bool = False) -> List[Message]:
        """Lấy messages của client."""
        if client_id not in self.messages:
            return []

        messages = self.messages[client_id]
        if unread_only:
            return [m for m in messages if not m.read]
        return messages

    def mark_messages_read(self, client_id: str, message_ids: List[str]) -> bool:
        """Đánh dấu messages đã đọc."""
        if client_id not in self.messages:
            return False

        updated = False
        for message in self.messages[client_id]:
            if message.id in message_ids:
                message.read = True
                updated = True

        if updated:
            self.repository.save_messages(self.messages)

        return updated
