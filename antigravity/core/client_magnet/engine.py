"""
Client Magnet Engine Logic
=============================

Powers the sales side of the Agency OS. It turns anonymous traffic
into paying clients and tracks the conversion efficiency.
"""

import logging
from antigravity.core.base import BaseEngine
from antigravity.core.patterns import singleton_factory
from datetime import datetime
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict, Union

from .analytics import PipelineAnalysis, PipelineAnalytics
from .models import Client, Lead, LeadSource, LeadStatus
from .persistence import ClientMagnetPersistence
from .scoring import LeadScorer

# Configure logging
logger = logging.getLogger(__name__)


class ClientMagnetStats(TypedDict):
    """Aggregated engine performance metrics"""
    total_leads: int
    total_clients: int
    pipeline_value: float
    weighted_pipeline: float
    conversion_rate: float


class LeadDataDict(TypedDict):
    """Data representation of a lead"""
    name: str
    company: str
    email: str
    score: int
    status: str


class LeadsResponse(TypedDict):
    """Response structure for processed leads"""
    all: List[LeadDataDict]


class ClientMagnet(BaseEngine):
    """
    🧲 Client Magnet Engine

    Powers the sales side of the Agency OS. It turns anonymous traffic
    into paying clients and tracks the conversion efficiency.
    """

    def __init__(self, data_dir: str = ".antigravity/client_magnet"):
        super().__init__(data_dir)

        # Sub-components
        self.scorer = LeadScorer()
        self.analytics = PipelineAnalytics()
        self.persistence = ClientMagnetPersistence(self.data_dir)

        # Load state
        self.leads, self.clients = self.persistence.load()
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
        self._save_state()

        logger.info(f"New lead captured: {name} from {source.value}")
        return lead

    def qualify_lead(self, lead: Lead, budget: float = 0.0, score: Optional[int] = None) -> Lead:
        """Evaluates a lead's potential and sets strategic priority."""
        result = self.scorer.qualify(lead, budget, score)
        self._save_state()
        return result

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
        self._save_state()

        logger.info(f"🎊 DEAL WON: Converted {lead.name} to Client")
        return client

    def get_pipeline_summary(self) -> PipelineAnalysis:
        """Calculates current financial health of the sales pipeline."""
        return self.analytics.analyze(self.leads)

    def _calculate_conversion_rate(self) -> float:
        """Efficiency metric: WON vs total closed deals."""
        return self.analytics.calculate_conversion_rate(self.leads)

    def _collect_stats(self) -> Dict[str, object]:
        """Aggregated engine performance for master dashboard."""
        summary = self.get_pipeline_summary()
        return {
            "total_leads": len(self.leads),
            "total_clients": len(self.clients),
            "pipeline_value": summary["financials"]["raw_value"],
            "weighted_pipeline": summary["financials"]["weighted_value"],
            "conversion_rate": summary["metrics"]["conversion_rate"],
        }

    def process_leads(self) -> LeadsResponse:
        """
        Simulates the processing of leads from various sources.
        In a real implementation, this would connect to external APIs.
        """
        # For simulation, ensure we have some leads
        if not self.leads:
            self.add_lead("Tech Corp", "Tech Corp Inc", "contact@techcorp.com", "555-0101", "linkedin")
            self.add_lead("Startup Studio", "Studio X", "founder@studiox.com", "555-0102", "referral")
            self.add_lead("Legacy Biz", "Old Co", "info@oldco.com", "555-0103", "cold_email")

        # Convert to dict representation
        leads_data: List[LeadDataDict] = []
        for lead in self.leads:
            # Calculate score if not present
            if not hasattr(lead, 'score') or lead.score is None:
                self.qualify_lead(lead)

            leads_data.append({
                "name": lead.name,
                "company": lead.company,
                "email": lead.email,
                "score": getattr(lead, 'score', 0),
                "status": lead.status.value if hasattr(lead.status, 'value') else str(lead.status)
            })

        return {"all": leads_data}

    def _save_state(self):
        """Persists current state to disk."""
        self.persistence.save(self.leads, self.clients)


@singleton_factory
def get_client_magnet() -> ClientMagnet:
    """Access the shared client magnet engine."""
    return ClientMagnet()
