"""
🧲 ClientMagnet Models
======================

Data models and enums for the Client Magnet system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict


class LeadSource(Enum):
    """Acquisition channels for incoming leads."""

    FACEBOOK = "facebook"
    ZALO = "zalo"
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_OUTREACH = "cold_outreach"
    EVENT = "event"
    OTHER = "other"


class LeadStatus(Enum):
    """Pipeline stages for a prospect."""

    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


@dataclass
class Lead:
    """Represents a potential client opportunity."""

    name: str
    company: str = ""
    email: str = ""
    phone: str = ""
    source: LeadSource = LeadSource.OTHER
    status: LeadStatus = LeadStatus.NEW
    score: int = 50  # 0-100 threshold
    budget: float = 0.0
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_priority(self) -> bool:
        """Determines if the lead requires immediate high-touch intervention."""
        return self.score >= 75 or self.budget >= 5000.0


@dataclass
class Client:
    """A successfully converted business partner."""

    id: str
    name: str
    company: str
    email: str
    phone: str = ""
    zalo: str = ""
    total_ltv: float = 0.0
    active_projects: int = 0
    joined_at: datetime = field(default_factory=datetime.now)
