"""
📋 Smart Proposal Generator (Proxy)
================================
This file is now a proxy for the modularized version in ./proposal_logic/
Please import from core.sales.proposal_logic instead.
"""
import warnings

from .proposal_logic import ProjectTier, ProposalGenerator, ProposalStatus, ServiceType

# Issue a deprecation warning
warnings.warn(
    "core.sales.proposal_generator is deprecated. "
    "Use core.sales.proposal_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
