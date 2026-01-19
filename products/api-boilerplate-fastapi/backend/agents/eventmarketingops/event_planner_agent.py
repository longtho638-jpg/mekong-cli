"""
Event Planner Agent - Events & Scheduling
Manages event creation, venues, and coordination.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import date
from enum import Enum
import random


class EventType(Enum):
    WEBINAR = "webinar"
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    MEETUP = "meetup"
    VIRTUAL = "virtual"


class EventStatus(Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Speaker:
    """Event speaker"""
    id: str
    name: str
    title: str
    company: str


@dataclass
class Event:
    """Marketing event"""
    id: str
    name: str
    event_type: EventType
    date: date
    venue: str
    capacity: int
    budget: float = 0
    status: EventStatus = EventStatus.DRAFT
    speakers: List[Speaker] = field(default_factory=list)
    sponsors: List[str] = field(default_factory=list)
    registrations: int = 0
    spend: float = 0

    @property
    def fill_rate(self) -> float:
        return (self.registrations / self.capacity * 100) if self.capacity > 0 else 0


class EventPlannerAgent:
    """
    Event Planner Agent - Lập kế hoạch Sự kiện
    
    Responsibilities:
    - Event creation & scheduling
    - Venue management
    - Budget tracking
    - Speaker/sponsor coordination
    """

    def __init__(self):
        self.name = "Event Planner"
        self.status = "ready"
        self.events: Dict[str, Event] = {}

    def create_event(
        self,
        name: str,
        event_type: EventType,
        event_date: date,
        venue: str,
        capacity: int,
        budget: float = 0
    ) -> Event:
        """Create new event"""
        event_id = f"evt_{random.randint(1000,9999)}"

        event = Event(
            id=event_id,
            name=name,
            event_type=event_type,
            date=event_date,
            venue=venue,
            capacity=capacity,
            budget=budget
        )

        self.events[event_id] = event
        return event

    def add_speaker(
        self,
        event_id: str,
        name: str,
        title: str,
        company: str
    ) -> Event:
        """Add speaker to event"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")

        speaker_id = f"spk_{random.randint(100,999)}"
        speaker = Speaker(id=speaker_id, name=name, title=title, company=company)

        self.events[event_id].speakers.append(speaker)
        return self.events[event_id]

    def add_sponsor(self, event_id: str, sponsor_name: str) -> Event:
        """Add sponsor to event"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")

        self.events[event_id].sponsors.append(sponsor_name)
        return self.events[event_id]

    def publish_event(self, event_id: str) -> Event:
        """Publish event"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")

        self.events[event_id].status = EventStatus.SCHEDULED
        return self.events[event_id]

    def get_calendar(self) -> List[Event]:
        """Get upcoming events"""
        today = date.today()
        upcoming = [e for e in self.events.values() if e.date >= today]
        return sorted(upcoming, key=lambda e: e.date)

    def get_stats(self) -> Dict:
        """Get event statistics"""
        events = list(self.events.values())
        scheduled = [e for e in events if e.status == EventStatus.SCHEDULED]

        return {
            "total_events": len(events),
            "scheduled": len(scheduled),
            "total_budget": sum(e.budget for e in events),
            "total_registrations": sum(e.registrations for e in events)
        }


# Demo
if __name__ == "__main__":
    from datetime import timedelta

    agent = EventPlannerAgent()

    print("🎪 Event Planner Agent Demo\n")

    # Create event
    e1 = agent.create_event(
        "DevOps Summit 2024",
        EventType.CONFERENCE,
        date.today() + timedelta(days=30),
        "Grand Convention Center",
        500,
        25000
    )

    print(f"📋 Event: {e1.name}")
    print(f"   Type: {e1.event_type.value}")
    print(f"   Date: {e1.date}")
    print(f"   Venue: {e1.venue}")
    print(f"   Capacity: {e1.capacity}")
    print(f"   Budget: ${e1.budget:,}")

    # Add speakers
    agent.add_speaker(e1.id, "Jane Doe", "CTO", "TechCorp")
    agent.add_speaker(e1.id, "John Smith", "VP Engineering", "DevOps Inc")
    print(f"   Speakers: {len(e1.speakers)}")

    # Add sponsors
    agent.add_sponsor(e1.id, "CloudProvider")
    agent.add_sponsor(e1.id, "DevToolsCo")
    print(f"   Sponsors: {len(e1.sponsors)}")

    # Publish
    agent.publish_event(e1.id)
    print(f"   Status: {e1.status.value}")
