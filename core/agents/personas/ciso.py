"""
🔐 Chief Information Security Officer (CISO) (Proxy)
==============================================
This file is now a proxy for the modularized version in ./ciso/
Please import from core.agents.personas.ciso instead.
"""
import warnings

from .ciso import CISO, IncidentStatus, RiskLevel, SecurityDomain

# Issue a deprecation warning
warnings.warn(
    "core.agents.personas.ciso is deprecated. "
    "Use core.agents.personas.ciso package instead.",
    DeprecationWarning,
    stacklevel=2
)
