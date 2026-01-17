"""
🔔 Notification Center - Unified Notifications
================================================

Central hub for all notifications.
Never miss anything important!

Features:
- Multi-channel notifications
- Priority levels
- Read/unread tracking
- Notification preferences
"""

import uuid
import logging
from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NotificationChannel(Enum):
    """Available delivery channels for notifications."""
    APP = "app"
    EMAIL = "email"
    SLACK = "slack"
    SMS = "sms"
    PUSH = "push"


class NotificationPriority(Enum):
    """Urgency levels for notifications."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(Enum):
    """Categories of system and business events."""
    CLIENT = "client"
    PROJECT = "project"
    INVOICE = "invoice"
    TEAM = "team"
    SYSTEM = "system"


@dataclass
class Notification:
    """An individual notification entity."""
    id: str
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    channels: List[NotificationChannel] = field(default_factory=lambda: [NotificationChannel.APP])
    read: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.title or not self.message:
            raise ValueError("Notification must have title and message")


class NotificationCenter:
    """
    Notification Center System.
    
    Orchestrates the dispatch, tracking, and user preference management for all agency alerts.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.notifications: List[Notification] = []
        self.preferences: Dict[NotificationType, List[NotificationChannel]] = {
            NotificationType.CLIENT: [NotificationChannel.APP, NotificationChannel.EMAIL],
            NotificationType.PROJECT: [NotificationChannel.APP, NotificationChannel.SLACK],
            NotificationType.INVOICE: [NotificationChannel.APP, NotificationChannel.EMAIL],
            NotificationType.TEAM: [NotificationChannel.APP, NotificationChannel.SLACK],
            NotificationType.SYSTEM: [NotificationChannel.APP],
        }
        logger.info(f"Notification Center initialized for {agency_name}")

    def send(
        self,
        title: str,
        message: str,
        n_type: NotificationType,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Notification:
        """Create and dispatch a new notification based on configured channels."""
        channels = self.preferences.get(n_type, [NotificationChannel.APP])

        notification = Notification(
            id=f"NTF-{uuid.uuid4().hex[:6].upper()}",
            title=title, message=message, type=n_type,
            priority=priority, channels=channels
        )

        self.notifications.append(notification)
        logger.info(f"Notification Sent: {title} ({priority.value})")
        return notification

    def mark_as_read(self, n_id: str) -> bool:
        """Update read status for a specific notification ID."""
        for n in self.notifications:
            if n.id == n_id:
                n.read = True
                logger.debug(f"Notification {n_id} marked as read")
                return True
        return False

    def get_unread_count(self) -> int:
        """Count currently unread notifications."""
        return sum(1 for n in self.notifications if not n.read)

    def format_dashboard(self) -> str:
        """Render the Notification Center Dashboard."""
        unread = self.get_unread_count()
        urgent = sum(1 for n in self.notifications if n.priority == NotificationPriority.URGENT and not n.read)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔔 NOTIFICATION CENTER DASHBOARD{' ' * 30}║",
            f"║  {len(self.notifications)} total │ {unread} unread │ {urgent} urgent alerts{' ' * 15}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📬 RECENT ALERTS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        p_icons = {"low": "⚪", "normal": "🔵", "high": "🟠", "urgent": "🔴"}
        t_icons = {"client": "👤", "project": "📁", "invoice": "💳", "team": "👥", "system": "⚙️"}

        # Display latest 5
        for n in self.notifications[-5:]:
            read_st = "✓" if n.read else "•"
            p = p_icons.get(n.priority.value, "⚪")
            t = t_icons.get(n.type.value, "📋")
            lines.append(f"║  {read_st} {p} {t} {n.title[:45]:<45} ║")

        lines.extend([
            "║                                                           ║",
            "║  [✓ Mark All Read]  [⚙️ Settings]  [🗑️ Clear Cache]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Stay Updated!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔔 Initializing Notification Center...")
    print("=" * 60)

    try:
        center = NotificationCenter("Saigon Digital Hub")

        # Seed
        center.send("New Lead", "Sunrise Realty interested", NotificationType.CLIENT, NotificationPriority.HIGH)
        center.send("System Update", "V2.5.0 deployed", NotificationType.SYSTEM)

        print("\n" + center.format_dashboard())

    except Exception as e:
        logger.error(f"Notification Error: {e}")
