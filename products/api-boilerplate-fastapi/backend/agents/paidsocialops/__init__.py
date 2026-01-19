"""
PaidSocialOps Agents Package
Social Ads + Campaign Optimizer
"""

from .social_ads_agent import SocialAdsAgent, Campaign, AdSet, Platform, AdStatus
from .campaign_optimizer_agent import CampaignOptimizerAgent, ABTest, Variant, OptimizationInsight, TestStatus

__all__ = [
    # Social Ads
    "SocialAdsAgent", "Campaign", "AdSet", "Platform", "AdStatus",
    # Campaign Optimizer
    "CampaignOptimizerAgent", "ABTest", "Variant", "OptimizationInsight", "TestStatus",
]
