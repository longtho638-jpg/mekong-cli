"""
📊 Analytics Service - Core Business Logic (Proxy)
===========================================

This file is now a proxy for the modularized version in ./analytics/
Please import from antigravity.core.services.analytics instead.
"""
import warnings

from .analytics import (
    AnalyticsCalculationEngine,
    ClientMetrics,
    MetricPeriod,
    MetricSnapshot,
    RevenueEntry,
    RevenueType,
)

# Issue a deprecation warning
warnings.warn(
    "core.services.analytics_service is deprecated. "
    "Use core.services.analytics instead.",
    DeprecationWarning,
    stacklevel=2
)
