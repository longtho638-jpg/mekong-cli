"""
Channel Manager Agent - Multi-Platform Distribution (Proxy)
=======================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.mediaops.logic instead.
"""

import warnings

from .logic import Channel, ChannelManagerAgent, ChannelStatus, ChannelType, Publication

# Issue a deprecation warning
warnings.warn(
    "backend.agents.mediaops.channel_manager_agent is deprecated. "
    "Use backend.agents.mediaops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
