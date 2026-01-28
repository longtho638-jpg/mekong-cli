"""
Reporting Agent - Reports & Insights (Proxy)
=========================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.marketinganalystops.logic instead.
"""
import warnings

from .logic import Insight, Report, ReportingAgent, ReportStatus, ReportType

# Issue a deprecation warning
warnings.warn(
    "backend.agents.marketinganalystops.reporting_agent is deprecated. "
    "Use backend.agents.marketinganalystops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
