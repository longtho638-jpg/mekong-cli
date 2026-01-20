"""
📊 Analytics Repository - Data Access Layer (Proxy)
==========================================

This file is now a proxy for the modularized version in ./analytics/
Please import from antigravity.core.repositories.analytics instead.
"""
import warnings

from .analytics import AnalyticsCache, AnalyticsRepository

# Issue a deprecation warning
warnings.warn(
    "core.repositories.analytics_repository is deprecated. "
    "Use core.repositories.analytics instead.",
    DeprecationWarning,
    stacklevel=2
)
