"""
🎯 Agency Scorecard - Key Performance Indicators (Proxy)
==================================================
This file is now a proxy for the modularized version in ./scorecard_logic/
Please import from core.hr.scorecard_logic instead.
"""
import warnings

from .scorecard_logic import KPI, AgencyScorecard, Grade, MetricCategory

# Issue a deprecation warning
warnings.warn(
    "core.hr.agency_scorecard is deprecated. "
    "Use core.hr.scorecard_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
