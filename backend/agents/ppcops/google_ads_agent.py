"""
Google Ads Agent - Search, Display & Video (Proxy)
==============================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.ppcops.logic instead.
"""
import warnings

from .logic import AdType, GoogleAdsAgent, GoogleAdsCampaign, KeywordMatch, PPCKeyword

# Issue a deprecation warning
warnings.warn(
    "backend.agents.ppcops.google_ads_agent is deprecated. "
    "Use backend.agents.ppcops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
