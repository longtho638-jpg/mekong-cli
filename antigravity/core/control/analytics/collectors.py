import logging
from datetime import datetime
from typing import Dict, List, Optional
from .models import AnalyticsEvent

logger = logging.getLogger(__name__)

class EventCollector:
    """Collects and buffers analytics events."""

    def __init__(self, buffer_size: int = 100):
        self.buffer_size = buffer_size
        self.event_buffer: List[AnalyticsEvent] = []

    def collect(
        self, event_name: str, user_id: str, properties: Optional[Dict[str, object]] = None
    ) -> AnalyticsEvent:
        """Create and buffer an event."""
        event = AnalyticsEvent(
            event_name=event_name,
            user_id=user_id,
            timestamp=datetime.now(),
            properties=properties or {},
        )
        self.event_buffer.append(event)
        return event

    def clear_buffer(self):
        """Clear the event buffer."""
        self.event_buffer.clear()

    @property
    def is_buffer_full(self) -> bool:
        """Check if buffer reached capacity."""
        return len(self.event_buffer) >= self.buffer_size
