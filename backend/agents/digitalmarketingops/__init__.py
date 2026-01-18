"""
DigitalMarketingOps Agents Package
Campaign Manager + Analytics
"""

from .analytics_agent import AnalyticsAgent, ChannelMetrics, MetricType
from .campaign_manager_agent import CampaignManagerAgent, CampaignStatus, Channel, MarketingCampaign

__all__ = [
    # Campaign Manager
    "CampaignManagerAgent",
    "MarketingCampaign",
    "Channel",
    "CampaignStatus",
    # Analytics
    "AnalyticsAgent",
    "ChannelMetrics",
    "MetricType",
]
