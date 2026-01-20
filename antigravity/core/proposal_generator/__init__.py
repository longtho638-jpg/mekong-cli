"""
📄 Proposal Generator Module
===========================

Automates the creation of high-impact strategic proposals based on the
13-Chapter Binh Pháp framework.
"""

from .engine import ProposalGenerator
from .models import Proposal
from .templates import PROPOSAL_TEMPLATE

__all__ = ["ProposalGenerator", "Proposal", "PROPOSAL_TEMPLATE"]
