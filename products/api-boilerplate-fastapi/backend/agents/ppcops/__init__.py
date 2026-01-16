"""
PPCOps Agents Package
Google Ads + Bid Manager
"""

from .google_ads_agent import GoogleAdsAgent, GoogleAdsCampaign, PPCKeyword, AdType, KeywordMatch
from .bid_manager_agent import BidManagerAgent, BidStrategy, AuctionInsight, BidStrategyType, OptimizationStatus

__all__ = [
    # Google Ads
    "GoogleAdsAgent", "GoogleAdsCampaign", "PPCKeyword", "AdType", "KeywordMatch",
    # Bid Manager
    "BidManagerAgent", "BidStrategy", "AuctionInsight", "BidStrategyType", "OptimizationStatus",
]
