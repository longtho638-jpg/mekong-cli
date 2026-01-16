"""
Proposal Module - Service Logic
"""
import uuid
import logging
from typing import Dict, List
from .entities import Proposal, ServicePackage, ServiceTier

logger = logging.getLogger(__name__)

class ProposalGenerator:
    """
    Proposal Generation System.
    
    Automates the creation of high-conversion client proposals using Agency DNA and niche-specific templates.
    """

    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        self.packages = self._init_packages()
        logger.info(f"Proposal Generator initialized for {agency_name} ({niche})")

    def _init_packages(self) -> Dict[ServiceTier, ServicePackage]:
        """Blueprint for standard service tiers based on agency niche."""
        return {
            ServiceTier.STARTER: ServicePackage(
                f"{self.niche} Starter", f"Ideal for {self.niche} entry", ["Consult", "Audit"], 500.0
            ),
            ServiceTier.GROWTH: ServicePackage(
                f"{self.niche} Growth", f"Scale your {self.niche} results", ["Ads", "Strategy"], 1500.0, 500.0
            )
        }

    def create_proposal(
        self,
        client_name: str,
        client_company: str,
        client_email: str,
        tiers: List[ServiceTier]
    ) -> Proposal:
        """Execute proposal generation logic."""
        if not client_name or not client_email:
            raise ValueError("Client name and email are mandatory")

        services = [self.packages[t] for t in tiers if t in self.packages]

        prop = Proposal(
            id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name, client_company=client_company, client_email=client_email,
            agency_name=self.agency_name, niche=self.niche,
            services=services
        )
        logger.info(f"Proposal generated: {prop.id} for {client_company}")
        return prop

    def generate_proposal(self, *args, **kwargs):
        """Alias for create_proposal for backward compatibility."""
        return self.create_proposal(*args, **kwargs)

    def format_dashboard(self, prop: Proposal) -> str:
        """Delegate formatting to Presenter (backward compat helper)."""
        from .presentation import ProposalPresenter
        return ProposalPresenter.format_dashboard(self, prop)

    def format_proposal(self, prop: Proposal) -> str:
         """Delegate formatting to Presenter (alias for format_dashboard)."""
         from .presentation import ProposalPresenter
         return ProposalPresenter.format_dashboard(self, prop)
