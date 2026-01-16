"""
Proposal Module - Data Entities
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List
from datetime import datetime, timedelta

class ProposalStatus(Enum):
    """Lifecycle status of a client proposal."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ServiceTier(Enum):
    """Pricing tiers for service packages."""
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"


@dataclass
class ServicePackage:
    """A defined service offering entity."""
    name: str
    description: str
    deliverables: List[str]
    monthly_price: float
    setup_fee: float = 0.0

    def __post_init__(self):
        if self.monthly_price < 0 or self.setup_fee < 0:
            raise ValueError("Pricing cannot be negative")


@dataclass
class Proposal:
    """A complete proposal document entity."""
    id: str
    client_name: str
    client_company: str
    client_email: str
    agency_name: str
    niche: str
    services: List[ServicePackage]
    status: ProposalStatus = ProposalStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    notes: str = ""
    
    @property
    def total_monthly(self) -> float:
        return sum(s.monthly_price for s in self.services)
    
    @property
    def total_setup(self) -> float:
        return sum(s.setup_fee for s in self.services)
