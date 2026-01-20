"""
📅 Calendar Sync - Sync with External Calendars (Proxy)
=================================================
This file is now a proxy for the modularized version in ./calendar/
Please import from core.ops.calendar instead.
"""
import warnings

from .calendar import CalendarProvider, CalendarSync, SyncStatus

# Issue a deprecation warning
warnings.warn(
    "core.ops.calendar_sync is deprecated. "
    "Use core.ops.calendar instead.",
    DeprecationWarning,
    stacklevel=2
)
