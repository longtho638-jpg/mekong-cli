"""
💬 Slack Integration - Team Communication
===========================================

Integrate with Slack for team notifications.
Keep your team in the loop!

Features:
- Channel notifications
- Event alerts
- Custom bot messages
- Slash commands
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class SlackChannel(Enum):
    """Common Slack channels."""
    GENERAL = "#general"
    SALES = "#sales"
    PROJECTS = "#projects"
    SUPPORT = "#support"
    ALERTS = "#alerts"


class NotificationType(Enum):
    """Notification types."""
    NEW_CLIENT = "new_client"
    NEW_PROJECT = "new_project"
    INVOICE_PAID = "invoice_paid"
    MILESTONE = "milestone"
    ALERT = "alert"


@dataclass
class SlackMessage:
    """A Slack message."""
    id: str
    channel: str
    message: str
    sent: bool = False
    timestamp: datetime = field(default_factory=datetime.now)


class SlackIntegration:
    """
    Slack Integration.
    
    Send notifications to Slack channels.
    """
    
    def __init__(self, agency_name: str, workspace: str = ""):
        self.agency_name = agency_name
        self.workspace = workspace or agency_name.lower().replace(" ", "-")
        self.connected = True
        self.messages: List[SlackMessage] = []
        self.channel_rules: Dict[NotificationType, str] = {
            NotificationType.NEW_CLIENT: SlackChannel.SALES.value,
            NotificationType.NEW_PROJECT: SlackChannel.PROJECTS.value,
            NotificationType.INVOICE_PAID: SlackChannel.SALES.value,
            NotificationType.MILESTONE: SlackChannel.PROJECTS.value,
            NotificationType.ALERT: SlackChannel.ALERTS.value,
        }
    
    def send_message(self, channel: str, message: str) -> SlackMessage:
        """Send a message to Slack."""
        msg = SlackMessage(
            id=f"MSG-{uuid.uuid4().hex[:6].upper()}",
            channel=channel,
            message=message,
            sent=self.connected
        )
        self.messages.append(msg)
        return msg
    
    def notify(self, notification_type: NotificationType, data: Dict[str, Any]) -> SlackMessage:
        """Send a typed notification."""
        channel = self.channel_rules.get(notification_type, SlackChannel.GENERAL.value)
        
        # Format message based on type
        messages = {
            NotificationType.NEW_CLIENT: f"🎉 New client: *{data.get('name', 'Unknown')}*",
            NotificationType.NEW_PROJECT: f"📋 New project: *{data.get('name', 'Unknown')}* for {data.get('client', 'Unknown')}",
            NotificationType.INVOICE_PAID: f"💰 Invoice paid: *${data.get('amount', 0):,.0f}* from {data.get('client', 'Unknown')}",
            NotificationType.MILESTONE: f"🎯 Milestone complete: *{data.get('name', 'Unknown')}* ({data.get('progress', 0)}%)",
            NotificationType.ALERT: f"⚠️ Alert: {data.get('message', 'Unknown alert')}",
        }
        
        message = messages.get(notification_type, str(data))
        return self.send_message(channel, message)
    
    def format_dashboard(self) -> str:
        """Format Slack integration dashboard."""
        status = "🟢 Connected" if self.connected else "🔴 Disconnected"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💬 SLACK INTEGRATION                                     ║",
            f"║  Workspace: {self.workspace:<40}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Status: {status:<44}  ║",
            f"║  Messages Sent: {len(self.messages):<36}  ║",
            "║                                                           ║",
            "║  📢 CHANNEL ROUTING                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for ntype, channel in self.channel_rules.items():
            lines.append(f"║    {ntype.value:<20} → {channel:<25}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📨 RECENT MESSAGES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for msg in self.messages[-4:]:
            status_icon = "✅" if msg.sent else "❌"
            text = msg.message[:40]
            lines.append(f"║    {status_icon} {msg.channel:<10} │ {text:<31}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [⚙️ Configure]  [📝 Custom Rules]  [🔔 Test]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Team in sync!                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    slack = SlackIntegration("Saigon Digital Hub")
    
    print("💬 Slack Integration")
    print("=" * 60)
    print()
    
    # Send notifications
    slack.notify(NotificationType.NEW_CLIENT, {"name": "Sunrise Realty"})
    slack.notify(NotificationType.NEW_PROJECT, {"name": "Website Redesign", "client": "Sunrise Realty"})
    slack.notify(NotificationType.INVOICE_PAID, {"amount": 2500, "client": "Coffee Lab"})
    slack.notify(NotificationType.MILESTONE, {"name": "Design Phase", "progress": 100})
    
    print(slack.format_dashboard())
