"""
🛡️ Mutual Defense Protocol - Collective Protection System (Proxy)
=========================================================
This file is now a proxy for the modularized version in ./defense/
Please import from core.finance.defense instead.
"""
import warnings

from .defense import CaseStatus, CaseType, DefenseCase, MutualDefenseProtocol

# Issue a deprecation warning
warnings.warn(
    "core.finance.mutual_defense is deprecated. "
    "Use core.finance.defense instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = ['MutualDefenseProtocol', 'CaseType', 'CaseStatus', 'DefenseCase']
