"""
VC Readiness models and historical tracking.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class FundingStage(Enum):
    """Startup funding stages based on standard VC milestones."""
    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"

@dataclass
class MetricsSnapshot:
    """Monthly performance snapshot for historical tracking."""
    month: str  # YYYY-MM
    mrr: float = 0.0
    new_mrr: float = 0.0
    churned_mrr: float = 0.0
    expansion_mrr: float = 0.0
    customers: int = 0
    new_customers: int = 0
    churned_customers: int = 0
    cac: float = 0.0
    marketing_spend: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def net_mrr_growth(self) -> float:
        """Net change in MRR for the period."""
        return self.new_mrr + self.expansion_mrr - self.churned_mrr
