"""
Ticket Manager Agent - Support Ticket Tracking (Proxy)
==================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.serviceops.logic instead.
"""
import warnings

from .logic import Priority, TicketManagerAgent, TicketStatus

# Issue a deprecation warning
warnings.warn(
    "backend.agents.serviceops.ticket_manager is deprecated. "
    "Use backend.agents.serviceops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
