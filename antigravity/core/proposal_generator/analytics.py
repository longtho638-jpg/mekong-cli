"""
📄 Proposal Analytics Logic
"""
from typing import Any, Dict, List

from .models import Proposal


class ProposalAnalytics:
    """Handles analysis of proposal metrics."""

    def get_stats(self, proposals: List[Proposal]) -> Dict[str, Any]:
        """Insight into proposal volume and conversion values."""
        return {
            "volume": len(proposals),
            "pipeline_value_usd": sum(p.quote.one_time_total for p in proposals),
        }
