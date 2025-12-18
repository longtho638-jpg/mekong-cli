"""
🔔 Notification System - Automated Alerts
==========================================

Automated notifications for agency operations.

Features:
- Payment reminders
- Project updates
- Report delivery
- Multi-channel (Email, SMS, Telegram)
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class NotificationType(Enum):
    """Notification types."""
    PAYMENT_REMINDER = "payment_reminder"
    PROJECT_UPDATE = "project_update"
    REPORT_READY = "report_ready"
    INVOICE_SENT = "invoice_sent"
    WELCOME = "welcome"
    MILESTONE = "milestone"


class Channel(Enum):
    """Notification channels."""
    EMAIL = "email"
    SMS = "sms"
    TELEGRAM = "telegram"
    SLACK = "slack"


class Priority(Enum):
    """Notification priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class Notification:
    """A notification to send."""
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


class NotificationSystem:
    """
    Notification System.
    
    Automate client communication.
    """
    
    def __init__(self):
        self.notifications: List[Notification] = []
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[NotificationType, Dict[str, str]]:
        """Load notification templates."""
        return {
            NotificationType.WELCOME: {
                "subject": "🏯 Welcome to {agency_name}!",
                "body": """
Hello {client_name}! 👋

Welcome aboard! We're thrilled to have {company} as our client.

Your dedicated team is ready to help you achieve:
✨ {goal_1}
✨ {goal_2}
✨ {goal_3}

Let's make magic happen!

Best,
{agency_name} Team 🏯
                """.strip()
            },
            NotificationType.PAYMENT_REMINDER: {
                "subject": "💳 Friendly reminder: Invoice {invoice_id} due soon",
                "body": """
Hi {client_name},

Just a friendly reminder that invoice {invoice_id} for {amount} is due on {due_date}.

Payment options:
• Bank transfer
• Credit card: {payment_link}

Questions? Reply to this email!

Thanks,
{agency_name}
                """.strip()
            },
            NotificationType.PROJECT_UPDATE: {
                "subject": "📊 Project Update: {project_name} ({progress}% complete)",
                "body": """
Hi {client_name}! 📊

Great news on your project "{project_name}"!

Current Progress: {progress}%
Status: {status}

✅ Completed:
{completed_items}

🔄 In Progress:
{in_progress_items}

📅 Next milestone: {next_milestone}

View full dashboard: {dashboard_link}

Cheers,
{agency_name}
                """.strip()
            },
            NotificationType.REPORT_READY: {
                "subject": "📈 Your {period} Report is Ready!",
                "body": """
Hi {client_name}! 📈

Your {period} performance report is ready!

Quick Highlights:
• Traffic: {traffic} ({traffic_change})
• Leads: {leads} ({leads_change})
• ROI: {roi}

View full report: {report_link}

Questions? We're here to help!

{agency_name} Team
                """.strip()
            },
            NotificationType.MILESTONE: {
                "subject": "🎉 Milestone Achieved: {milestone_name}!",
                "body": """
🎉 CONGRATULATIONS!

{client_name}, you've reached an amazing milestone:

✨ {milestone_name} ✨

{milestone_description}

Keep crushing it!

{agency_name} 🏯
                """.strip()
            }
        }
    
    def create_notification(
        self,
        type: NotificationType,
        channel: Channel,
        recipient: str,
        variables: Dict[str, str],
        priority: Priority = Priority.MEDIUM
    ) -> Notification:
        """Create a notification from template."""
        template = self.templates.get(type, {})
        
        subject = template.get("subject", "Notification")
        body = template.get("body", "")
        
        # Replace variables
        for key, value in variables.items():
            subject = subject.replace(f"{{{key}}}", str(value))
            body = body.replace(f"{{{key}}}", str(value))
        
        notification = Notification(
            id=f"NOT-{uuid.uuid4().hex[:6].upper()}",
            type=type,
            channel=channel,
            priority=priority,
            recipient=recipient,
            subject=subject,
            body=body
        )
        
        self.notifications.append(notification)
        return notification
    
    def send(self, notification_id: str) -> bool:
        """Mark notification as sent."""
        for n in self.notifications:
            if n.id == notification_id:
                n.sent_at = datetime.now()
                return True
        return False
    
    def format_notification(self, notification: Notification) -> str:
        """Format notification for display."""
        priority_icon = {
            Priority.LOW: "🔵",
            Priority.MEDIUM: "🟡",
            Priority.HIGH: "🟠",
            Priority.URGENT: "🔴"
        }[notification.priority]
        
        channel_icon = {
            Channel.EMAIL: "📧",
            Channel.SMS: "📱",
            Channel.TELEGRAM: "💬",
            Channel.SLACK: "💼"
        }[notification.channel]
        
        lines = [
            f"╔═══════════════════════════════════════════════════════════╗",
            f"║  {priority_icon} {notification.type.value.upper():<45}   ║",
            f"╠═══════════════════════════════════════════════════════════╣",
            f"║  {channel_icon} To: {notification.recipient:<40}       ║",
            f"║  Subject: {notification.subject[:45]:<45}  ║",
            f"╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Body (truncated)
        for line in notification.body.split('\n')[:8]:
            lines.append(f"║  {line[:55]:<55}  ║")
        
        lines.append(f"╚═══════════════════════════════════════════════════════════╝")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    system = NotificationSystem()
    
    print("🔔 Notification System")
    print("=" * 50)
    print()
    
    # Create welcome notification
    welcome = system.create_notification(
        type=NotificationType.WELCOME,
        channel=Channel.EMAIL,
        recipient="minh@saigoncoffee.vn",
        variables={
            "agency_name": "Agency OS",
            "client_name": "Minh",
            "company": "Saigon Coffee Co.",
            "goal_1": "Increase organic traffic by 50%",
            "goal_2": "Generate 100+ leads per month",
            "goal_3": "Achieve 3x ROI on marketing spend"
        }
    )
    
    print(system.format_notification(welcome))
    print()
    
    # Create payment reminder
    reminder = system.create_notification(
        type=NotificationType.PAYMENT_REMINDER,
        channel=Channel.EMAIL,
        recipient="minh@saigoncoffee.vn",
        priority=Priority.HIGH,
        variables={
            "client_name": "Minh",
            "invoice_id": "INV-202512-03FD",
            "amount": "$1,430.00",
            "due_date": "Jan 16, 2026",
            "payment_link": "https://pay.agencyos.network/xxx",
            "agency_name": "Agency OS"
        }
    )
    
    print(system.format_notification(reminder))
