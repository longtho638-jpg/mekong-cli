"""Mekong CLI - Alert Router.

Centralized alert routing with deduplication, throttling, and severity-based routing.
Subscribes to EventBus *:critical events and routes to Telegram/Slack/email channels.
"""

from __future__ import annotations

import os
import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .event_bus import EventBus, EventType, get_event_bus


class AlertSeverity(str, Enum):
    """Alert severity levels."""

    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


@dataclass
class Alert:
    """An alert generated from an event."""

    severity: AlertSeverity
    title: str
    message: str
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_telegram_message(self) -> str:
        """Format alert as Telegram markdown message."""
        emoji = {"critical": "🚨", "warning": "⚠️", "info": "ℹ️"}
        return (
            f"{emoji.get(self.severity.value, '📢')} *{self.severity.value.upper()}: {self.title}*\n\n"
            f"{self.message}\n\n"
            f"_Source: {self.source}_\n"
            f"_Time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.timestamp))}_"
        )


@dataclass
class AlertConfig:
    """Configuration for alert routing."""

    dedup_window: int = 600  # 10 minutes in seconds
    throttle_limit: int = 10  # Max alerts per hour
    throttle_window: int = 3600  # 1 hour in seconds
    enabled_severities: list[AlertSeverity] = field(
        default_factory=lambda: [AlertSeverity.CRITICAL, AlertSeverity.WARNING, AlertSeverity.INFO]
    )


class AlertRouter:
    """Centralized alert routing with deduplication and throttling."""

    def __init__(self, event_bus: EventBus | None = None, config: AlertConfig | None = None) -> None:
        """Initialize AlertRouter with event bus subscription."""
        self.event_bus = event_bus or get_event_bus()
        self.config = config or AlertConfig()

        # Deduplication: track recent alerts by hash
        self._recent_alerts: dict[str, float] = {}

        # Throttling: deque of (timestamp, alert) tuples
        self._alert_history: deque[tuple[float, Alert]] = deque()

        # Internal event bus for alert lifecycle events
        self._internal_bus = EventBus()

        # Subscribe to critical events
        self._subscribe_to_events()

    def _subscribe_to_events(self) -> None:
        """Subscribe to EventBus *:critical events."""
        critical_events = [
            EventType.HEALTH_CRITICAL,
            EventType.LICENSE_CRITICAL,
            EventType.HALT_TRIGGERED,
            EventType.GOVERNANCE_BLOCKED,
        ]
        for event_type in critical_events:
            self.event_bus.subscribe(event_type, self._handle_event)

    def _handle_event(self, event: EventType) -> None:
        """Handle incoming event and generate alert."""
        # Convert event to alert
        alert = Alert(
            severity=AlertSeverity.CRITICAL,
            title=event.type.value.replace("_", " ").title(),
            message=str(event.data.get("message", event.data.get("error", "No details"))),
            source="event_bus",
            metadata=event.data,
        )
        self.route(alert)

    def _alert_hash(self, alert: Alert) -> str:
        """Generate hash for deduplication."""
        return f"{alert.source}:{alert.title}:{alert.severity.value}"

    def _is_duplicate(self, alert: Alert) -> bool:
        """Check if alert is duplicate within dedup window."""
        alert_h = self._alert_hash(alert)
        if alert_h in self._recent_alerts:
            last_seen = self._recent_alerts[alert_h]
            if time.time() - last_seen < self.config.dedup_window:
                return True
        self._recent_alerts[alert_h] = time.time()
        return False

    def _is_throttled(self, alert: Alert) -> bool:
        """Check if alert should be throttled."""
        now = time.time()
        cutoff = now - self.config.throttle_window

        # Clean old entries
        while self._alert_history and self._alert_history[0][0] < cutoff:
            self._alert_history.popleft()

        # Count recent alerts
        recent_count = sum(1 for ts, _ in self._alert_history if ts > cutoff)
        if recent_count >= self.config.throttle_limit:
            return True

        # Add to history
        self._alert_history.append((now, alert))
        return False

    def _cleanup_old_alerts(self) -> None:
        """Remove old alerts from dedup cache."""
        now = time.time()
        expired = [
            h for h, ts in self._recent_alerts.items()
            if now - ts > self.config.dedup_window
        ]
        for h in expired:
            del self._recent_alerts[h]

    def route(self, alert: Alert) -> str | None:
        """Route an alert through deduplication, throttling, and delivery.

        Returns:
            Alert ID if sent, None if suppressed.
        """
        # Check severity filter
        if alert.severity not in self.config.enabled_severities:
            return None

        # Cleanup old alerts periodically
        self._cleanup_old_alerts()

        # Deduplication check
        if self._is_duplicate(alert):
            self._internal_bus.emit(
                EventType("alert:deduplicated"),
                {"alert": alert.title, "source": alert.source},
            )
            return None

        # Throttling check (only for non-critical)
        if alert.severity != AlertSeverity.CRITICAL and self._is_throttled(alert):
            self._internal_bus.emit(
                EventType("alert:throttled"),
                {"alert": alert.title, "severity": alert.severity.value},
            )
            return None

        # Send alert
        alert_id = self._send(alert)
        self._internal_bus.emit(
            EventType("alert:sent"),
            {"alert_id": alert_id, "severity": alert.severity.value},
        )
        return alert_id

    def _send(self, alert: Alert) -> str:
        """Send alert to configured channels."""
        from .telegram_client import TelegramClient

        token = os.getenv("TELEGRAM_BOT_TOKEN")
        channel_id = os.getenv("TELEGRAM_OPS_CHANNEL_ID")

        if not token or not channel_id:
            # Log but don't fail
            return f"unsent:no_config:{alert.title}"

        try:
            client = TelegramClient(token)
            message_id = client.send_message(
                chat_id=channel_id,
                text=alert.to_telegram_message(),
                parse_mode="Markdown",
            )
            return f"telegram:{message_id}"
        except Exception:
            return f"failed:{alert.title}"

    def get_stats(self) -> dict[str, Any]:
        """Get router statistics."""
        now = time.time()
        recent_count = sum(
            1 for ts, _ in self._alert_history if now - ts < 3600
        )
        return {
            "dedup_cache_size": len(self._recent_alerts),
            "alerts_last_hour": recent_count,
            "throttle_limit": self.config.throttle_limit,
            "throttle_remaining": max(0, self.config.throttle_limit - recent_count),
        }

    @property
    def internal_bus(self) -> EventBus:
        """Get internal event bus for alert lifecycle events."""
        return self._internal_bus


# Singleton instance
_default_router: AlertRouter | None = None


def get_alert_router(
    event_bus: EventBus | None = None,
    config: AlertConfig | None = None,
) -> AlertRouter:
    """Get or create the shared alert router."""
    global _default_router
    if _default_router is None:
        _default_router = AlertRouter(event_bus=event_bus, config=config)
    return _default_router


__all__ = [
    "Alert",
    "AlertConfig",
    "AlertRouter",
    "AlertSeverity",
    "get_alert_router",
]
