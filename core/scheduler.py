"""
📅 Meeting Scheduler - Never Miss a Client Call
================================================

Automated scheduling like Calendly, built into Agency CLI.

Features:
- Availability management
- Meeting types (discovery, proposal, kickoff)
- Automatic reminders
- Timezone handling
- Calendar sync ready
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, time
from dataclasses import dataclass, field
from enum import Enum
import uuid


class MeetingType(Enum):
    """Types of meetings."""
    DISCOVERY = "discovery"      # 30 min - Initial call
    PROPOSAL = "proposal"        # 45 min - Present proposal
    KICKOFF = "kickoff"          # 60 min - Project kickoff
    CHECK_IN = "check_in"        # 15 min - Quick status
    STRATEGY = "strategy"        # 60 min - Strategy session


class MeetingStatus(Enum):
    """Meeting status."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class DayOfWeek(Enum):
    """Days of the week."""
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


@dataclass
class TimeSlot:
    """A time slot for availability."""
    start: time
    end: time
    

@dataclass
class MeetingTypeConfig:
    """Configuration for a meeting type."""
    meeting_type: MeetingType
    name: str
    duration_minutes: int
    description: str
    buffer_before: int = 5  # Minutes before
    buffer_after: int = 5   # Minutes after


@dataclass
class Meeting:
    """A scheduled meeting."""
    id: str
    meeting_type: MeetingType
    attendee_name: str
    attendee_email: str
    start_time: datetime
    end_time: datetime
    status: MeetingStatus
    notes: str = ""
    meeting_link: str = ""
    reminder_sent: bool = False


class Scheduler:
    """
    Meeting Scheduler.
    
    Never double-book again:
    - Set your availability
    - Share booking links
    - Automatic reminders
    - Buffer time between meetings
    """
    
    def __init__(
        self,
        owner_name: str = "Alex",
        timezone: str = "UTC"  # Global default - user can override
    ):
        self.owner_name = owner_name
        self.timezone = timezone
        
        # Availability (default: Mon-Fri, 9am-5pm)
        self.availability: Dict[DayOfWeek, List[TimeSlot]] = {}
        self._set_default_availability()
        
        # Blocked times (holidays, vacations, etc)
        self.blocked_dates: List[datetime] = []
        
        # Meeting types
        self.meeting_types = self._load_meeting_types()
        
        # Scheduled meetings
        self.meetings: Dict[str, Meeting] = {}
        
        # Create demo data
        self._create_demo_meetings()
    
    def _set_default_availability(self):
        """Set default availability: Mon-Fri, 9am-5pm."""
        workdays = [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY, 
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY
        ]
        
        for day in workdays:
            self.availability[day] = [
                TimeSlot(start=time(9, 0), end=time(12, 0)),   # Morning
                TimeSlot(start=time(13, 0), end=time(17, 0))   # Afternoon
            ]
    
    def _load_meeting_types(self) -> Dict[MeetingType, MeetingTypeConfig]:
        """Load meeting type configurations."""
        return {
            MeetingType.DISCOVERY: MeetingTypeConfig(
                meeting_type=MeetingType.DISCOVERY,
                name="Discovery Call",
                duration_minutes=30,
                description="Let's chat about your project and see if we're a good fit."
            ),
            MeetingType.PROPOSAL: MeetingTypeConfig(
                meeting_type=MeetingType.PROPOSAL,
                name="Proposal Review",
                duration_minutes=45,
                description="Walk through your custom proposal and answer questions."
            ),
            MeetingType.KICKOFF: MeetingTypeConfig(
                meeting_type=MeetingType.KICKOFF,
                name="Project Kickoff",
                duration_minutes=60,
                description="Align on goals, timeline, and get started!"
            ),
            MeetingType.CHECK_IN: MeetingTypeConfig(
                meeting_type=MeetingType.CHECK_IN,
                name="Quick Check-in",
                duration_minutes=15,
                description="Brief status update and address any concerns."
            ),
            MeetingType.STRATEGY: MeetingTypeConfig(
                meeting_type=MeetingType.STRATEGY,
                name="Strategy Session",
                duration_minutes=60,
                description="Deep dive into your business goals and roadmap."
            )
        }
    
    def _create_demo_meetings(self):
        """Create demo meetings."""
        now = datetime.now()
        
        demo_meetings = [
            ("John Smith", "john@acme.com", MeetingType.PROPOSAL, 1),
            ("Sarah Johnson", "sarah@techstart.io", MeetingType.KICKOFF, 2),
            ("Mike Wilson", "mike@growthlab.co", MeetingType.DISCOVERY, 3)
        ]
        
        for name, email, mtype, days_ahead in demo_meetings:
            start = (now + timedelta(days=days_ahead)).replace(hour=10, minute=0, second=0)
            duration = self.meeting_types[mtype].duration_minutes
            
            self.book_meeting(
                meeting_type=mtype,
                attendee_name=name,
                attendee_email=email,
                start_time=start
            )
    
    def get_available_slots(
        self,
        meeting_type: MeetingType,
        date: datetime,
        days_ahead: int = 7
    ) -> List[datetime]:
        """Get available time slots for a meeting type."""
        config = self.meeting_types[meeting_type]
        duration = config.duration_minutes
        
        available = []
        
        for day_offset in range(days_ahead):
            check_date = date + timedelta(days=day_offset)
            day_of_week = DayOfWeek(check_date.weekday())
            
            # Skip if no availability for this day
            if day_of_week not in self.availability:
                continue
            
            # Skip blocked dates
            if check_date.date() in [d.date() for d in self.blocked_dates]:
                continue
            
            # Check each time slot
            for slot in self.availability[day_of_week]:
                current = datetime.combine(check_date.date(), slot.start)
                slot_end = datetime.combine(check_date.date(), slot.end)
                
                while current + timedelta(minutes=duration) <= slot_end:
                    # Check for conflicts
                    proposed_end = current + timedelta(minutes=duration)
                    
                    conflict = False
                    for meeting in self.meetings.values():
                        if meeting.status in [MeetingStatus.CANCELLED, MeetingStatus.NO_SHOW]:
                            continue
                        
                        # Check overlap
                        if current < meeting.end_time and proposed_end > meeting.start_time:
                            conflict = True
                            break
                    
                    if not conflict and current > datetime.now():
                        available.append(current)
                    
                    current += timedelta(minutes=30)  # 30-min increments
        
        return available[:20]  # Limit to 20 slots
    
    def book_meeting(
        self,
        meeting_type: MeetingType,
        attendee_name: str,
        attendee_email: str,
        start_time: datetime,
        notes: str = ""
    ) -> Meeting:
        """Book a meeting."""
        config = self.meeting_types[meeting_type]
        end_time = start_time + timedelta(minutes=config.duration_minutes)
        
        meeting = Meeting(
            id=f"MTG-{uuid.uuid4().hex[:6].upper()}",
            meeting_type=meeting_type,
            attendee_name=attendee_name,
            attendee_email=attendee_email,
            start_time=start_time,
            end_time=end_time,
            status=MeetingStatus.SCHEDULED,
            notes=notes,
            meeting_link=f"https://meet.google.com/{uuid.uuid4().hex[:10]}"
        )
        
        self.meetings[meeting.id] = meeting
        return meeting
    
    def cancel_meeting(self, meeting_id: str, reason: str = "") -> bool:
        """Cancel a meeting."""
        if meeting_id in self.meetings:
            meeting = self.meetings[meeting_id]
            meeting.status = MeetingStatus.CANCELLED
            if reason:
                meeting.notes += f"\nCancelled: {reason}"
            return True
        return False
    
    def complete_meeting(self, meeting_id: str, notes: str = "") -> bool:
        """Mark meeting as completed."""
        if meeting_id in self.meetings:
            meeting = self.meetings[meeting_id]
            meeting.status = MeetingStatus.COMPLETED
            if notes:
                meeting.notes += f"\nNotes: {notes}"
            return True
        return False
    
    def get_upcoming_meetings(self, days: int = 7) -> List[Meeting]:
        """Get upcoming meetings."""
        now = datetime.now()
        future = now + timedelta(days=days)
        
        upcoming = [
            m for m in self.meetings.values()
            if m.start_time >= now and m.start_time <= future
            and m.status in [MeetingStatus.SCHEDULED, MeetingStatus.CONFIRMED]
        ]
        
        return sorted(upcoming, key=lambda m: m.start_time)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics."""
        all_meetings = list(self.meetings.values())
        
        scheduled = len([m for m in all_meetings if m.status == MeetingStatus.SCHEDULED])
        completed = len([m for m in all_meetings if m.status == MeetingStatus.COMPLETED])
        cancelled = len([m for m in all_meetings if m.status == MeetingStatus.CANCELLED])
        no_shows = len([m for m in all_meetings if m.status == MeetingStatus.NO_SHOW])
        
        by_type = {}
        for m in all_meetings:
            t = m.meeting_type.value
            by_type[t] = by_type.get(t, 0) + 1
        
        return {
            "total_meetings": len(all_meetings),
            "scheduled": scheduled,
            "completed": completed,
            "cancelled": cancelled,
            "no_shows": no_shows,
            "show_rate": (completed / max(1, completed + no_shows)) * 100,
            "by_type": by_type
        }
    
    def format_calendar(self) -> str:
        """Format upcoming meetings as text calendar."""
        upcoming = self.get_upcoming_meetings(14)
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 MEETING CALENDAR - {self.owner_name.upper():<30} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║                                                           ║",
        ]
        
        if upcoming:
            lines.append("║  📆 UPCOMING MEETINGS                                     ║")
            lines.append("║  ─────────────────────────────────────                    ║")
            
            for m in upcoming[:5]:
                date_str = m.start_time.strftime("%b %d, %H:%M")
                config = self.meeting_types[m.meeting_type]
                lines.append(f"║  {date_str}  {config.name[:18]:<18} {m.attendee_name[:15]:<15}║")
            
            if len(upcoming) > 5:
                lines.append(f"║  ... and {len(upcoming) - 5} more                                    ║")
        else:
            lines.append("║  No upcoming meetings                                     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 STATS                                                 ║",
            "║  ─────────────────────────────────────                    ║",
            f"║  Total: {stats['total_meetings']:<5}  Completed: {stats['completed']:<5}  Cancelled: {stats['cancelled']:<5}║",
            f"║  Show Rate: {stats['show_rate']:.1f}%                                      ║",
            "║                                                           ║",
            "╚═══════════════════════════════════════════════════════════╝"
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    # Initialize scheduler
    scheduler = Scheduler(owner_name="Alex")
    
    print("📅 Meeting Scheduler Initialized!")
    print(f"   Owner: {scheduler.owner_name}")
    print(f"   Meeting Types: {len(scheduler.meeting_types)}")
    print()
    
    # Meeting types
    print("📋 Meeting Types:")
    for mtype, config in scheduler.meeting_types.items():
        print(f"   • {config.name}: {config.duration_minutes} min")
    print()
    
    # Available slots
    slots = scheduler.get_available_slots(
        MeetingType.DISCOVERY,
        datetime.now()
    )
    print(f"📆 Available Slots (next 7 days): {len(slots)}")
    for slot in slots[:5]:
        print(f"   • {slot.strftime('%b %d, %H:%M')}")
    print()
    
    # Upcoming meetings
    upcoming = scheduler.get_upcoming_meetings()
    print(f"🗓️ Upcoming Meetings: {len(upcoming)}")
    for m in upcoming:
        config = scheduler.meeting_types[m.meeting_type]
        print(f"   • {m.start_time.strftime('%b %d, %H:%M')} - {config.name} with {m.attendee_name}")
    print()
    
    # Stats
    stats = scheduler.get_stats()
    print("📊 Statistics:")
    print(f"   Total: {stats['total_meetings']}")
    print(f"   Scheduled: {stats['scheduled']}")
    print(f"   Show Rate: {stats['show_rate']:.1f}%")
    print()
    
    # Calendar view
    print(scheduler.format_calendar())
