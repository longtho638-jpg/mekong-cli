"""
📄 Proposal Analytics Logic
"""
from typing import Any, Dict, List, TypedDict

from .models import Proposal


class ProposalStatsDict(TypedDict):
    """Metrics for generated proposals"""
    volume: int
    pipeline_value_usd: float


class ProposalAnalytics:
    """Handles analysis of proposal metrics."""

    def get_stats(self, proposals: List[Proposal]) -> ProposalStatsDict:
        """Insight into proposal volume and conversion values."""
        return {
            "volume": len(proposals),
            "pipeline_value_usd": sum(p.quote.one_time_total for p in proposals),
        }
