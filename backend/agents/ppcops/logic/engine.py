"""
Google Ads Agent engine logic.
"""
import random
from typing import Dict, List

from .models import AdType, GoogleAdsCampaign, KeywordMatch, PPCKeyword


class GoogleAdsEngine:
    def __init__(self):
        self.campaigns: Dict[str, GoogleAdsCampaign] = {}

    def create_campaign(self, name: str, ad_type: AdType, budget: float) -> GoogleAdsCampaign:
        cid = f"gads_{random.randint(100, 999)}"
        campaign = GoogleAdsCampaign(id=cid, name=name, ad_type=ad_type, budget_daily=budget)
        self.campaigns[cid] = campaign
        return campaign

    def add_keyword(self, campaign_id: str, text: str, match_type: KeywordMatch) -> GoogleAdsCampaign:
        if campaign_id not in self.campaigns: raise ValueError("Campaign not found")
        kw = PPCKeyword(text=text, match_type=match_type, quality_score=random.randint(5, 10), cpc=random.uniform(0.5, 5.0))
        self.campaigns[campaign_id].keywords.append(kw)
        return self.campaigns[campaign_id]
