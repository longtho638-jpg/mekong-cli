"""
Mekong CLI - Event Notifier

EventBus subscriber that pushes notifications to Telegram bot.
Configurable via .mekong/notify.yaml.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, List, Optional

import yaml

from .event_bus import EventBus, EventType, Event


@dataclass
class NotifyConfig:
    """Notification configuration."""

    events: List[str] = field(default_factory=lambda: [
        "goal_completed", "job_started", "job_completed",
    ])
    enabled: bool = True


class Notifier:
    """EventBus subscriber that pushes notifications to Telegram."""

    CONFIG_PATH = ".mekong/notify.yaml"

    # Events we can subscribe to
    SUBSCRIBABLE_EVENTS = [
        EventType.GOAL_COMPLETED,
        EventType.JOB_STARTED,
        EventType.JOB_COMPLETED,
    ]

    def __init__(self, bot: Optional[Any] = None) -> None:
        """
        Initialize notifier.

        Args:
            bot: Optional MekongBot instance for sending messages
        """
        self.bot = bot
        self.config = self._load_config()
        self._subscribed = False

    def subscribe(self, bus: EventBus) -> None:
        """Register event handlers on the bus."""
        for event_type in self.SUBSCRIBABLE_EVENTS:
            bus.subscribe(event_type, self.on_event)
        self._subscribed = True

    def unsubscribe(self, bus: EventBus) -> None:
        """Remove event handlers from the bus."""
        for event_type in self.SUBSCRIBABLE_EVENTS:
            bus.unsubscribe(event_type, self.on_event)
        self._subscribed = False

    def on_event(self, event: Event) -> None:
        """Handle incoming event — send notification if configured."""
        if not self.config.enabled:
            return
        if not self._should_notify(event.type):
            return
        if not self.bot or not self.bot.is_running():
            return

        message = self._format_notification(event)
        # Send to all configured chat IDs
        for chat_id in self.bot.config.chat_ids:
            try:
                import asyncio
                asyncio.run_coroutine_threadsafe(
                    self.bot.send_notification(chat_id, message),
                    asyncio.get_event_loop(),
                )
            except Exception:
                pass

    def _should_notify(self, event_type: EventType) -> bool:
        """Check if this event type is in the notification config."""
        return event_type.value in self.config.events

    def _format_notification(self, event: Event) -> str:
        """Format event into readable notification text."""
        data = event.data or {}

        if event.type == EventType.GOAL_COMPLETED:
            goal = data.get("goal", "unknown")
            status = data.get("status", "unknown")
            icon = "✅" if status == "success" else "❌"
            return f"{icon} Goal completed: {goal} — {status}"

        if event.type == EventType.JOB_STARTED:
            name = data.get("name", "unknown")
            return f"⏳ Job started: {name}"

        if event.type == EventType.JOB_COMPLETED:
            name = data.get("name", "unknown")
            return f"✅ Job completed: {name}"

        return f"🔔 Event: {event.type.value}"

    def _load_config(self) -> NotifyConfig:
        """Load notification config from .mekong/notify.yaml."""
        path = Path(self.CONFIG_PATH)
        if not path.exists():
            return NotifyConfig()
        try:
            data = yaml.safe_load(path.read_text()) or {}
            return NotifyConfig(
                events=data.get("events", NotifyConfig().events),
                enabled=data.get("enabled", True),
            )
        except Exception:
            return NotifyConfig()


__all__ = [
    "Notifier",
    "NotifyConfig",
]
