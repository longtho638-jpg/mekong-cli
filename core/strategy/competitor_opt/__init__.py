"""
Competitor Analysis Facade.
"""
from .engine import CompetitorEngine
from .models import Competitor, CompetitorSize, ThreatLevel


class CompetitorAnalysis(CompetitorEngine):
    """Refactored Competitor Analysis System."""
    def __init__(self, agency_name: str, niche: str, location: str):
        super().__init__(agency_name, niche, location)

    def format_analysis(self) -> str:
        return f"🔍 Competitor Analysis for {self.niche} in {self.location}"

__all__ = ['CompetitorAnalysis', 'Competitor', 'CompetitorSize', 'ThreatLevel']
