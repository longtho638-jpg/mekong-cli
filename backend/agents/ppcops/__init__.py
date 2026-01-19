"""
PPCOps Agents Package
Google Ads + Bid Manager
"""

from .bid_manager_agent import (
    AuctionInsight,
    BidManagerAgent,
    BidStrategy,
    BidStrategyType,
    OptimizationStatus,
)
from .google_ads_agent import AdType, GoogleAdsAgent, GoogleAdsCampaign, KeywordMatch, PPCKeyword

__all__ = [
    # Google Ads
    "GoogleAdsAgent",
    "GoogleAdsCampaign",
    "PPCKeyword",
    "AdType",
    "KeywordMatch",
    # Bid Manager
    "BidManagerAgent",
    "BidStrategy",
    "AuctionInsight",
    "BidStrategyType",
    "OptimizationStatus",
]
