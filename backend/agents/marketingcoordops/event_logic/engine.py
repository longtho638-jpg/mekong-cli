"""
Event Agent core engine logic.
"""
import logging
import random
from datetime import date, datetime
from typing import Dict, List

from .models import Attendee, Event, EventStatus, EventType


class EventEngine:
    def __init__(self):
        self.events: Dict[str, Event] = {}

    def create_event(self, name: str, event_type: EventType, event_date: date, venue: str, capacity: int = 100, budget: float = 0) -> Event:
        eid = f"evt_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        event = Event(id=eid, name=name, event_type=event_type, date=event_date, venue=venue, capacity=capacity, budget=budget)
        self.events[eid] = event
        return event

    def register_attendee(self, event_id: str, name: str, email: str, company: str = "") -> Event:
        if event_id not in self.events: raise ValueError("Event not found")
        event = self.events[event_id]
        if event.registered >= event.capacity:
            event.status = EventStatus.SOLD_OUT
            raise ValueError("Event is sold out")
        attendee = Attendee(id=f"att_{random.randint(1000, 9999)}", name=name, email=email, company=company)
        event.attendees.append(attendee)
        if event.registered >= event.capacity: event.status = EventStatus.SOLD_OUT
        return event
