"""
📅 Event Coordinator - Events & Gatherings
=============================================

Manage virtual and in-person events.
Bring people together!

Features:
- Event calendar
- Registration tracking
- Virtual event setup
- Attendance analytics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class EventType(Enum):
    """Event types."""
    WEBINAR = "webinar"
    WORKSHOP = "workshop"
    MEETUP = "meetup"
    CONFERENCE = "conference"
    NETWORKING = "networking"
    FUNDRAISER = "fundraiser"


class EventFormat(Enum):
    """Event formats."""
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"
    HYBRID = "hybrid"


class EventStatus(Enum):
    """Event status."""
    PLANNING = "planning"
    REGISTRATION_OPEN = "registration_open"
    SOLD_OUT = "sold_out"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Event:
    """An event."""
    id: str
    name: str
    event_type: EventType
    format: EventFormat
    description: str
    date: datetime
    capacity: int = 100
    registered: int = 0
    attended: int = 0
    status: EventStatus = EventStatus.PLANNING
    ticket_price: float = 0


@dataclass
class EventRegistration:
    """An event registration."""
    id: str
    event_id: str
    attendee_name: str
    attendee_email: str
    registered_at: datetime = field(default_factory=datetime.now)
    attended: bool = False


class EventCoordinator:
    """
    Event Coordinator.
    
    Plan and execute events.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.events: Dict[str, Event] = {}
        self.registrations: List[EventRegistration] = []
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        events = [
            ("Digital Marketing Webinar", EventType.WEBINAR, EventFormat.VIRTUAL, 
             "Learn digital marketing basics", 100, 85, 0),
            ("Monthly Networking Meetup", EventType.MEETUP, EventFormat.HYBRID,
             "Connect with local professionals", 50, 42, 0),
            ("SEO Workshop", EventType.WORKSHOP, EventFormat.VIRTUAL,
             "Hands-on SEO training", 30, 30, 25),
            ("Annual Gala Fundraiser", EventType.FUNDRAISER, EventFormat.IN_PERSON,
             "Annual charity event", 200, 150, 0),
        ]
        
        for name, etype, format, desc, cap, reg, price in events:
            event = self.create_event(name, etype, format, desc, cap, price)
            event.registered = reg
            event.status = EventStatus.REGISTRATION_OPEN
            if reg >= cap:
                event.status = EventStatus.SOLD_OUT
    
    def create_event(
        self,
        name: str,
        event_type: EventType,
        format: EventFormat,
        description: str,
        capacity: int = 100,
        ticket_price: float = 0,
        days_from_now: int = 14
    ) -> Event:
        """Create an event."""
        event = Event(
            id=f"EVT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            event_type=event_type,
            format=format,
            description=description,
            date=datetime.now() + timedelta(days=days_from_now),
            capacity=capacity,
            ticket_price=ticket_price
        )
        self.events[event.id] = event
        return event
    
    def register_attendee(
        self,
        event: Event,
        name: str,
        email: str
    ) -> Optional[EventRegistration]:
        """Register an attendee."""
        if event.registered >= event.capacity:
            return None
        
        registration = EventRegistration(
            id=f"REG-{uuid.uuid4().hex[:6].upper()}",
            event_id=event.id,
            attendee_name=name,
            attendee_email=email
        )
        self.registrations.append(registration)
        event.registered += 1
        
        if event.registered >= event.capacity:
            event.status = EventStatus.SOLD_OUT
        
        return registration
    
    def mark_attended(self, event: Event, email: str):
        """Mark attendee as attended."""
        for reg in self.registrations:
            if reg.event_id == event.id and reg.attendee_email == email:
                reg.attended = True
                event.attended += 1
                break
    
    def get_upcoming_events(self, days: int = 30) -> List[Event]:
        """Get upcoming events."""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            e for e in self.events.values()
            if e.date <= cutoff and e.status != EventStatus.COMPLETED
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get event statistics."""
        total_registered = sum(e.registered for e in self.events.values())
        total_capacity = sum(e.capacity for e in self.events.values())
        upcoming = len(self.get_upcoming_events())
        revenue = sum(e.registered * e.ticket_price for e in self.events.values())
        
        return {
            "events": len(self.events),
            "upcoming": upcoming,
            "total_registered": total_registered,
            "total_capacity": total_capacity,
            "fill_rate": (total_registered / total_capacity * 100) if total_capacity else 0,
            "revenue": revenue
        }
    
    def format_dashboard(self) -> str:
        """Format event coordinator dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 EVENT COORDINATOR                                     ║",
            f"║  {stats['events']} events │ {stats['total_registered']} registered │ {stats['fill_rate']:.0f}% fill  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📅 UPCOMING EVENTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"webinar": "🎥", "workshop": "🛠️", "meetup": "🤝",
                     "conference": "🎤", "networking": "👥", "fundraiser": "💰"}
        format_icons = {"virtual": "💻", "in_person": "🏢", "hybrid": "🔄"}
        status_icons = {"planning": "📝", "registration_open": "✅",
                       "sold_out": "🎫", "live": "🔴", "completed": "✔️"}
        
        for event in list(self.events.values())[:4]:
            t_icon = type_icons.get(event.event_type.value, "📅")
            s_icon = status_icons.get(event.status.value, "⚪")
            fill = (event.registered / event.capacity * 100) if event.capacity else 0
            lines.append(f"║    {t_icon} {s_icon} {event.name[:20]:<20} │ {event.registered}/{event.capacity} ({fill:.0f}%)  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 EVENT CALENDAR                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        upcoming = self.get_upcoming_events()
        if upcoming:
            for event in sorted(upcoming, key=lambda x: x.date)[:3]:
                days_until = (event.date - datetime.now()).days
                f_icon = format_icons.get(event.format.value, "📅")
                lines.append(f"║    {f_icon} {event.name[:22]:<22} │ {days_until:>3} days  ║")
        else:
            lines.append("║    No upcoming events                                    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 EVENT TYPES                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_counts = {}
        for event in self.events.values():
            t = event.event_type.value
            type_counts[t] = type_counts.get(t, 0) + 1
        
        for etype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
            icon = type_icons.get(etype, "📅")
            bar = "█" * count + "░" * (10 - min(10, count))
            lines.append(f"║    {icon} {etype.title():<14} │ {bar} │ {count:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 EVENT METRICS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📅 Total Events:       {stats['events']:>12}              ║",
            f"║    👥 Registered:         {stats['total_registered']:>12}              ║",
            f"║    📊 Fill Rate:          {stats['fill_rate']:>12.0f}%              ║",
            f"║    💰 Revenue:            ${stats['revenue']:>11,.0f}              ║",
            "║                                                           ║",
            "║  [📅 Events]  [👥 Attendees]  [📊 Analytics]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Bring people together!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ec = EventCoordinator("Saigon Digital Hub")
    
    print("📅 Event Coordinator")
    print("=" * 60)
    print()
    
    print(ec.format_dashboard())
