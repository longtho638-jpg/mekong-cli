"""
Event Agent Facade.
"""

from typing import Dict

from .engine import EventEngine
from .models import Attendee, Event, EventStatus, EventType


class EventAgent(EventEngine):
    """Refactored Event Agent."""

    def __init__(self):
        super().__init__()
        self.name = "Event"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {
            "total_events": len(self.events),
            "total_attendees": sum(e.registered for e in self.events.values()),
        }


__all__ = ["EventAgent", "EventType", "EventStatus", "Attendee", "Event"]
