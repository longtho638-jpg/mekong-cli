"""
🤖 Refactored AI Wingman - Main Interface (Proxy)
==========================================

This file is now a proxy for the modularized version in ./wingman/
Please import from core.agents.wingman instead.
"""
import warnings

from .wingman import AgencyOwnerProfile, AIWingman, Notification, NotificationType, WingmanMode

# Issue a deprecation warning
warnings.warn(
    "core.agents.ai_wingman is deprecated. "
    "Use core.agents.wingman package instead.",
    DeprecationWarning,
    stacklevel=2
)
