"""
🌍 Franchise System (Proxy)
========================
This file is now a proxy for the modularized version in ./logic/
Please import from core.franchise.logic instead.
"""
import warnings

from .logic import FranchiseStatus, FranchiseSystem, FranchiseTier, TerritoryStatus

# Issue a deprecation warning
warnings.warn(
    "core.franchise.franchise is deprecated. "
    "Use core.franchise.logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
