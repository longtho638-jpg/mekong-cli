"""
Meeting Booker Agent - Calendar & Scheduling
Handles meeting scheduling, confirmations, and tracking.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class MeetingStatus(Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class MeetingType(Enum):
    DISCOVERY = "discovery"
    DEMO = "demo"
    FOLLOW_UP = "follow_up"
    CLOSING = "closing"


@dataclass
class Meeting:
    """Scheduled meeting"""
    id: str
    lead_name: str
    company: str
    meeting_type: MeetingType
    scheduled_at: datetime
    ae_assigned: str
    status: MeetingStatus = MeetingStatus.SCHEDULED
    duration_mins: int = 30
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class MeetingBookerAgent:
    """
    Meeting Booker Agent - Đặt lịch Họp
    
    Responsibilities:
    - Schedule meetings
    - Send confirmations
    - Track no-shows
    - Manage calendar
    """
    
    # Available slots (hour of day)
    AVAILABLE_SLOTS = [9, 10, 11, 14, 15, 16, 17]
    
    def __init__(self):
        self.name = "Meeting Booker"
        self.status = "ready"
        self.meetings: Dict[str, Meeting] = {}
        
    def book(
        self,
        lead_name: str,
        company: str,
        meeting_type: MeetingType,
        scheduled_at: datetime,
        ae_assigned: str,
        duration_mins: int = 30
    ) -> Meeting:
        """Book a new meeting"""
        meeting_id = f"meeting_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        meeting = Meeting(
            id=meeting_id,
            lead_name=lead_name,
            company=company,
            meeting_type=meeting_type,
            scheduled_at=scheduled_at,
            ae_assigned=ae_assigned,
            duration_mins=duration_mins
        )
        
        self.meetings[meeting_id] = meeting
        return meeting
    
    def confirm(self, meeting_id: str) -> Meeting:
        """Confirm meeting"""
        if meeting_id not in self.meetings:
            raise ValueError(f"Meeting not found: {meeting_id}")
            
        meeting = self.meetings[meeting_id]
        meeting.status = MeetingStatus.CONFIRMED
        
        return meeting
    
    def complete(self, meeting_id: str, notes: str = "") -> Meeting:
        """Mark meeting as completed"""
        if meeting_id not in self.meetings:
            raise ValueError(f"Meeting not found: {meeting_id}")
            
        meeting = self.meetings[meeting_id]
        meeting.status = MeetingStatus.COMPLETED
        meeting.notes = notes
        
        return meeting
    
    def mark_no_show(self, meeting_id: str) -> Meeting:
        """Mark meeting as no-show"""
        if meeting_id not in self.meetings:
            raise ValueError(f"Meeting not found: {meeting_id}")
            
        meeting = self.meetings[meeting_id]
        meeting.status = MeetingStatus.NO_SHOW
        
        return meeting
    
    def get_today_meetings(self) -> List[Meeting]:
        """Get today's meetings"""
        today = datetime.now().date()
        return [
            m for m in self.meetings.values()
            if m.scheduled_at.date() == today
        ]
    
    def get_upcoming(self, days: int = 7) -> List[Meeting]:
        """Get upcoming meetings"""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            m for m in self.meetings.values()
            if m.scheduled_at <= cutoff and m.status in [MeetingStatus.SCHEDULED, MeetingStatus.CONFIRMED]
        ]
    
    def get_stats(self) -> Dict:
        """Get meeting stats"""
        meetings = list(self.meetings.values())
        completed = len([m for m in meetings if m.status == MeetingStatus.COMPLETED])
        no_shows = len([m for m in meetings if m.status == MeetingStatus.NO_SHOW])
        
        return {
            "total_meetings": len(meetings),
            "scheduled": len([m for m in meetings if m.status in [MeetingStatus.SCHEDULED, MeetingStatus.CONFIRMED]]),
            "completed": completed,
            "no_shows": no_shows,
            "show_rate": f"{completed/(completed+no_shows)*100:.0f}%" if (completed + no_shows) > 0 else "100%",
            "today": len(self.get_today_meetings())
        }


# Demo
if __name__ == "__main__":
    agent = MeetingBookerAgent()
    
    print("📅 Meeting Booker Agent Demo\n")
    
    # Book meetings
    m1 = agent.book(
        "Nguyễn A", "TechCorp VN", MeetingType.DISCOVERY,
        datetime.now() + timedelta(hours=2), "AE_001"
    )
    m2 = agent.book(
        "Trần B", "StartupX", MeetingType.DEMO,
        datetime.now() + timedelta(days=1, hours=3), "AE_001"
    )
    
    print(f"📋 Meeting: {m1.company}")
    print(f"   Type: {m1.meeting_type.value}")
    print(f"   Time: {m1.scheduled_at.strftime('%Y-%m-%d %H:%M')}")
    
    # Confirm and complete
    agent.confirm(m1.id)
    agent.complete(m1.id, "Great discovery call")
    
    print(f"\n✅ Status: {m1.status.value}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_meetings']}")
    print(f"   Show Rate: {stats['show_rate']}")
