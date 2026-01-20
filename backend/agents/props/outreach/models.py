"""
Outreach Agent Data Models.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class ContactType(Enum):
    JOURNALIST = "journalist"
    BLOGGER = "blogger"
    INFLUENCER = "influencer"
    PARTNER = "partner"

class PitchStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    OPENED = "opened"
    REPLIED = "replied"
    COVERED = "covered"
    DECLINED = "declined"

@dataclass
class MediaContact:
    """Media contact for outreach"""
    id: str
    name: str
    outlet: str
    email: str
    contact_type: ContactType
    beat: str
    notes: str = ""
    last_contacted: Optional[datetime] = None

@dataclass
class Pitch:
    """Outreach pitch"""
    id: str
    contact_id: str
    subject: str
    body: str
    status: PitchStatus = PitchStatus.DRAFT
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None: self.created_at = datetime.now()
