"""
🧲 ClientMagnet - Lead Generation & CRM Engine
==============================================

The primary lead acquisition and conversion system for Agency OS.
Manages the end-to-end sales lifecycle from initial contact to
client onboarding and lifetime value tracking.

Features:
- Multi-channel ingestion (Zalo, FB, Web).
- Heuristic scoring for lead qualification.
- Pipeline value estimation.
- Conversion analytics.

Binh Pháp: 🧲 Địa (Terrain) - Understanding and capturing the market space.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)


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


class ClientMagnet:
    """
    🧲 Client Magnet Engine

    Powers the sales side of the Agency OS. It turns anonymous traffic
    into paying clients and tracks the conversion efficiency.
    """

    def __init__(self):
        self.leads: List[Lead] = []
        self.clients: List[Client] = []
        self.conversion_goal = 20.0  # Target 20% conversion

    def add_lead(
        self,
        name: str,
        company: str = "",
        email: str = "",
        phone: str = "",
        source: Union[LeadSource, str] = LeadSource.OTHER,
    ) -> Lead:
        """Registers a new prospect in the pipeline."""
        if isinstance(source, str):
            try:
                source = LeadSource(source.lower())
            except ValueError:
                source = LeadSource.OTHER

        lead = Lead(name=name, company=company, email=email, phone=phone, source=source)
        self.leads.append(lead)
        logger.info(f"New lead captured: {name} from {source.value}")
        return lead

    def qualify_lead(self, lead: Lead, budget: float = 0.0, score: Optional[int] = None) -> Lead:
        """Evaluates a lead's potential and sets strategic priority."""
        lead.budget = budget

        # Simple auto-scoring if not provided
        if score is None:
            score = 50
            if budget > 2000:
                score += 20
            if lead.email and lead.phone:
                score += 10
            if lead.source == LeadSource.REFERRAL:
                score += 15

        lead.score = min(score, 100)
        lead.status = LeadStatus.QUALIFIED
        return lead

    def get_priority_leads(self) -> List[Lead]:
        """Filters the pipeline for high-value/high-intent prospects."""
        return [l for l in self.leads if l.is_priority()]

    def convert_to_client(self, lead: Lead) -> Client:
        """Promotes a lead to a Client entity after a successful close (WON)."""
        lead.status = LeadStatus.WON

        client = Client(
            id=f"cli_{int(datetime.now().timestamp())}",
            name=lead.name,
            company=lead.company,
            email=lead.email,
            phone=lead.phone,
            total_ltv=lead.budget,
        )
        self.clients.append(client)
        logger.info(f"🎊 DEAL WON: Converted {lead.name} to Client")
        return client

    def get_pipeline_summary(self) -> Dict[str, Any]:
        """Calculates current financial health of the sales pipeline."""
        # Pipeline excludes final states (WON/LOST)
        active_leads = [l for l in self.leads if l.status not in [LeadStatus.WON, LeadStatus.LOST]]

        return {
            "financials": {
                "raw_value": sum(l.budget for l in active_leads),
                "weighted_value": sum(l.budget * (l.score / 100) for l in active_leads),
            },
            "metrics": {
                "total_active": len(active_leads),
                "conversion_rate": self._calculate_conversion_rate(),
                "avg_lead_score": sum(l.score for l in active_leads) / len(active_leads)
                if active_leads
                else 0,
            },
            "stages": {
                stage.value: len([l for l in active_leads if l.status == stage])
                for stage in LeadStatus
                if stage not in [LeadStatus.WON, LeadStatus.LOST]
            },
        }

    def _calculate_conversion_rate(self) -> float:
        """Efficiency metric: WON vs total closed deals."""
        won = len([l for l in self.leads if l.status == LeadStatus.WON])
        lost = len([l for l in self.leads if l.status == LeadStatus.LOST])
        total_closed = won + lost
        return (won / total_closed * 100) if total_closed > 0 else 0.0

    def get_stats(self) -> Dict[str, Any]:
        """Aggregated engine performance for master dashboard."""
        summary = self.get_pipeline_summary()
        return {
            "total_leads": len(self.leads),
            "total_clients": len(self.clients),
            "pipeline_value": summary["financials"]["raw_value"],
            "weighted_pipeline": summary["financials"]["weighted_value"],
            "conversion_rate": summary["metrics"]["conversion_rate"],
        }


# Global Interface
client_magnet = ClientMagnet()
