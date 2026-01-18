"""
PaidSocialOps Agents Package
Social Ads + Campaign Optimizer
"""

from .campaign_optimizer_agent import (
    ABTest,
    CampaignOptimizerAgent,
    OptimizationInsight,
    TestStatus,
    Variant,
)
from .social_ads_agent import AdSet, AdStatus, Campaign, Platform, SocialAdsAgent

__all__ = [
    # Social Ads
    "SocialAdsAgent",
    "Campaign",
    "AdSet",
    "Platform",
    "AdStatus",
    # Campaign Optimizer
    "CampaignOptimizerAgent",
    "ABTest",
    "Variant",
    "OptimizationInsight",
    "TestStatus",
]
