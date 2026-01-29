"""
Event Agent Data Models.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import List


class EventType(Enum):
    WEBINAR = "webinar"
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    MEETUP = "meetup"
    TRADESHOW = "tradeshow"
    VIRTUAL = "virtual"


class EventStatus(Enum):
    PLANNING = "planning"
    REGISTRATION_OPEN = "registration_open"
    SOLD_OUT = "sold_out"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Attendee:
    id: str
    name: str
    email: str
    company: str = ""
    registered_at: datetime = field(default_factory=datetime.now)


@dataclass
class Event:
    id: str
    name: str
    event_type: EventType
    date: date
    venue: str
    status: EventStatus = EventStatus.PLANNING
    capacity: int = 100
    attendees: List[Attendee] = field(default_factory=list)
    budget: float = 0

    @property
    def registered(self) -> int:
        return len(self.attendees)

    @property
    def fill_rate(self) -> float:
        return (self.registered / self.capacity * 100) if self.capacity > 0 else 0
