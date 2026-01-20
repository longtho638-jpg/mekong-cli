"""
📊 Capacity Dashboard - Agency Capacity Overview (Proxy)
==================================================
This file is now a proxy for the modularized version in ./capacity/
Please import from core.analytics.capacity instead.
"""
import warnings

from .capacity import CapacityDashboard, CapacityLevel

# Issue a deprecation warning
warnings.warn(
    "core.analytics.capacity_dashboard is deprecated. "
    "Use core.analytics.capacity instead.",
    DeprecationWarning,
    stacklevel=2
)
