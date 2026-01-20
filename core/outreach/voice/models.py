"""
Data models for Call Center support.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class CallType(Enum):
    """Call types."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    FOLLOW_UP = "follow_up"
    SCHEDULED = "scheduled"

class CallOutcome(Enum):
    """Call outcomes."""
    RESOLVED = "resolved"
    FOLLOW_UP_NEEDED = "follow_up_needed"
    ESCALATED = "escalated"
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    CALLBACK_REQUESTED = "callback_requested"

@dataclass
class CallLog:
    """A call log record entity."""
    id: str
    client: str
    phone: str
    call_type: CallType
    duration_seconds: int
    outcome: CallOutcome
    notes: str
    agent: str
    timestamp: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.duration_seconds < 0:
            raise ValueError("Duration cannot be negative")

@dataclass
class ScheduledCallback:
    """A scheduled callback record."""
    id: str
    client: str
    phone: str
    scheduled_time: datetime
    reason: str
    completed: bool = False
