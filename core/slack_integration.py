"""
💬 Slack Integration - Team Communication
===========================================

Integrate with Slack for team notifications and workflow automation.
Keep your team in the loop!

Features:
- Channel routing based on notification type
- Event-driven alerts
- Multi-workspace support (future)
- Message history tracking
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SlackChannel(Enum):
    """Common standard Slack channels for routing."""
    GENERAL = "#general"
    SALES = "#sales"
    PROJECTS = "#projects"
    SUPPORT = "#support"
    ALERTS = "#alerts"


class NotificationType(Enum):
    """Categories of automated agency alerts."""
    NEW_CLIENT = "new_client"
    NEW_PROJECT = "new_project"
    INVOICE_PAID = "invoice_paid"
    MILESTONE = "milestone"
    ALERT = "alert"


@dataclass
class SlackMessage:
    """A Slack message entity record."""
    id: str
    channel: str
    text: str
    sent: bool = False
    timestamp: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.text:
            raise ValueError("Message text cannot be empty")


class SlackIntegration:
    """
    Slack Integration System.
    
    Orchestrates the delivery of automated notifications to specific Slack channels based on business events.
    """
    
    def __init__(self, agency_name: str, workspace: str = ""):
        self.agency_name = agency_name
        self.workspace = workspace or agency_name.lower().replace(" ", "-")
        self.is_connected = True
        self.history: List[SlackMessage] = []
        self.rules: Dict[NotificationType, str] = {
            NotificationType.NEW_CLIENT: SlackChannel.SALES.value,
            NotificationType.NEW_PROJECT: SlackChannel.PROJECTS.value,
            NotificationType.INVOICE_PAID: SlackChannel.SALES.value,
            NotificationType.MILESTONE: SlackChannel.PROJECTS.value,
            NotificationType.ALERT: SlackChannel.ALERTS.value,
        }
        logger.info(f"Slack Integration initialized for workspace: {self.workspace}")
    
    def post_message(self, channel: str, text: str) -> SlackMessage:
        """Execute the low-level delivery of a message to Slack."""
        msg = SlackMessage(
            id=f"MSG-{uuid.uuid4().hex[:6].upper()}",
            channel=channel, text=text, sent=self.is_connected
        )
        self.history.append(msg)
        if self.is_connected:
            logger.info(f"Slack Posted: [{channel}] {text[:30]}...")
        else:
            logger.warning(f"Slack Offline: Message {msg.id} queued.")
        return msg
    
    def notify(self, n_type: NotificationType, data: Dict[str, Any]) -> SlackMessage:
        """Send a formatted notification based on business event data."""
        chan = self.rules.get(n_type, SlackChannel.GENERAL.value)
        
        tpls = {
            NotificationType.NEW_CLIENT: f"🎉 New Client: *{data.get('name', '???')}*",
            NotificationType.NEW_PROJECT: f"📋 New Project: *{data.get('name', '???')}* for {data.get('client', '???')}",
            NotificationType.INVOICE_PAID: f"💰 Paid: *${data.get('amount', 0):,.0f}* from {data.get('client', '???')}",
            NotificationType.MILESTONE: f"🎯 Done: *{data.get('name', '???')}*",
            NotificationType.ALERT: f"⚠️ Alert: {data.get('message', 'Alert triggered')}",
        }
        
        body = tpls.get(n_type, str(data))
        return self.post_message(chan, body)
    
    def format_dashboard(self) -> str:
        """Render the Slack Integration Dashboard."""
        status = "🟢 Online" if self.is_connected else "🔴 Offline"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💬 SLACK INTEGRATION DASHBOARD{' ' * 28}║",
            f"║  Workspace: {self.workspace:<25} │ Status: {status:<12} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📨 RECENT ACTIVITY LOG                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for msg in self.history[-5:]:
            st = "✓" if msg.sent else "!"
            lines.append(f"║  {st} {msg.channel:<10} │ {msg.text[:42]:<42} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [⚙️ Configure]  [📝 Routing Rules]  [🔔 Test Connection] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Sync!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💬 Initializing Slack System...")
    print("=" * 60)
    
    try:
        slack = SlackIntegration("Saigon Digital Hub")
        # Notify
        slack.notify(NotificationType.NEW_CLIENT, {"name": "Sunrise Realty"})
        slack.notify(NotificationType.INVOICE_PAID, {"amount": 2500, "client": "Coffee Lab"})
        
        print("\n" + slack.format_dashboard())
        
    except Exception as e:
        logger.error(f"Slack Error: {e}")
