"""
📅 Meeting Scheduler - Never Miss a Client Call (Proxy)
================================================
This file is now a proxy for the modularized version in ./scheduling/
Please import from core.ops.scheduling instead.
"""
import warnings

from .scheduling import MeetingStatus, MeetingType, Scheduler

# Issue a deprecation warning
warnings.warn(
    "core.ops.scheduler is deprecated. "
    "Use core.ops.scheduling instead.",
    DeprecationWarning,
    stacklevel=2
)
