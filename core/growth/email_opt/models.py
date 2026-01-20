"""
Data models and Enums for Email Automation.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class SequenceType(Enum):
    """Categories for automated email sequences."""
    WELCOME = "welcome"
    ONBOARDING = "onboarding"
    NURTURE = "nurture"
    PROPOSAL_FOLLOW = "proposal_follow"
    REENGAGEMENT = "reengagement"
    UPSELL = "upsell"

class EmailStatus(Enum):
    """Current state of a scheduled or sent email."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"

@dataclass
class EmailTemplate:
    """An email template entity."""
    id: str
    name: str
    subject: str
    body: str
    category: SequenceType
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class ScheduledEmail:
    """A single email scheduled for delivery."""
    id: str
    template_id: str
    recipient_email: str
    recipient_name: str
    personalization: Dict[str, str]
    scheduled_for: datetime
    status: EmailStatus = EmailStatus.SCHEDULED
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None

@dataclass
class EmailSequence:
    """An automated workflow of multiple emails."""
    id: str
    name: str
    type: SequenceType
    emails: List[Dict[str, Any]]  # {template_id, delay_days}
    active: bool = True
    enrollments: int = 0
