"""
Mekong CLI - Event Bus

In-process pub/sub event bus with streaming support for gateway events.
Enables WebSocket subscribers, Telegram/webhook integrations, and
real-time execution streaming (Netdata streaming pattern).
"""

import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Deque, Dict, List, Optional


class EventType(str, Enum):
    """Event types emitted during orchestration."""

    GOAL_STARTED = "goal_started"
    GOAL_COMPLETED = "goal_completed"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    STEP_HEALED = "step_healed"
    JOB_STARTED = "job_started"
    JOB_COMPLETED = "job_completed"
    MEMORY_RECORDED = "memory_recorded"
    PATTERN_DETECTED = "pattern_detected"
    RECIPE_GENERATED = "recipe_generated"
    RECIPE_DEPRECATED = "recipe_deprecated"
    AUTONOMOUS_CYCLE = "autonomous_cycle"
    GOVERNANCE_BLOCKED = "governance_blocked"
    HALT_TRIGGERED = "halt_triggered"
    HEALTH_WARNING = "health_warning"
    HEALTH_CRITICAL = "health_critical"
    COLLECTOR_DISCOVERED = "collector_discovered"
    PROJECT_DISCOVERED = "project_discovered"
    # AGI v2: Module communication events
    AGI_SCORE_COMPUTED = "agi_score_computed"
    RECIPE_AUTO_SAVED = "recipe_auto_saved"
    SELF_HEAL_REFLECTION = "self_heal_reflection"
    VECTOR_MEMORY_UPDATED = "vector_memory_updated"


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
        """Initialize EventBus with an empty subscriber registry."""
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

    def emit(self, event_type: EventType, data: Optional[Dict[str, Any]] = None) -> Event:
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


class EventStream:
    """
    Buffered event stream for real-time consumers (WebSocket, SSE).

    Inspired by Netdata's streaming protocol: buffers events for
    consumers that may read at different rates. Supports replay
    of recent events for late-joining consumers.
    """

    def __init__(self, max_buffer: int = 1000) -> None:
        """Initialize stream with bounded buffer."""
        self._buffer: Deque[Event] = deque(maxlen=max_buffer)
        self._cursor: int = 0
        self._total_emitted: int = 0

    def push(self, event: Event) -> None:
        """Push an event into the stream buffer."""
        self._buffer.append(event)
        self._total_emitted += 1

    def read(self, since_cursor: int = 0, limit: int = 100) -> List[Event]:
        """
        Read events from stream since a cursor position.

        Args:
            since_cursor: Read events after this position.
            limit: Max events to return.

        Returns:
            List of events after the cursor.
        """
        # Calculate offset into buffer
        buffer_start = self._total_emitted - len(self._buffer)
        skip = max(0, since_cursor - buffer_start)
        events = list(self._buffer)
        return events[skip:skip + limit]

    @property
    def cursor(self) -> int:
        """Current stream position (total events emitted)."""
        return self._total_emitted

    @property
    def buffered_count(self) -> int:
        """Number of events currently in buffer."""
        return len(self._buffer)

    def clear(self) -> None:
        """Clear the stream buffer."""
        self._buffer.clear()


class StreamingEventBus(EventBus):
    """
    EventBus with integrated streaming support.

    Extends EventBus with an EventStream that buffers all emitted events
    for real-time consumers (WebSocket, SSE, polling).
    """

    def __init__(self, max_buffer: int = 1000) -> None:
        """Initialize with event stream."""
        super().__init__()
        self.stream = EventStream(max_buffer=max_buffer)

    def emit(self, event_type: EventType, data: Optional[Dict[str, Any]] = None) -> Event:
        """Emit event to subscribers AND push to stream buffer."""
        event = super().emit(event_type, data)
        self.stream.push(event)
        return event


# Shared singleton instance for the gateway process
_default_bus: Optional[EventBus] = None


def get_event_bus() -> EventBus:
    """Get or create the shared event bus singleton."""
    global _default_bus
    if _default_bus is None:
        _default_bus = EventBus()
    return _default_bus


def get_streaming_bus(max_buffer: int = 1000) -> StreamingEventBus:
    """Get or create a streaming event bus (with buffer for real-time consumers)."""
    global _default_bus
    if not isinstance(_default_bus, StreamingEventBus):
        _default_bus = StreamingEventBus(max_buffer=max_buffer)
    return _default_bus  # type: ignore[return-value]  # StreamingEventBus is subtype


__all__ = [
    "EventType",
    "Event",
    "EventBus",
    "EventStream",
    "StreamingEventBus",
    "Subscriber",
    "get_event_bus",
    "get_streaming_bus",
]
