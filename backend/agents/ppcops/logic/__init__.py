"""
Google Ads Agent Facade.
"""
from typing import Dict

from .engine import GoogleAdsEngine
from .models import AdType, GoogleAdsCampaign, KeywordMatch, PPCKeyword


class GoogleAdsAgent(GoogleAdsEngine):
    """Refactored Google Ads Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Google Ads"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_campaigns": len(self.campaigns), "total_keywords": sum(len(c.keywords) for c in self.campaigns.values())}

__all__ = ['GoogleAdsAgent', 'AdType', 'KeywordMatch', 'GoogleAdsCampaign', 'PPCKeyword']
