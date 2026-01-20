"""
Community Agent - Distribution & Engagement (Proxy)
==============================================
This file is now a proxy for the modularized version in ./community_logic/
Please import from backend.agents.community_logic instead.
"""
import warnings

from .community_logic import CommunityAgent, Platform, ScheduledPost

# Issue a deprecation warning
warnings.warn(
    "backend.agents.community is deprecated. "
    "Use backend.agents.community_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
