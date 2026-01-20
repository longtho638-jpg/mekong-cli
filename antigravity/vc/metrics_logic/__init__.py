"""
VC Metrics Facade.
"""
from typing import Any, Dict, List

from .engine import MetricsEngine
from .models import FundingStage, MetricsSnapshot


class VCMetrics(MetricsEngine):
    """🎖️ VC Metrics Engine."""
    def __init__(
        self,
        mrr: float = 0.0,
        growth_rate: float = 0.0,
        cac: float = 0.0,
        ltv: float = 0.0,
        total_customers: int = 0,
        churn_rate: float = 0.0,
        nrr: float = 100.0,
        net_margin: float = 0.0,
        stage: FundingStage = FundingStage.PRE_SEED,
    ):
        super().__init__(mrr, growth_rate, cac, ltv, net_margin, nrr, stage)
        self.total_customers = total_customers
        self.churn_rate = churn_rate

    def to_dict(self) -> Dict[str, Any]:
        return {
            "summary": {"score": self.readiness_score(), "stage": self.stage.value, "recommended": self.get_stage_recommendation().value},
            "revenue": {"mrr": self.mrr, "arr": self.arr, "growth": self.growth_rate},
            "efficiency": {"ltv_cac": round(self.ltv_cac_ratio(), 2), "rule_of_40": round(self.rule_of_40(), 2)},
            "retention": {"churn": self.churn_rate, "nrr": self.nrr},
        }

def calculate_readiness(mrr: float, growth: float) -> int:
    metrics = VCMetrics(mrr=mrr, growth_rate=growth)
    return metrics.readiness_score()

__all__ = ['VCMetrics', 'FundingStage', 'MetricsSnapshot', 'calculate_readiness']
