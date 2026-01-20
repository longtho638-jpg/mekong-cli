"""
Proposal Generator engine logic.
"""
import logging
import uuid
from typing import Dict, List

from .models import ProjectTier, Proposal, ProposalItem, ProposalStatus, ServicePackage, ServiceType

logger = logging.getLogger(__name__)

class ProposalEngine:
    # Tier multipliers
    TIER_FACTORS = {
        ProjectTier.STARTER: 0.75,
        ProjectTier.GROWTH: 1.0,
        ProjectTier.SCALE: 1.5,
        ProjectTier.ENTERPRISE: 2.5,
    }

    def __init__(self):
        self.catalog = self._load_catalog()
        self.active_proposals: Dict[str, Proposal] = {}

    def _load_catalog(self) -> Dict[ServiceType, ServicePackage]:
        """Blueprint for standard agency offerings."""
        return {
            ServiceType.SEO: ServicePackage(
                ServiceType.SEO, "SEO Growth", "Rank higher on Google", ["Audit", "Backlinks"], 1500.0, 20
            ),
            ServiceType.WEB_DEV: ServicePackage(
                ServiceType.WEB_DEV, "Web Build", "Custom high-speed site", ["Design", "Dev", "Launch"], 3500.0, 40
            ),
        }

    def create_proposal(
        self, client: str, project: str, services: List[ServiceType], tier: ProjectTier = ProjectTier.GROWTH
    ) -> Proposal:
        """Initialize a new professional proposal project."""
        multiplier = self.TIER_FACTORS.get(tier, 1.0)
        items = []

        for stype in services:
            if stype in self.catalog:
                pkg = self.catalog[stype]
                items.append(
                    ProposalItem(name=pkg.name, price=pkg.base_price * multiplier, description=pkg.description)
                )

        proposal = Proposal(
            id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client, project_name=project, items=items,
        )
        self.active_proposals[proposal.id] = proposal
        return proposal
