"""
Scheduler core engine logic.
"""
import logging
import uuid
from datetime import datetime, time, timedelta
from typing import Dict, List

from .models import Meeting, MeetingStatus, MeetingType, TimeSlot

logger = logging.getLogger(__name__)

class SchedulerEngine:
    def __init__(self, owner: str):
        self.owner = owner
        self.meetings: Dict[str, Meeting] = {}
        self.availability: Dict[int, List[TimeSlot]] = {}

    def book_call(self, m_type: MeetingType, name: str, email: str, start: datetime, duration_mins: int = 30) -> Meeting:
        end = start + timedelta(minutes=duration_mins)
        m = Meeting(id=f"MTG-{uuid.uuid4().hex[:6].upper()}", meeting_type=m_type, attendee_name=name, attendee_email=email, start_time=start, end_time=end, link=f"https://meet.google.com/{uuid.uuid4().hex[:10]}")
        self.meetings[m.id] = m
        return m
