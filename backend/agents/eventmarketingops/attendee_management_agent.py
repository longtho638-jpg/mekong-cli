"""
Attendee Management Agent - Registrations & Check-ins
Manages event attendees, registrations, and lead capture.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class RegistrationStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class LeadScore(Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


@dataclass
class Attendee:
    """Event attendee"""

    id: str
    event_id: str
    email: str
    name: str
    company: str
    title: str
    status: RegistrationStatus = RegistrationStatus.PENDING
    lead_score: LeadScore = LeadScore.COLD
    checked_in_at: Optional[datetime] = None
    notes: str = ""


class AttendeeManagementAgent:
    """
    Attendee Management Agent - Quản lý Người tham dự

    Responsibilities:
    - Registration processing
    - Check-in tracking
    - Lead capture & scoring
    - Post-event follow-up
    """

    def __init__(self):
        self.name = "Attendee Management"
        self.status = "ready"
        self.attendees: Dict[str, Attendee] = {}

    def register_attendee(
        self, event_id: str, email: str, name: str, company: str, title: str
    ) -> Attendee:
        """Register new attendee"""
        attendee_id = f"att_{random.randint(1000, 9999)}"

        # Score lead based on title
        lead_score = LeadScore.COLD
        title_lower = title.lower()
        if any(t in title_lower for t in ["cto", "ceo", "vp", "director"]):
            lead_score = LeadScore.HOT
        elif any(t in title_lower for t in ["manager", "lead", "head"]):
            lead_score = LeadScore.WARM

        attendee = Attendee(
            id=attendee_id,
            event_id=event_id,
            email=email,
            name=name,
            company=company,
            title=title,
            lead_score=lead_score,
        )

        self.attendees[attendee_id] = attendee
        return attendee

    def confirm_registration(self, attendee_id: str) -> Attendee:
        """Confirm registration"""
        if attendee_id not in self.attendees:
            raise ValueError(f"Attendee not found: {attendee_id}")

        self.attendees[attendee_id].status = RegistrationStatus.CONFIRMED
        return self.attendees[attendee_id]

    def check_in(self, attendee_id: str) -> Attendee:
        """Check in attendee"""
        if attendee_id not in self.attendees:
            raise ValueError(f"Attendee not found: {attendee_id}")

        attendee = self.attendees[attendee_id]
        attendee.status = RegistrationStatus.CHECKED_IN
        attendee.checked_in_at = datetime.now()
        return attendee

    def get_event_attendees(self, event_id: str) -> List[Attendee]:
        """Get attendees for event"""
        return [a for a in self.attendees.values() if a.event_id == event_id]

    def get_leads(self, score: LeadScore = None) -> List[Attendee]:
        """Get leads by score"""
        if score:
            return [a for a in self.attendees.values() if a.lead_score == score]
        return list(self.attendees.values())

    def get_stats(self, event_id: str = None) -> Dict:
        """Get attendee statistics"""
        attendees = (
            self.get_event_attendees(event_id) if event_id else list(self.attendees.values())
        )

        confirmed = len(
            [
                a
                for a in attendees
                if a.status in [RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN]
            ]
        )
        checked_in = len([a for a in attendees if a.status == RegistrationStatus.CHECKED_IN])
        hot_leads = len([a for a in attendees if a.lead_score == LeadScore.HOT])

        return {
            "total_registrations": len(attendees),
            "confirmed": confirmed,
            "checked_in": checked_in,
            "check_in_rate": (checked_in / confirmed * 100) if confirmed > 0 else 0,
            "hot_leads": hot_leads,
        }


# Demo
if __name__ == "__main__":
    agent = AttendeeManagementAgent()

    print("👥 Attendee Management Agent Demo\n")

    event_id = "evt_123"

    # Register attendees
    a1 = agent.register_attendee(event_id, "jane@techcorp.com", "Jane Doe", "TechCorp", "CTO")
    a2 = agent.register_attendee(
        event_id, "john@startup.io", "John Smith", "Startup Inc", "Developer"
    )
    a3 = agent.register_attendee(
        event_id, "bob@enterprise.com", "Bob Wilson", "Enterprise Co", "VP Engineering"
    )

    print("📋 Registered: 3 attendees")

    # Show lead scoring
    print("\n🎯 Lead Scoring:")
    for a in [a1, a2, a3]:
        print(f"   {a.name} ({a.title}): {a.lead_score.value}")

    # Confirm & check in
    agent.confirm_registration(a1.id)
    agent.confirm_registration(a2.id)
    agent.check_in(a1.id)

    print("\n✅ Check-in:")
    print(f"   {a1.name}: {a1.status.value} at {a1.checked_in_at.strftime('%H:%M')}")

    # Stats
    stats = agent.get_stats(event_id)
    print("\n📊 Stats:")
    print(f"   Registrations: {stats['total_registrations']}")
    print(f"   Confirmed: {stats['confirmed']}")
    print(f"   Checked In: {stats['checked_in']}")
    print(f"   Hot Leads: {stats['hot_leads']}")
