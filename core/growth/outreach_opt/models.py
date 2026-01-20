"""
Data models and Enums for Automated Outreach.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional


class OutreachTrigger(Enum):
    """Outreach triggers."""
    NEW_LEAD = "new_lead"
    WEBSITE_VISIT = "website_visit"
    PROPOSAL_SENT = "proposal_sent"
    NO_RESPONSE = "no_response"
    MEETING_BOOKED = "meeting_booked"

class EmailStatus(Enum):
    """Email status."""
    PENDING = "pending"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"

@dataclass
class OutreachEmail:
    """An outreach email entity."""
    id: str
    recipient: str
    subject: str
    body: str
    sequence_name: str
    status: EmailStatus = EmailStatus.PENDING
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None

@dataclass
class OutreachSequence:
    """An email sequence configuration."""
    id: str
    name: str
    trigger: OutreachTrigger
    emails_count: int
    delay_days: List[int]
    active: bool = True
    sent_count: int = 0
    reply_rate: float = 0.0
