"""
Scheduler models and Enums.
"""
from dataclasses import dataclass
from datetime import datetime, time
from enum import Enum


class MeetingType(Enum):
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    KICKOFF = "kickoff"
    CHECK_IN = "check_in"

class MeetingStatus(Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class TimeSlot:
    start: time
    end: time

@dataclass
class Meeting:
    id: str
    meeting_type: MeetingType
    attendee_name: str
    attendee_email: str
    start_time: datetime
    end_time: datetime
    status: MeetingStatus = MeetingStatus.SCHEDULED
    link: str = ""
