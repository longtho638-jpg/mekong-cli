"""
Outreach Agent Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class OutreachStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    OPENED = "opened"
    REPLIED = "replied"

class SequenceStep(Enum):
    INITIAL = "initial"
    FOLLOW_UP_1 = "follow_up_1"
    FOLLOW_UP_2 = "follow_up_2"
    FINAL = "final"

@dataclass
class OutreachCampaign:
    id: str
    candidate_name: str
    candidate_email: str
    job_title: str
    current_step: SequenceStep = SequenceStep.INITIAL
    status: OutreachStatus = OutreachStatus.DRAFT
    sent_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
