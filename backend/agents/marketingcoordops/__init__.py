"""
MarketingCoordOps Agents Package
Campaign + Event
"""

from .campaign_agent import Campaign, CampaignAgent, CampaignStatus, Channel, ChannelType
from .event_agent import Attendee, Event, EventAgent, EventStatus, EventType

__all__ = [
    # Campaign
    "CampaignAgent",
    "Campaign",
    "Channel",
    "CampaignStatus",
    "ChannelType",
    # Event
    "EventAgent",
    "Event",
    "Attendee",
    "EventType",
    "EventStatus",
]
