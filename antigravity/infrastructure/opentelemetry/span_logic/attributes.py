"""
Span attributes, tags, and events management.
"""
import time
from typing import Any, Dict, List

from .models import Event


class SpanAttributes:
    def __init__(self):
        self.events: List[Event] = []
        self.attributes: Dict[str, Any] = {}
        self.tags: Dict[str, str] = {}

    def add_event(self, event: Event, trace_id_val: str) -> None:
        """Add event to span."""
        event.span_id = trace_id_val
        if event.timestamp is None:
            event.timestamp = time.time()
        self.events.append(event)

    def add_tag(self, key: str, value: str) -> None:
        """Add tag to span for filtering."""
        self.tags[key] = value
        self.attributes[key] = value

    def add_attribute(self, key: str, value: Any) -> None:
        """Add attribute to span."""
        self.attributes[key] = value
