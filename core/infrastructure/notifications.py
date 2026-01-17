"""
🔔 Notification System - Automated Templated Alerts
===================================================

Automated notifications for agency operations.
Handles templating and multi-channel delivery.

Features:
- Payment reminders
- Project updates
- Report delivery
- Multi-channel (Email, SMS, Telegram)
"""

import uuid
import logging
from typing import Optional, Dict, List
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NotificationType(Enum):
    """Categories of automated alerts."""
    PAYMENT_REMINDER = "payment_reminder"
    PROJECT_UPDATE = "project_update"
    REPORT_READY = "report_ready"
    INVOICE_SENT = "invoice_sent"
    WELCOME = "welcome"
    MILESTONE = "milestone"


class Channel(Enum):
    """Supported communication channels."""
    EMAIL = "email"
    SMS = "sms"
    TELEGRAM = "telegram"
    SLACK = "slack"


class Priority(Enum):
    """Urgency levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class Notification:
    """A notification record entity."""
    id: str
    type: NotificationType
    channel: Channel
    priority: Priority
    recipient: str
    subject: str
    body: str
    created_at: datetime = field(default_factory=datetime.now)
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    def __post_init__(self):
        if not self.recipient or not self.body:
            raise ValueError("Recipient and body are mandatory")


class NotificationSystem:
    """
    Notification System.
    
    Manages automated client communication via templated alerts.
    """

    def __init__(self):
        self.notifications: List[Notification] = []
        logger.info("Notification System initialized.")
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[NotificationType, Dict[str, str]]:
        """Load default notification templates."""
        return {
            NotificationType.WELCOME: {
                "subject": "🏯 Welcome to {agency_name}!",
                "body": "Hello {client_name}! We're thrilled to have {company} as our client."
            },
            NotificationType.PAYMENT_REMINDER: {
                "subject": "💳 Reminder: Invoice {invoice_id}",
                "body": "Hi {client_name}, your invoice for {amount} is due on {due_date}."
            }
        }

    def create_notification(
        self,
        n_type: NotificationType,
        channel: Channel,
        recipient: str,
        variables: Dict[str, str],
        priority: Priority = Priority.MEDIUM
    ) -> Notification:
        """Execute template rendering and create a new notification."""
        tpl = self.templates.get(n_type, {"subject": "Alert", "body": "Default message"})

        subject = tpl["subject"]
        body = tpl["body"]

        # Safe interpolation
        for k, v in variables.items():
            subject = subject.replace(f"{{{k}}}", str(v))
            body = body.replace(f"{{{k}}}", str(v))

        notification = Notification(
            id=f"NOT-{uuid.uuid4().hex[:6].upper()}",
            type=n_type, channel=channel, priority=priority,
            recipient=recipient, subject=subject, body=body
        )

        self.notifications.append(notification)
        logger.info(f"Created {n_type.value} for {recipient} via {channel.value}")
        return notification

    def format_notification(self, n: Notification) -> str:
        """Render a single notification record as ASCII."""
        p_icon = {Priority.LOW: "🔵", Priority.MEDIUM: "🟡", Priority.HIGH: "🟠", Priority.URGENT: "🔴"}.get(n.priority, "⚪")
        c_icon = {Channel.EMAIL: "📧", Channel.SMS: "📱", Channel.TELEGRAM: "💬", Channel.SLACK: "💼"}.get(n.channel, "📦")

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  {p_icon} {n.type.value.upper():<45}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  {c_icon} To: {n.recipient:<40}       ║",
            f"║  Sub: {n.subject[:45]:<45}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for line in n.body.split('\n')[:5]:
            lines.append(f"║  {line[:55]:<55}  ║")

        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔔 Initializing Notification System...")
    print("=" * 60)

    try:
        sys = NotificationSystem()
        notif = sys.create_notification(
            NotificationType.WELCOME, Channel.EMAIL, "client@corp.co",
            {"agency_name": "AgencyOS", "client_name": "John", "company": "Acme"}
        )
        print("\n" + sys.format_notification(notif))

    except Exception as e:
        logger.error(f"System Error: {e}")
