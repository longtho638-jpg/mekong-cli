"""
Mekong CLI - Event Bus

Simple in-process pub/sub event bus for gateway events.
Enables WebSocket subscribers and future Telegram/webhook integrations.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List


class EventType(str, Enum):
    """Event types emitted during orchestration."""

    GOAL_STARTED = "goal_started"
    GOAL_COMPLETED = "goal_completed"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    JOB_STARTED = "job_started"
    JOB_COMPLETED = "job_completed"
    MEMORY_RECORDED = "memory_recorded"
    PATTERN_DETECTED = "pattern_detected"


@dataclass
class Event:
    """A single event emitted by the orchestration engine."""

    type: EventType
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


# Subscriber callback signature: (event: Event) -> None
Subscriber = Callable[[Event], None]


class EventBus:
    """In-process publish/subscribe event bus."""

    def __init__(self) -> None:
        self._subscribers: Dict[EventType, List[Subscriber]] = {}

    def subscribe(self, event_type: EventType, callback: Subscriber) -> None:
        """Register a callback for an event type."""
        self._subscribers.setdefault(event_type, []).append(callback)

    def unsubscribe(
        self, event_type: EventType, callback: Subscriber
    ) -> None:
        """Remove a callback for an event type."""
        listeners = self._subscribers.get(event_type, [])
        if callback in listeners:
            listeners.remove(callback)

    def emit(self, event_type: EventType, data: Dict[str, Any] = None) -> Event:
        """Emit an event to all subscribers of that type."""
        event = Event(type=event_type, data=data or {})
        for callback in self._subscribers.get(event_type, []):
            try:
                callback(event)
            except Exception:
                pass  # Subscribers must not break the emitter
        return event

    def clear(self) -> None:
        """Remove all subscribers."""
        self._subscribers.clear()

    @property
    def subscriber_count(self) -> int:
        """Total number of registered subscriber callbacks."""
        return sum(len(v) for v in self._subscribers.values())


# Shared singleton instance for the gateway process
_default_bus: EventBus = None  # type: ignore[assignment]


def get_event_bus() -> EventBus:
    """Get or create the shared event bus singleton."""
    global _default_bus
    if _default_bus is None:
        _default_bus = EventBus()
    return _default_bus


__all__ = [
    "EventType",
    "Event",
    "EventBus",
    "Subscriber",
    "get_event_bus",
]
