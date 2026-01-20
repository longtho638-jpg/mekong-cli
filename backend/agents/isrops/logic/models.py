"""
Activity Tracker Data Models.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum


class ActivityType(Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    LINKEDIN = "linkedin"
    NOTE = "note"

class ActivityOutcome(Enum):
    COMPLETED = "completed"
    NO_ANSWER = "no_answer"
    LEFT_VOICEMAIL = "left_voicemail"
    CONNECTED = "connected"
    SCHEDULED = "scheduled"

@dataclass
class Activity:
    id: str
    activity_type: ActivityType
    prospect_id: str
    prospect_name: str
    outcome: ActivityOutcome
    duration_mins: int = 0
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class DailyStats:
    date: date
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    talk_time_mins: int = 0
    connects: int = 0
