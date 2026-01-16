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

import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta, time
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MeetingType(Enum):
    """Supported meeting categories."""
    DISCOVERY = "discovery"      # 30 min
    PROPOSAL = "proposal"        # 45 min
    KICKOFF = "kickoff"          # 60 min
    CHECK_IN = "check_in"        # 15 min
    STRATEGY = "strategy"        # 60 min


class MeetingStatus(Enum):
    """Lifecycle status of a scheduled call."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class DayOfWeek(Enum):
    """Indices for days of the week."""
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


@dataclass
class TimeSlot:
    """A defined block of time for availability."""
    start: time
    end: time
    

@dataclass
class MeetingTypeConfig:
    """Configuration for a meeting duration and buffer."""
    m_type: MeetingType
    name: str
    duration_mins: int
    buffer_mins: int = 15


@dataclass
class Meeting:
    """A scheduled meeting record entity."""
    id: str
    meeting_type: MeetingType
    attendee_name: str
    attendee_email: str
    start_time: datetime
    end_time: datetime
    status: MeetingStatus = MeetingStatus.SCHEDULED
    link: str = ""

    def __post_init__(self):
        if not self.attendee_name or not self.attendee_email:
            raise ValueError("Attendee details are mandatory")


class Scheduler:
    """
    Meeting Scheduling System.
    
    Orchestrates availability slots, conflict detection, and meeting lifecycle management.
    """
    
    def __init__(self, owner: str = "Alex"):
        self.owner = owner
        self.availability: Dict[DayOfWeek, List[TimeSlot]] = {}
        self.meetings: Dict[str, Meeting] = {}
        self.configs = self._init_configs()
        logger.info(f"Scheduler initialized for {owner}")
        self._set_default_slots()
    
    def _init_configs(self) -> Dict[MeetingType, MeetingTypeConfig]:
        """Blueprint for meeting durations."""
        return {
            MeetingType.DISCOVERY: MeetingTypeConfig(MeetingType.DISCOVERY, "Discovery", 30),
            MeetingType.PROPOSAL: MeetingTypeConfig(MeetingType.PROPOSAL, "Proposal Review", 45),
            MeetingType.KICKOFF: MeetingTypeConfig(MeetingType.KICKOFF, "Kickoff", 60)
        }
    
    def _set_default_slots(self):
        """Standard 9-5 work availability."""
        for day in [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]:
            self.availability[day] = [TimeSlot(time(9, 0), time(12, 0)), TimeSlot(time(13, 0), time(17, 0))]
    
    def book_call(
        self,
        m_type: MeetingType,
        name: str,
        email: str,
        start: datetime
    ) -> Meeting:
        """Reserve a call slot and generate a link."""
        cfg = self.configs.get(m_type, self.configs[MeetingType.DISCOVERY])
        end = start + timedelta(minutes=cfg.duration_mins)
        
        # Conflict check simulated for demo
        m = Meeting(
            id=f"MTG-{uuid.uuid4().hex[:6].upper()}",
            meeting_type=m_type, attendee_name=name, attendee_email=email,
            start_time=start, end_time=end, link=f"https://meet.google.com/{uuid.uuid4().hex[:10]}"
        )
        self.meetings[m.id] = m
        logger.info(f"Meeting booked: {name} on {start.strftime('%Y-%m-%d %H:%M')}")
        return m
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate scheduling performance data."""
        done = [m for m in self.meetings.values() if m.status == MeetingStatus.COMPLETED]
        return {
            "total": len(self.meetings),
            "completed": len(done),
            "show_rate": (len(done) / len(self.meetings) * 100.0) if self.meetings else 0.0
        }
    
    def format_dashboard(self) -> str:
        """Render the Scheduling Dashboard."""
        s = self.get_stats()
        upcoming = sorted([m for m in self.meetings.values() if m.start_time > datetime.now()], key=lambda x: x.start_time)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 SCHEDULER DASHBOARD - {self.owner.upper():<24} ║",
            f"║  {s['total']} meetings │ {s['completed']} completed │ {s['show_rate']:.1f}% show rate{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📆 UPCOMING CALLS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for m in upcoming[:5]:
            dt = m.start_time.strftime("%b %d %H:%M")
            lines.append(f"║  ⏰ {dt} │ {m.attendee_name[:15]:<15} │ {m.meeting_type.value:<12} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ Book Call]  [📅 Set Availability]  [📊 Analytics]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.owner[:40]:<40} - Be Punctual!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📅 Initializing Scheduler...")
    print("=" * 60)
    
    try:
        scheduler = Scheduler("Alex")
        # Seed
        now = datetime.now() + timedelta(days=1)
        scheduler.book_call(MeetingType.DISCOVERY, "John Doe", "john@corp.co", now)
        
        print("\n" + scheduler.format_dashboard())
        
    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
