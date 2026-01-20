"""
💎 Client Lifetime Value - LTV Calculator (Proxy)
===========================================
This file is now a proxy for the modularized version in ./ltv/
Please import from core.crm.ltv instead.
"""
import warnings

from .ltv import ClientLifetimeValue, ClientTier

# Issue a deprecation warning
warnings.warn(
    "core.crm.client_ltv is deprecated. "
    "Use core.crm.ltv instead.",
    DeprecationWarning,
    stacklevel=2
)
