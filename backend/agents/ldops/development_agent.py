"""
Development Agent - Skills & Career Development (Proxy)
===================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.ldops.logic instead.
"""
import warnings

from .logic import CareerTrack, DevelopmentAgent, SkillLevel

# Issue a deprecation warning
warnings.warn(
    "backend.agents.ldops.development_agent is deprecated. "
    "Use backend.agents.ldops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
