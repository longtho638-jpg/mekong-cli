"""
Outreach Agent - Media Relations & Pitching (Proxy)
==================================================
This file is now a proxy for the modularized version in ./outreach/
Please import from backend.agents.props.outreach instead.
"""
import warnings

from .outreach import ContactType, MediaContact, OutreachAgent, Pitch, PitchStatus

# Issue a deprecation warning
warnings.warn(
    "backend.agents.props.outreach_agent is deprecated. "
    "Use backend.agents.props.outreach package instead.",
    DeprecationWarning,
    stacklevel=2
)
