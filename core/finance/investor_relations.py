"""
🤝 Investor Relations - VC Pipeline Management (Proxy)
===============================================

This file is now a proxy for the modularized version in ./investor/
Please import from antigravity.core.finance.investor instead.
"""
import warnings

from .investor import InteractionType, InvestorRelations, InvestorType, PipelineStage

# Issue a deprecation warning
warnings.warn(
    "core.finance.investor_relations is deprecated. "
    "Use core.finance.investor instead.",
    DeprecationWarning,
    stacklevel=2
)
