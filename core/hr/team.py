"""
👥 Team Performance - Track Team Productivity (Proxy)
===============================================
This file is now a proxy for the modularized version in ./performance/
Please import from core.hr.performance instead.
"""
import warnings

from .performance import Role, TeamMember, TeamPerformance

# Issue a deprecation warning
warnings.warn(
    "core.hr.team is deprecated. "
    "Use core.hr.performance package instead.",
    DeprecationWarning,
    stacklevel=2
)
