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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class NotificationChannel(Enum):
    """Notification channels."""
    APP = "app"
    EMAIL = "email"
    SLACK = "slack"
    SMS = "sms"
    PUSH = "push"


class NotificationPriority(Enum):
    """Notification priority."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(Enum):
    """Notification types."""
    CLIENT = "client"
    PROJECT = "project"
    INVOICE = "invoice"
    TEAM = "team"
    SYSTEM = "system"


@dataclass
class Notification:
    """A notification."""
    id: str
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    channels: List[NotificationChannel] = field(default_factory=lambda: [NotificationChannel.APP])
    read: bool = False
    created_at: datetime = field(default_factory=datetime.now)


class NotificationCenter:
    """
    Notification Center.
    
    Unified notification management.
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
    
    def send(
        self,
        title: str,
        message: str,
        notification_type: NotificationType,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Notification:
        """Send a notification."""
        channels = self.preferences.get(notification_type, [NotificationChannel.APP])
        
        notification = Notification(
            id=f"NTF-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            message=message,
            type=notification_type,
            priority=priority,
            channels=channels
        )
        
        self.notifications.append(notification)
        return notification
    
    def mark_read(self, notification: Notification):
        """Mark notification as read."""
        notification.read = True
    
    def mark_all_read(self):
        """Mark all notifications as read."""
        for n in self.notifications:
            n.read = True
    
    def get_unread_count(self) -> int:
        """Get unread notification count."""
        return sum(1 for n in self.notifications if not n.read)
    
    def format_dashboard(self) -> str:
        """Format notification center dashboard."""
        unread = self.get_unread_count()
        urgent = sum(1 for n in self.notifications if n.priority == NotificationPriority.URGENT and not n.read)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔔 NOTIFICATION CENTER                                   ║",
            f"║  {len(self.notifications)} total │ {unread} unread │ {urgent} urgent                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📬 RECENT NOTIFICATIONS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        priority_icons = {"low": "⚪", "normal": "🔵", "high": "🟠", "urgent": "🔴"}
        type_icons = {"client": "👤", "project": "📁", "invoice": "💳", "team": "👥", "system": "⚙️"}
        
        for notif in self.notifications[-5:]:
            read_icon = "✓" if notif.read else "•"
            prio = priority_icons[notif.priority.value]
            ntype = type_icons[notif.type.value]
            
            lines.append(f"║  {read_icon} {prio} {ntype} {notif.title[:40]:<40}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📱 CHANNEL PREFERENCES                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for ntype, channels in list(self.preferences.items())[:4]:
            icon = type_icons[ntype.value]
            channel_str = ", ".join(c.value for c in channels)
            lines.append(f"║    {icon} {ntype.value:<12} → {channel_str:<30}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [✓ Mark All Read]  [⚙️ Settings]  [🗑️ Clear]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Stay informed!                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    center = NotificationCenter("Saigon Digital Hub")
    
    print("🔔 Notification Center")
    print("=" * 60)
    print()
    
    # Send notifications
    center.send("New Client", "Sunrise Realty signed up!", NotificationType.CLIENT, NotificationPriority.HIGH)
    center.send("Project Update", "Website redesign 75% complete", NotificationType.PROJECT)
    center.send("Invoice Paid", "$2,500 received from Coffee Lab", NotificationType.INVOICE)
    center.send("Team Update", "New team member joined", NotificationType.TEAM)
    center.send("System", "Backup completed successfully", NotificationType.SYSTEM, NotificationPriority.LOW)
    
    # Mark one as read
    center.mark_read(center.notifications[0])
    
    print(center.format_dashboard())
