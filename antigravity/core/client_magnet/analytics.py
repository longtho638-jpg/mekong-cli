"""
Sales pipeline analytics.
"""
from typing import Any, Dict, List

from typing_extensions import TypedDict

from .models import Lead, LeadStatus


class PipelineFinancials(TypedDict):
    raw_value: float
    weighted_value: float


class PipelineMetrics(TypedDict):
    total_active: int
    conversion_rate: float
    avg_lead_score: float


class PipelineAnalysis(TypedDict):
    financials: PipelineFinancials
    metrics: PipelineMetrics
    stages: Dict[str, int]


class PipelineAnalytics:
    """Calculator for pipeline health and metrics."""

    def analyze(self, leads: List[Lead]) -> PipelineAnalysis:
        """Calculates current financial health of the sales pipeline."""
        # Pipeline excludes final states (WON/LOST)
        active_leads = [
            lead for lead in leads if lead.status not in [LeadStatus.WON, LeadStatus.LOST]
        ]

        return {
            "financials": {
                "raw_value": sum(lead.budget for lead in active_leads),
                "weighted_value": sum(lead.budget * (lead.score / 100) for lead in active_leads),
            },
            "metrics": {
                "total_active": len(active_leads),
                "conversion_rate": self.calculate_conversion_rate(leads),
                "avg_lead_score": sum(lead.score for lead in active_leads) / len(active_leads)
                if active_leads
                else 0,
            },
            "stages": {
                stage.value: len([lead for lead in active_leads if lead.status == stage])
                for stage in LeadStatus
                if stage not in [LeadStatus.WON, LeadStatus.LOST]
            },
        }

    def calculate_conversion_rate(self, leads: List[Lead]) -> float:
        """Efficiency metric: WON vs total closed deals."""
        won = len([lead for lead in leads if lead.status == LeadStatus.WON])
        lost = len([lead for lead in leads if lead.status == LeadStatus.LOST])
        total_closed = won + lost
        return (won / total_closed * 100) if total_closed > 0 else 0.0
