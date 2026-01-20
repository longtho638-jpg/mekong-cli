"""
Demo Manager Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DemoType(Enum):
    DISCOVERY = "discovery"
    TECHNICAL = "technical"
    EXECUTIVE = "executive"
    FINAL = "final"

class DemoOutcome(Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    POSITIVE = "positive"
    NEGATIVE = "negative"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

@dataclass
class Demo:
    id: str
    prospect: str
    company: str
    demo_type: DemoType
    scheduled_at: datetime
    se_assigned: str
    outcome: DemoOutcome = DemoOutcome.SCHEDULED
    notes: str = ""
    deal_size: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
