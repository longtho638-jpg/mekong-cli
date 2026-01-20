"""
📄 Proposal Generator Engine
===========================

Automates the creation of high-impact strategic proposals based on the
13-Chapter Binh Pháp framework.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from antigravity.core.base import BaseEngine
from antigravity.core.money_maker import MoneyMaker, Quote, ServiceTier
from .analytics import ProposalAnalytics
from .builder import ProposalBuilder
from .models import Proposal
from .persistence import ProposalPersistence

# Configure logging
logger = logging.getLogger(__name__)


class ProposalGenerator(BaseEngine):
    """
    🏢 Proposal Generation Engine

    Transforms financial quotes into high-conversion strategic documents.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.proposals: List[Proposal] = []

        # Sub-components
        self.builder = ProposalBuilder()
        self.persistence = ProposalPersistence()
        self.analytics = ProposalAnalytics()

    def set_agency_context(self, name: str, phone: str, email: str):
        """Overrides default agency contact info."""
        self.builder.set_agency_context(name, phone, email)

    def generate_proposal(
        self, quote: Quote, client_contact: str, template_override: Optional[str] = None
    ) -> Proposal:
        """Hydrates the proposal template with quote data."""
        proposal = self.builder.generate_proposal(quote, client_contact, template_override)
        self.proposals.append(proposal)
        return proposal

    def quick_launch(
        self,
        client_name: str,
        contact: str,
        chapter_ids: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
    ) -> Proposal:
        """One-call quote and proposal generation."""
        mm = MoneyMaker()
        quote = mm.generate_quote(client_name, chapter_ids, tier)
        return self.generate_proposal(quote, contact)

    def save_to_file(self, proposal: Proposal, output_dir: str = "proposals") -> Path:
        """Exports the proposal to a Markdown file."""
        return self.persistence.save_to_file(proposal, output_dir)

    def _collect_stats(self) -> Dict[str, Any]:
        """Insight into proposal volume and conversion values."""
        return self.analytics.get_stats(self.proposals)
