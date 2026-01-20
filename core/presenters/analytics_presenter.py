"""
📊 Analytics Presenter - UI/Formatting Layer (Proxy)
============================================
This file is now a proxy for the modularized version in ./analytics/
Please import from core.presenters.analytics instead.
"""
import warnings

from .analytics import AnalyticsPresenter

# Issue a deprecation warning
warnings.warn(
    "core.presenters.analytics_presenter is deprecated. "
    "Use core.presenters.analytics instead.",
    DeprecationWarning,
    stacklevel=2
)
