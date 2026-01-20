"""
Influencer Campaign Engine logic.
"""
import random
from datetime import date, datetime
from typing import Dict, List, Optional

from .models import CampaignStatus, ContentType, Deliverable, InfluencerCampaign


class InfluencerEngine:
    def __init__(self):
        self.campaigns: Dict[str, InfluencerCampaign] = {}

    def create_campaign(self, name: str, objective: str, budget: float, start_date: date = None, end_date: date = None) -> InfluencerCampaign:
        cid = f"icamp_{random.randint(100, 999)}"
        campaign = InfluencerCampaign(id=cid, name=name, objective=objective, budget=budget, start_date=start_date, end_date=end_date)
        self.campaigns[cid] = campaign
        return campaign

    def add_influencer(self, campaign_id: str, influencer_id: str) -> InfluencerCampaign:
        if campaign_id not in self.campaigns: raise ValueError("Campaign not found")
        self.campaigns[campaign_id].influencer_ids.append(influencer_id)
        return self.campaigns[campaign_id]

    def add_deliverable(self, campaign_id: str, influencer_id: str, content_type: ContentType) -> InfluencerCampaign:
        if campaign_id not in self.campaigns: raise ValueError("Campaign not found")
        deliverable = Deliverable(id=f"del_{random.randint(1000, 9999)}", influencer_id=influencer_id, content_type=content_type)
        self.campaigns[campaign_id].deliverables.append(deliverable)
        return self.campaigns[campaign_id]
