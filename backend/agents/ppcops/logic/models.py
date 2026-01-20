"""
Google Ads Agent Data Models.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List


class AdType(Enum):
    SEARCH = "search"
    DISPLAY = "display"
    VIDEO = "video"

class KeywordMatch(Enum):
    BROAD = "broad"
    PHRASE = "phrase"
    EXACT = "exact"

@dataclass
class PPCKeyword:
    text: str
    match_type: KeywordMatch
    quality_score: int = 0
    cpc: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0

@dataclass
class GoogleAdsCampaign:
    id: str
    name: str
    ad_type: AdType
    budget_daily: float
    status: str = "enabled"
    keywords: List[PPCKeyword] = field(default_factory=list)
    cost: float = 0
    conversion_value: float = 0
