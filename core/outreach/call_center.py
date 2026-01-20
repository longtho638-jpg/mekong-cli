"""
📞 Call Center Agent - Phone Support (Proxy)
======================================

This file is now a proxy for the modularized version in ./voice/
Please import from core.outreach.voice instead.
"""
import warnings

from .voice import CallCenterAgent, CallOutcome, CallType

# Issue a deprecation warning
warnings.warn(
    "core.outreach.call_center is deprecated. "
    "Use core.outreach.voice instead.",
    DeprecationWarning,
    stacklevel=2
)
