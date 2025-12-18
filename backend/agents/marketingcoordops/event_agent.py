"""
Event Agent - Event Planning & Management
Manages events, registration, and attendee tracking.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, date
from enum import Enum
import random


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
    """Event attendee"""
    id: str
    name: str
    email: str
    company: str = ""
    registered_at: datetime = None


@dataclass
class Event:
    """Marketing event"""
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


class EventAgent:
    """
    Event Agent - Quản lý Sự kiện
    
    Responsibilities:
    - Event planning
    - Registration management
    - Venue coordination
    - Attendee tracking
    """
    
    def __init__(self):
        self.name = "Event"
        self.status = "ready"
        self.events: Dict[str, Event] = {}
        
    def create_event(
        self,
        name: str,
        event_type: EventType,
        event_date: date,
        venue: str,
        capacity: int = 100,
        budget: float = 0
    ) -> Event:
        """Create event"""
        event_id = f"evt_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
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
    
    def open_registration(self, event_id: str) -> Event:
        """Open event registration"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")
            
        event = self.events[event_id]
        event.status = EventStatus.REGISTRATION_OPEN
        
        return event
    
    def register_attendee(
        self,
        event_id: str,
        name: str,
        email: str,
        company: str = ""
    ) -> Event:
        """Register attendee"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")
            
        event = self.events[event_id]
        
        if event.registered >= event.capacity:
            event.status = EventStatus.SOLD_OUT
            raise ValueError("Event is sold out")
        
        attendee = Attendee(
            id=f"att_{random.randint(1000,9999)}",
            name=name,
            email=email,
            company=company,
            registered_at=datetime.now()
        )
        
        event.attendees.append(attendee)
        
        if event.registered >= event.capacity:
            event.status = EventStatus.SOLD_OUT
        
        return event
    
    def start_event(self, event_id: str) -> Event:
        """Start event"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")
            
        event = self.events[event_id]
        event.status = EventStatus.IN_PROGRESS
        
        return event
    
    def complete_event(self, event_id: str) -> Event:
        """Complete event"""
        if event_id not in self.events:
            raise ValueError(f"Event not found: {event_id}")
            
        event = self.events[event_id]
        event.status = EventStatus.COMPLETED
        
        return event
    
    def get_upcoming(self) -> List[Event]:
        """Get upcoming events"""
        today = date.today()
        return sorted(
            [e for e in self.events.values() if e.date >= today],
            key=lambda x: x.date
        )
    
    def get_stats(self) -> Dict:
        """Get event statistics"""
        events = list(self.events.values())
        completed = [e for e in events if e.status == EventStatus.COMPLETED]
        
        return {
            "total_events": len(events),
            "upcoming": len(self.get_upcoming()),
            "completed": len(completed),
            "total_attendees": sum(e.registered for e in events),
            "avg_fill_rate": sum(e.fill_rate for e in events) / len(events) if events else 0
        }


# Demo
if __name__ == "__main__":
    agent = EventAgent()
    
    print("🎪 Event Agent Demo\n")
    
    # Create event
    from datetime import timedelta
    e1 = agent.create_event(
        "Product Launch Webinar",
        EventType.WEBINAR,
        date.today() + timedelta(days=14),
        "Zoom",
        capacity=500,
        budget=5000
    )
    
    print(f"📋 Event: {e1.name}")
    print(f"   Type: {e1.event_type.value}")
    print(f"   Date: {e1.date}")
    print(f"   Capacity: {e1.capacity}")
    
    # Register
    agent.open_registration(e1.id)
    agent.register_attendee(e1.id, "Nguyen A", "nguyen@example.com", "TechCorp")
    agent.register_attendee(e1.id, "Tran B", "tran@example.com", "StartupXYZ")
    agent.register_attendee(e1.id, "Le C", "le@example.com")
    
    print(f"\n✅ Registered: {e1.registered}/{e1.capacity} ({e1.fill_rate:.0f}%)")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Events: {stats['total_events']}")
    print(f"   Total Attendees: {stats['total_attendees']}")
