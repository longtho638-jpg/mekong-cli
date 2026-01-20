"""
🎯 Content Marketing Strategy Generator (Proxy)
========================================

This file is now a proxy for the modularized version in ./marketing/
Please import from core.growth.marketing instead.
"""
import warnings

from .marketing import (
    ChannelStrategy,
    ContentCalendar,
    ContentChannel,
    ContentMarketingStrategy,
    ContentPillar,
    ContentStrategy,
    ContentType,
)

# Issue a deprecation warning
warnings.warn(
    "core.growth.content_marketing is deprecated. "
    "Use core.growth.marketing package instead.",
    DeprecationWarning,
    stacklevel=2
)
