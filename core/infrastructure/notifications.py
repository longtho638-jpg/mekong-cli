"""
🔔 Notification Infrastructure
==============================
Unified Notification Service handling both system alerts (macOS/Logs) 
and business alerts (Templates/Channels).
"""

import json
import logging
import subprocess
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
from core.config import get_settings

logger = logging.getLogger(__name__)

# --- Enums from Legacy System ---
class NotificationType(Enum):
    PAYMENT_REMINDER = "payment_reminder"
    PROJECT_UPDATE = "project_update"
    REPORT_READY = "report_ready"
    INVOICE_SENT = "invoice_sent"
    WELCOME = "welcome"
    MILESTONE = "milestone"
    SYSTEM_ALERT = "system_alert" # Added for ops

class Channel(Enum):
    EMAIL = "email"
    SMS = "sms"
    TELEGRAM = "telegram"
    SLACK = "slack"
    SYSTEM = "system" # Added for ops

class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class Notification:
    id: str
    type: NotificationType
    channel: Channel
    priority: Priority
    recipient: str
    subject: str
    body: str
    created_at: datetime = field(default_factory=datetime.now)

class NotificationService:
    """
    Unified Notification Service.
    Replaces both NotificationSystem and the old NotificationService.
    """

    def __init__(self):
        settings = get_settings()
        self.log_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.events_file = self.log_dir / "events.json"
        self._ensure_dir()
        self.notifications: List[Notification] = []

    def _ensure_dir(self):
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def _notify_macos(self, title: str, message: str, sound: str = "default"):
        script = f'display notification "{message}" with title "{title}" sound name "{sound}"'
        try:
            subprocess.run(["osascript", "-e", script], capture_output=True)
        except:
            pass

    def _log_event(self, event_type: str, data: Dict):
        events = []
        if self.events_file.exists():
            try:
                with open(self.events_file) as f:
                    events = json.load(f)
            except:
                pass

        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "seen": False
        }
        events.append(event)
        events = events[-100:] # Keep last 100
        
        with open(self.events_file, "w") as f:
            json.dump(events, f, indent=2)

    def send(self, title: str, message: str, level: str = "info", data: Optional[Dict] = None):
        """
        Simple interface for Ops/Monitoring.
        """
        # 1. Console
        icons = {"info": "ℹ️", "success": "✅", "warning": "⚠️", "error": "❌"}
        icon = icons.get(level, "🔔")
        print(f"\n{icon} [bold]{title}[/bold]: {message}")

        # 2. System Notification
        self._notify_macos(title, message)

        # 3. Log
        self._log_event(level, {"title": title, "message": message, **(data or {})})

    def create_notification(
        self,
        n_type: NotificationType,
        channel: Channel,
        recipient: str,
        variables: Dict[str, str],
        priority: Priority = Priority.MEDIUM
    ) -> Notification:
        """
        Advanced interface for Business Logic (CRM, Finance).
        """
        # Simple template logic
        subject = f"Notification: {n_type.value}"
        body = str(variables)
        
        # In a real system, load templates here
        if n_type == NotificationType.WELCOME:
            subject = f"Welcome {variables.get('client_name', '')}!"
            body = f"Welcome to {variables.get('agency_name', 'AgencyOS')}."

        notification = Notification(
            id=f"NOT-{uuid.uuid4().hex[:6].upper()}",
            type=n_type, channel=channel, priority=priority,
            recipient=recipient, subject=subject, body=body
        )
        
        self.notifications.append(notification)
        self.send(subject, body, "info", {"recipient": recipient, "channel": channel.value})
        
        return notification

# Backward compatibility alias if needed
NotificationSystem = NotificationService