"""
Influencer Campaign Agent Facade.
"""
from typing import Dict

from .engine import InfluencerEngine
from .models import CampaignStatus, ContentType, Deliverable, InfluencerCampaign


class InfluencerCampaignAgent(InfluencerEngine):
    """Refactored Influencer Campaign Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Influencer Campaign"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_campaigns": len(self.campaigns), "active": len([c for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE])}

__all__ = ['InfluencerCampaignAgent', 'CampaignStatus', 'ContentType', 'InfluencerCampaign', 'Deliverable']
