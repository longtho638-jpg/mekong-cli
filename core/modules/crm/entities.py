"""
CRM Module - Data Entities
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Any
from datetime import datetime, timedelta

class ContactType(Enum):
    """Lifecycle stages of a contact."""
    LEAD = "lead"
    PROSPECT = "prospect"
    CLIENT = "client"
    PARTNER = "partner"
    CHURNED = "churned"


class DealStage(Enum):
    """Phases of the sales pipeline."""
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(Enum):
    """Categorization of sales interactions."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    TASK = "task"


@dataclass
class Contact:
    """A CRM contact entity."""
    id: str
    name: str
    email: str
    company: str = ""
    phone: str = ""
    contact_type: ContactType = ContactType.LEAD
    created_at: datetime = field(default_factory=datetime.now)
    lead_score: int = 50  # 0-100
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    last_contact: Optional[datetime] = None

    def __post_init__(self):
        if not 0 <= self.lead_score <= 100:
            self.lead_score = 50


@dataclass
class Deal:
    """A specific sales opportunity."""
    id: str
    contact_id: str
    title: str
    value: float
    stage: DealStage
    created_at: datetime = field(default_factory=datetime.now)
    expected_close: Optional[datetime] = None
    probability: int = 20  # 0-100
    notes: str = ""

    def __post_init__(self):
        if self.value < 0: self.value = 0.0
        if not self.expected_close:
            self.expected_close = datetime.now() + timedelta(days=30)
