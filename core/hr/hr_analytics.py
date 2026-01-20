"""
📊 HR Analytics - People Insights (Proxy)
===================================
This file is now a proxy for the modularized version in ./hr_analytics_logic/
Please import from core.hr.hr_analytics_logic instead.
"""
import warnings

from .hr_analytics_logic import AttritionRisk, Department, HRAnalytics

# Issue a deprecation warning
warnings.warn(
    "core.hr.hr_analytics is deprecated. "
    "Use core.hr.hr_analytics_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
