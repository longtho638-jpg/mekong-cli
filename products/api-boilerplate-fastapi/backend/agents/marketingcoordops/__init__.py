"""
MarketingCoordOps Agents Package
Campaign + Event
"""

from .campaign_agent import CampaignAgent, Campaign, Channel, CampaignStatus, ChannelType
from .event_agent import EventAgent, Event, Attendee, EventType, EventStatus

__all__ = [
    # Campaign
    "CampaignAgent", "Campaign", "Channel", "CampaignStatus", "ChannelType",
    # Event
    "EventAgent", "Event", "Attendee", "EventType", "EventStatus",
]
