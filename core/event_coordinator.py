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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EventType(Enum):
    """Categories of agency events."""
    WEBINAR = "webinar"
    WORKSHOP = "workshop"
    MEETUP = "meetup"
    CONFERENCE = "conference"
    NETWORKING = "networking"
    FUNDRAISER = "fundraiser"


class EventFormat(Enum):
    """Visual or physical format of the event."""
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"
    HYBRID = "hybrid"


class EventStatus(Enum):
    """Current phase of the event lifecycle."""
    PLANNING = "planning"
    REGISTRATION_OPEN = "registration_open"
    SOLD_OUT = "sold_out"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Event:
    """An agency event entity."""
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
    ticket_price: float = 0.0

    def __post_init__(self):
        if self.capacity < 0:
            raise ValueError("Capacity cannot be negative")
        if self.ticket_price < 0:
            raise ValueError("Ticket price cannot be negative")


@dataclass
class EventRegistration:
    """An attendee registration record."""
    id: str
    event_id: str
    attendee_name: str
    attendee_email: str
    registered_at: datetime = field(default_factory=datetime.now)
    attended: bool = False


class EventCoordinator:
    """
    Event Coordinator System.
    
    Handles the planning, registration, and attendance tracking for agency events.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.events: Dict[str, Event] = {}
        self.registrations: List[EventRegistration] = []
        logger.info(f"Event Coordinator system initialized for {agency_name}")
        self._init_demo_data()
    
    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def _init_demo_data(self):
        """Seed the system with sample event data."""
        logger.info("Loading demo event data...")
        try:
            e = self.create_event("AI Webinar", EventType.WEBINAR, EventFormat.VIRTUAL, "Future of AI", 100)
            e.status = EventStatus.REGISTRATION_OPEN
            e.registered = 45
        except Exception as ex:
            logger.error(f"Demo data error: {ex}")
    
    def create_event(
        self,
        name: str,
        event_type: EventType,
        format: EventFormat,
        description: str,
        capacity: int = 100,
        ticket_price: float = 0.0,
        days_from_now: int = 14
    ) -> Event:
        """Register a new upcoming event."""
        if not name:
            raise ValueError("Event name is required")

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
        logger.info(f"Event created: {name} ({event_type.value})")
        return event
    
    def register_attendee(self, event_id: str, name: str, email: str) -> Optional[EventRegistration]:
        """Sign up a person for a specific event."""
        if event_id not in self.events:
            logger.error(f"Event {event_id} not found")
            return None
            
        e = self.events[event_id]
        if e.registered >= e.capacity:
            logger.warning(f"Event {e.name} is SOLD OUT")
            e.status = EventStatus.SOLD_OUT
            return None
            
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        reg = EventRegistration(
            id=f"REG-{uuid.uuid4().hex[:6].upper()}",
            event_id=event_id, attendee_name=name, attendee_email=email
        )
        self.registrations.append(reg)
        e.registered += 1
        logger.info(f"Registered {name} for {e.name}")
        return reg
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level performance metrics for all events."""
        total_reg = sum(e.registered for e in self.events.values())
        total_cap = sum(e.capacity for e in self.events.values())
        
        return {
            "event_count": len(self.events),
            "total_registered": total_reg,
            "total_capacity": total_cap,
            "fill_rate": (total_reg / total_cap * 100) if total_cap else 0.0
        }
    
    def format_dashboard(self) -> str:
        """Render the Event Coordinator Dashboard."""
        stats = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 EVENT COORDINATOR DASHBOARD{' ' * 31}║",
            f"║  {stats['event_count']} events │ {stats['total_registered']} total registrations │ {stats['fill_rate']:.0f}% fill{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 UPCOMING EVENTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {EventType.WEBINAR: "🎥", EventType.WORKSHOP: "🛠️", EventType.MEETUP: "🤝"}
        status_icons = {EventStatus.REGISTRATION_OPEN: "✅", EventStatus.SOLD_OUT: "🎫", EventStatus.PLANNING: "📝"}
        
        # Display latest 5 events
        for e in sorted(self.events.values(), key=lambda x: x.date)[:5]:
            t_icon = type_icons.get(e.event_type, "📅")
            s_icon = status_icons.get(e.status, "⚪")
            name_disp = (e.name[:20] + '..') if len(e.name) > 22 else e.name
            fill_pct = (e.registered / e.capacity * 100) if e.capacity else 0
            
            lines.append(f"║  {s_icon} {t_icon} {name_disp:<22} │ {e.registered:>3}/{e.capacity:<3} │ {fill_pct:>3.0f}% full ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📅 New Event]  [👥 Attendees]  [📊 Reports]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Connect!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📅 Initializing Event Coordinator...")
    print("=" * 60)
    
    try:
        coordinator = EventCoordinator("Saigon Digital Hub")
        
        # Register attendee for existing demo event
        if coordinator.events:
            eid = list(coordinator.events.keys())[0]
            coordinator.register_attendee(eid, "Jane Smith", "jane@corp.co")
            
        print("\n" + coordinator.format_dashboard())
        
    except Exception as e:
        logger.error(f"Coordinator Error: {e}")
