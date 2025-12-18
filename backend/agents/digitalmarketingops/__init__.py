"""
DigitalMarketingOps Agents Package
Campaign Manager + Analytics
"""

from .campaign_manager_agent import CampaignManagerAgent, MarketingCampaign, Channel, CampaignStatus
from .analytics_agent import AnalyticsAgent, ChannelMetrics, MetricType

__all__ = [
    # Campaign Manager
    "CampaignManagerAgent", "MarketingCampaign", "Channel", "CampaignStatus",
    # Analytics
    "AnalyticsAgent", "ChannelMetrics", "MetricType",
]
