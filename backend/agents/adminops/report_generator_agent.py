"""
Report Generator Agent (Proxy).
=============================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.adminops.logic instead.
"""
import warnings

from .logic import ReportFormat, ReportGeneratorAgent, ReportType

# Issue a deprecation warning
warnings.warn(
    "backend.agents.adminops.report_generator_agent is deprecated. "
    "Use backend.agents.adminops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
