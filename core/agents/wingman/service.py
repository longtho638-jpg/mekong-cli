"""
AI Wingman Service - Business Logic.
"""
import logging
from typing import Any, Dict, List, Optional

from .models import AgencyOwnerProfile, Notification, NotificationType, WingmanMode

logger = logging.getLogger(__name__)

class AIWingmanService:
    def __init__(self, owner: AgencyOwnerProfile, mode: WingmanMode = WingmanMode.SEMI_AUTO):
        self.owner = owner
        self.mode = mode
        self.provider = None
        self.notifications: List[Notification] = []
        self.stats = {
            "inquiries_handled": 0,
            "proposals_sent": 0,
            "revenue_generated": 0.0,
        }

    def set_provider(self, provider):
        self.provider = provider

    def add_notification(self, notif: Notification):
        self.notifications.append(notif)
        logger.debug(f"Notification added: {notif.title}")

    def can_auto_respond(self) -> bool:
        return self.mode == WingmanMode.AUTO

    def needs_approval(self) -> bool:
        return self.mode == WingmanMode.SEMI_AUTO

    def update_stats(self, key: str, value: Any):
        if key in self.stats:
            if isinstance(value, (int, float)):
                self.stats[key] += value
            else:
                self.stats[key] = value

    def get_pending_notifications(self, unread_only: bool = True) -> List[Notification]:
        if unread_only:
            return [n for n in self.notifications if not n.read]
        return self.notifications
