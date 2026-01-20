"""
Competitor Analysis engine logic.
"""
from typing import Dict, List

from .models import Competitor, CompetitorSize, ThreatLevel


class CompetitorEngine:
    def __init__(self, agency_name: str, niche: str, location: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.competitors: List[Competitor] = []

    def analyze_swot(self) -> Dict[str, List[str]]:
        return {"strengths": [f"Specialized in {self.niche}"], "weaknesses": ["Early stage"], "opportunities": [f"Growing {self.niche} demand"], "threats": ["Incumbents"]}
