"""
📅 Meeting Scheduler - Book Client Calls
==========================================

Schedule and manage client meetings.
Never miss a call again!

Features:
- Available time slots
- Meeting booking
- Reminder emails
- Calendar integration ready
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class MeetingType(Enum):
    """Meeting types."""
    DISCOVERY = "discovery"
    STRATEGY = "strategy"
    KICKOFF = "kickoff"
    REVIEW = "review"
    SUPPORT = "support"


class MeetingStatus(Enum):
    """Meeting status."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


@dataclass
class TimeSlot:
    """An available time slot."""
    start: datetime
    end: datetime
    available: bool = True


@dataclass
class Meeting:
    """A scheduled meeting."""
    id: str
    type: MeetingType
    client_name: str
    client_email: str
    start_time: datetime
    duration_minutes: int
    status: MeetingStatus
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def end_time(self) -> datetime:
        return self.start_time + timedelta(minutes=self.duration_minutes)


class MeetingScheduler:
    """
    Meeting Scheduler.
    
    Schedule and manage client meetings.
    """
    
    # Default meeting durations
    DURATIONS = {
        MeetingType.DISCOVERY: 30,
        MeetingType.STRATEGY: 60,
        MeetingType.KICKOFF: 45,
        MeetingType.REVIEW: 30,
        MeetingType.SUPPORT: 15,
    }
    
    def __init__(self, agency_name: str, timezone: str = "UTC"):
        self.agency_name = agency_name
        self.timezone = timezone
        self.meetings: Dict[str, Meeting] = {}
        self.working_hours = {"start": 9, "end": 17}  # 9 AM - 5 PM
    
    def get_available_slots(
        self,
        date: datetime,
        duration: int = 30
    ) -> List[TimeSlot]:
        """Get available time slots for a date."""
        slots = []
        
        start_hour = self.working_hours["start"]
        end_hour = self.working_hours["end"]
        
        current = date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        end = date.replace(hour=end_hour, minute=0, second=0, microsecond=0)
        
        while current + timedelta(minutes=duration) <= end:
            # Check if slot conflicts with existing meetings
            available = True
            for meeting in self.meetings.values():
                if meeting.status == MeetingStatus.CANCELLED:
                    continue
                if (current < meeting.end_time and 
                    current + timedelta(minutes=duration) > meeting.start_time):
                    available = False
                    break
            
            slots.append(TimeSlot(
                start=current,
                end=current + timedelta(minutes=duration),
                available=available
            ))
            
            current += timedelta(minutes=30)  # 30-min increments
        
        return slots
    
    def book_meeting(
        self,
        meeting_type: MeetingType,
        client_name: str,
        client_email: str,
        start_time: datetime,
        notes: str = ""
    ) -> Meeting:
        """Book a new meeting."""
        import uuid
        
        meeting = Meeting(
            id=f"MTG-{uuid.uuid4().hex[:6].upper()}",
            type=meeting_type,
            client_name=client_name,
            client_email=client_email,
            start_time=start_time,
            duration_minutes=self.DURATIONS[meeting_type],
            status=MeetingStatus.SCHEDULED,
            notes=notes
        )
        
        self.meetings[meeting.id] = meeting
        return meeting
    
    def format_confirmation(self, meeting: Meeting) -> str:
        """Format meeting confirmation."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 MEETING CONFIRMED                                     ║",
            f"║  ID: {meeting.id:<48}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Type: {meeting.type.value.capitalize():<46}  ║",
            f"║  Client: {meeting.client_name:<44}  ║",
            f"║  Email: {meeting.client_email:<45}  ║",
            "║                                                           ║",
            f"║  📆 {meeting.start_time.strftime('%A, %B %d, %Y'):<48}  ║",
            f"║  ⏰ {meeting.start_time.strftime('%I:%M %p')} - {meeting.end_time.strftime('%I:%M %p'):<36}  ║",
            f"║  ⏱️ Duration: {meeting.duration_minutes} minutes                              ║",
            "║                                                           ║",
        ]
        
        if meeting.notes:
            lines.append(f"║  📝 Notes: {meeting.notes[:40]:<42}  ║")
            lines.append("║                                                           ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ✅ You'll receive a reminder 24 hours before             ║",
            "║  ✅ Join link will be sent 1 hour before                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_reminder(self, meeting: Meeting) -> str:
        """Format meeting reminder email."""
        return f"""Subject: 📅 Reminder: Meeting Tomorrow with {self.agency_name}

Hi {meeting.client_name}! 👋

Just a friendly reminder about our meeting tomorrow:

📆 Date: {meeting.start_time.strftime('%A, %B %d, %Y')}
⏰ Time: {meeting.start_time.strftime('%I:%M %p')} ({meeting.duration_minutes} min)
📋 Type: {meeting.type.value.capitalize()} Call

If you need to reschedule, please let us know ASAP!

Looking forward to speaking with you.

Best,
{self.agency_name} Team 🏯
"""
    
    def format_calendar(self, date: datetime) -> str:
        """Format daily calendar view."""
        slots = self.get_available_slots(date)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 CALENDAR: {date.strftime('%A, %B %d, %Y'):<39}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Time        │ Status      │ Details                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for slot in slots:
            time_str = slot.start.strftime('%I:%M %p')
            
            # Find meeting in this slot
            meeting_in_slot = None
            for meeting in self.meetings.values():
                if meeting.start_time == slot.start:
                    meeting_in_slot = meeting
                    break
            
            if meeting_in_slot:
                status = "🔴 Booked"
                details = f"{meeting_in_slot.client_name[:20]}"
            elif slot.available:
                status = "🟢 Free"
                details = "Available"
            else:
                status = "🟡 Busy"
                details = "Blocked"
            
            lines.append(f"║  {time_str:<10}  │ {status:<11} │ {details:<28} ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Total Slots: {len(slots):<20}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    scheduler = MeetingScheduler("Saigon Digital Hub")
    
    print("📅 Meeting Scheduler")
    print("=" * 60)
    print()
    
    # Book a meeting
    tomorrow = datetime.now() + timedelta(days=1)
    meeting_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
    
    meeting = scheduler.book_meeting(
        meeting_type=MeetingType.DISCOVERY,
        client_name="Mr. Hoang",
        client_email="hoang@sunriserealty.vn",
        start_time=meeting_time,
        notes="Discuss marketing strategy"
    )
    
    print(scheduler.format_confirmation(meeting))
    print()
    
    print("📆 Tomorrow's Calendar:")
    print()
    print(scheduler.format_calendar(tomorrow))
    print()
    
    print(f"✅ Meeting booked: {meeting.id}")
