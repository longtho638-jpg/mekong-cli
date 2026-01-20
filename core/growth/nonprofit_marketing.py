"""
🙏 Nonprofit Marketing - Cause Marketing (Proxy)
==========================================

This file is now a proxy for the modularized version in ./nonprofit/
Please import from core.growth.nonprofit instead.
"""
import warnings

from .nonprofit import (
    CampaignStatus,
    CampaignType,
    DonationCampaign,
    NonprofitCategory,
    NonprofitClient,
    NonprofitMarketing,
)

# Issue a deprecation warning
warnings.warn(
    "core.growth.nonprofit_marketing is deprecated. "
    "Use core.growth.nonprofit instead.",
    DeprecationWarning,
    stacklevel=2
)
