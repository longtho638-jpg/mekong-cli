"""
🔍 Competitor Analysis - Know Your Market (Proxy)
==========================================
This file is now a proxy for the modularized version in ./competitor_opt/
Please import from core.strategy.competitor_opt instead.
"""
import warnings

from .competitor_opt import CompetitorAnalysis, CompetitorSize, ThreatLevel

# Issue a deprecation warning
warnings.warn(
    "core.strategy.competitor is deprecated. "
    "Use core.strategy.competitor_opt instead.",
    DeprecationWarning,
    stacklevel=2
)
