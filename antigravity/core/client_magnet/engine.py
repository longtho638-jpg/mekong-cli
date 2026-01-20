"""
🧲 Client Magnet Engine Logic
=============================

Powers the sales side of the Agency OS. It turns anonymous traffic
into paying clients and tracks the conversion efficiency.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from .models import Client, Lead, LeadSource, LeadStatus

# Configure logging
logger = logging.getLogger(__name__)


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
        return [lead for lead in self.leads if lead.is_priority()]

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
        active_leads = [
            lead for lead in self.leads if lead.status not in [LeadStatus.WON, LeadStatus.LOST]
        ]

        return {
            "financials": {
                "raw_value": sum(lead.budget for lead in active_leads),
                "weighted_value": sum(lead.budget * (lead.score / 100) for lead in active_leads),
            },
            "metrics": {
                "total_active": len(active_leads),
                "conversion_rate": self._calculate_conversion_rate(),
                "avg_lead_score": sum(lead.score for lead in active_leads) / len(active_leads)
                if active_leads
                else 0,
            },
            "stages": {
                stage.value: len([lead for lead in active_leads if lead.status == stage])
                for stage in LeadStatus
                if stage not in [LeadStatus.WON, LeadStatus.LOST]
            },
        }

    def _calculate_conversion_rate(self) -> float:
        """Efficiency metric: WON vs total closed deals."""
        won = len([lead for lead in self.leads if lead.status == LeadStatus.WON])
        lost = len([lead for lead in self.leads if lead.status == LeadStatus.LOST])
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
_client_magnet: Optional[ClientMagnet] = None

def get_client_magnet() -> ClientMagnet:
    """Access the shared client magnet engine."""
    global _client_magnet
    if _client_magnet is None:
        _client_magnet = ClientMagnet()
    return _client_magnet
