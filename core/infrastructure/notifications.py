"""
Notification Infrastructure
===========================
Central hub for system alerts (macOS, Terminal, Logs).
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
from core.config import get_settings

class NotificationService:
    def __init__(self):
        settings = get_settings()
        self.log_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.events_file = self.log_dir / "events.json"
        self._ensure_dir()

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
        
        # Keep last 100
        events = events[-100:]
        
        with open(self.events_file, "w") as f:
            json.dump(events, f, indent=2)

    def send(self, title: str, message: str, level: str = "info", data: Optional[Dict] = None):
        """Send notification across all channels."""
        # Terminal output
        icons = {"info": "ℹ️", "success": "✅", "warning": "⚠️", "error": "❌", "sale": "💰"}
        icon = icons.get(level, "🔔")
        print(f"\n{icon} [bold]{title}[/bold]: {message}")

        # System notification
        self._notify_macos(title, message)

        # Log
        self._log_event(level, {"title": title, "message": message, **(data or {})})

    def get_history(self) -> list:
        if self.events_file.exists():
            try:
                with open(self.events_file) as f:
                    return json.load(f)
            except:
                return []
        return []
