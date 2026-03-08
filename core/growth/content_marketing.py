"""
🎯 Content Marketing Strategy Generator (Proxy)
========================================

This file is now a proxy for the modularized version in ./marketing/
Please import from core.growth.marketing instead.
"""
import warnings
from core.growth.marketing import ContentMarketingStrategy  # noqa: F401
from core.growth.marketing.models import ContentChannel  # noqa: F401

# Issue a deprecation warning
warnings.warn(
    "core.growth.content_marketing is deprecated. "
    "Use core.growth.marketing package instead.",
    DeprecationWarning,
    stacklevel=2
)
