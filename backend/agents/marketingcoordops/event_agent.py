"""
Event Agent - Event Planning & Management (Proxy)
==============================================
This file is now a proxy for the modularized version in ./event_logic/
Please import from backend.agents.marketingcoordops.event_logic instead.
"""

import warnings

from .event_logic import Attendee, Event, EventAgent, EventStatus, EventType

# Issue a deprecation warning
warnings.warn(
    "backend.agents.marketingcoordops.event_agent is deprecated. "
    "Use backend.agents.marketingcoordops.event_logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
