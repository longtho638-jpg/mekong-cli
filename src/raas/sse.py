"""SSE infrastructure and EventBus adapter for RaaS dashboard streaming."""
from __future__ import annotations

import asyncio
from typing import Any, Optional

from src.core.event_bus import Event, EventBus, EventType

# Human-friendly Vietnamese messages for dashboard events
HUMAN_MESSAGES: dict[str, str] = {
    "RESOURCE_EXHAUSTED": "Agent đang nghỉ, thử lại sau 2 phút",
    "GOAL_COMPLETED": "Nhiệm vụ hoàn thành",
    "GOAL_STARTED": "Bắt đầu nhiệm vụ",
    "STEP_FAILED": "Bước thực hiện gặp lỗi",
}

# Map EventType to human-friendly message key
_EVENT_TO_MESSAGE_KEY: dict[EventType, str] = {
    EventType.GOAL_STARTED: "GOAL_STARTED",
    EventType.GOAL_COMPLETED: "GOAL_COMPLETED",
    EventType.STEP_FAILED: "STEP_FAILED",
}


class SSEManager:
    """Manages Server-Sent Events connections per tenant.

    Maintains a registry of asyncio queues per tenant so events
    can be pushed to all active dashboard connections for that tenant.
    """

    def __init__(self) -> None:
        """Initialize with empty connection registry."""
        self.connections: dict[str, list[asyncio.Queue]] = {}

    def register(self, tenant_id: str) -> asyncio.Queue:
        """Create a new queue for a client and register it.

        Args:
            tenant_id: The tenant whose dashboard is connecting.

        Returns:
            A new asyncio.Queue that will receive event dicts.
        """
        queue: asyncio.Queue = asyncio.Queue()
        self.connections.setdefault(tenant_id, []).append(queue)
        return queue

    def unregister(self, tenant_id: str, queue: asyncio.Queue) -> None:
        """Remove a client queue from the registry.

        Args:
            tenant_id: The tenant whose connection is closing.
            queue: The specific queue to remove.
        """
        queues = self.connections.get(tenant_id, [])
        if queue in queues:
            queues.remove(queue)
        if not queues:
            self.connections.pop(tenant_id, None)

    def push(self, tenant_id: str, event_data: dict[str, Any]) -> None:
        """Push an event to all active queues for a tenant.

        Uses put_nowait so it can be called from sync callbacks.
        Drops silently if a queue is full (non-blocking).

        Args:
            tenant_id: Target tenant identifier.
            event_data: JSON-serialisable event payload dict.
        """
        for queue in self.connections.get(tenant_id, []):
            try:
                queue.put_nowait(event_data)
            except asyncio.QueueFull:
                pass  # Drop if client is slow — keepalive will resync


class EventBusAdapter:
    """Subscribes to all EventBus events and routes them to SSEManager.

    Translates internal Event objects to human-friendly dashboard
    payloads using HUMAN_MESSAGES, then pushes to the correct tenant.
    """

    def __init__(self, sse_manager: SSEManager, event_bus: EventBus) -> None:
        """Subscribe to every EventType on the provided bus.

        Args:
            sse_manager: SSEManager to push translated events into.
            event_bus: EventBus instance to subscribe to.
        """
        self._sse = sse_manager
        self._bus = event_bus
        for event_type in EventType:
            self._bus.subscribe(event_type, self._handle)

    def _translate(self, event: Event) -> str:
        """Return a human-friendly Vietnamese message for the event.

        Checks HUMAN_MESSAGES for known patterns in the event data
        or falls back to the raw event type name.

        Args:
            event: The raw Event from the bus.

        Returns:
            Human-readable string for the dashboard.
        """
        # Check error field for RESOURCE_EXHAUSTED pattern
        error = event.data.get("error", "")
        if "RESOURCE_EXHAUSTED" in str(error):
            return HUMAN_MESSAGES["RESOURCE_EXHAUSTED"]

        key = _EVENT_TO_MESSAGE_KEY.get(event.type)
        if key:
            return HUMAN_MESSAGES[key]

        return event.type.value.replace("_", " ").title()

    def _handle(self, event: Event) -> None:
        """Callback invoked by EventBus for every subscribed event.

        Extracts tenant_id from event.data and pushes to SSEManager.
        Events without tenant_id are silently ignored.

        Args:
            event: Incoming event from the bus.
        """
        tenant_id: Optional[str] = event.data.get("tenant_id")
        if not tenant_id:
            return

        payload: dict[str, Any] = {
            "type": event.type.value,
            "message": self._translate(event),
            "data": event.data,
            "timestamp": event.timestamp,
        }
        self._sse.push(tenant_id, payload)


# Module-level singletons (lazy init in dashboard.py)
_sse_manager: Optional[SSEManager] = None


def get_sse_manager() -> SSEManager:
    """Return the shared SSEManager singleton."""
    global _sse_manager
    if _sse_manager is None:
        _sse_manager = SSEManager()
    return _sse_manager


__all__ = [
    "SSEManager",
    "EventBusAdapter",
    "HUMAN_MESSAGES",
    "get_sse_manager",
]
