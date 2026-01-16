"""
ClientMagnet - Lead generation and conversion engine.

Features:
- Lead generation
- Lead qualification (scoring)
- Conversion tracking
- Follow-up automation

🏯 Binh Pháp: Địa (Earth) - Position/Territory
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict
from enum import Enum


class LeadSource(Enum):
    """Where leads come from."""
    FACEBOOK = "facebook"
    ZALO = "zalo"
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_OUTREACH = "cold_outreach"
    EVENT = "event"
    OTHER = "other"


class LeadStatus(Enum):
    """Lead pipeline status."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


@dataclass
class Lead:
    """A potential client."""
    name: str
    company: str = ""
    email: str = ""
    phone: str = ""
    source: LeadSource = LeadSource.OTHER
    status: LeadStatus = LeadStatus.NEW
    score: int = 50  # 0-100
    budget: float = 0.0
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    def is_hot(self) -> bool:
        """Check if lead is hot (score >= 70)."""
        return self.score >= 70


@dataclass
class Client:
    """A converted client."""
    name: str
    company: str
    email: str
    phone: str = ""
    zalo: str = ""
    total_revenue: float = 0.0
    projects: int = 0
    since: datetime = field(default_factory=datetime.now)


class ClientMagnet:
    """
    Lead generation and conversion engine.
    
    Example:
        magnet = ClientMagnet()
        lead = magnet.add_lead("ABC Corp", source=LeadSource.FACEBOOK)
        magnet.qualify_lead(lead, budget=5000, score=85)
        client = magnet.convert_to_client(lead)
    """

    def __init__(self):
        self.leads: List[Lead] = []
        self.clients: List[Client] = []

    def add_lead(
        self,
        name: str,
        company: str = "",
        email: str = "",
        phone: str = "",
        source: LeadSource = LeadSource.OTHER
    ) -> Lead:
        """Add a new lead."""
        lead = Lead(
            name=name,
            company=company,
            email=email,
            phone=phone,
            source=source
        )
        self.leads.append(lead)
        return lead

    def qualify_lead(
        self,
        lead: Lead,
        budget: float = 0.0,
        score: int = 50
    ) -> Lead:
        """Qualify a lead with budget and score."""
        lead.budget = budget
        lead.score = score
        lead.status = LeadStatus.QUALIFIED
        return lead

    def get_hot_leads(self) -> List[Lead]:
        """Get all hot leads (score >= 70)."""
        return [l for l in self.leads if l.is_hot()]

    def convert_to_client(self, lead: Lead) -> Client:
        """Convert a qualified lead to client."""
        lead.status = LeadStatus.WON

        client = Client(
            name=lead.name,
            company=lead.company,
            email=lead.email,
            phone=lead.phone
        )
        self.clients.append(client)
        return client

    def get_pipeline_value(self) -> float:
        """Calculate total pipeline value."""
        return sum(l.budget for l in self.leads if l.status not in [LeadStatus.WON, LeadStatus.LOST])

    def get_conversion_rate(self) -> float:
        """Calculate conversion rate (won / total closed)."""
        won = len([l for l in self.leads if l.status == LeadStatus.WON])
        lost = len([l for l in self.leads if l.status == LeadStatus.LOST])
        total = won + lost
        return (won / total * 100) if total > 0 else 0.0

    def get_stats(self) -> Dict:
        """Get magnet statistics."""
        return {
            "total_leads": len(self.leads),
            "hot_leads": len(self.get_hot_leads()),
            "total_clients": len(self.clients),
            "pipeline_value": self.get_pipeline_value(),
            "conversion_rate": self.get_conversion_rate()
        }
