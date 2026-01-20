"""
Outreach Agent - Email Sequences & Engagement (Proxy)
===================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.recruiterops.logic instead.
"""
import warnings

from .logic import OutreachAgent, OutreachStatus, SequenceStep

# Issue a deprecation warning
warnings.warn(
    "backend.agents.recruiterops.outreach_agent is deprecated. "
    "Use backend.agents.recruiterops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
