"""
🚀 Chief Technology Officer (CTO) (Proxy)
===================================
This file is now a proxy for the modularized version in ./cto/
Please import from core.agents.personas.cto instead.
"""
import warnings

from .cto import CTO, InitiativeStatus, TechStack

# Issue a deprecation warning
warnings.warn(
    "core.agents.personas.cto is deprecated. "
    "Use core.agents.personas.cto package instead.",
    DeprecationWarning,
    stacklevel=2
)
