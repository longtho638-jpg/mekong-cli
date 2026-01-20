"""
Data models and Enums for Proposal Generation.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List


class ServiceType(Enum):
    """Categorization of offered professional services."""
    SEO = "seo"
    CONTENT = "content"
    PPC = "ppc"
    SOCIAL = "social_media"
    WEB_DEV = "web_development"
    BRANDING = "branding"

class ProjectTier(Enum):
    """Scaling tiers for projects."""
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"
    ENTERPRISE = "enterprise"

class ProposalStatus(Enum):
    """Lifecycle status of a proposal."""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"

@dataclass
class ServicePackage:
    """A standard service offering blueprint."""
    service_type: ServiceType
    name: str
    description: str
    deliverables: List[str]
    base_price: float
    hours_estimate: int

@dataclass
class ProposalItem:
    """A specific line item in a generated proposal."""
    name: str
    price: float
    description: str = ""

@dataclass
class Proposal:
    """A complete proposal document entity."""
    id: str
    client_name: str
    project_name: str
    items: List[ProposalItem] = field(default_factory=list)
    status: ProposalStatus = ProposalStatus.DRAFT
    discount_pct: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))

    @property
    def total_value(self) -> float:
        """Calculate final price after discounts."""
        subtotal = sum(i.price for i in self.items)
        return subtotal * (1 - (self.discount_pct / 100.0))
