"""
📊 VCMetrics - VC-ready Metrics Dashboard
=========================================

Tracks and evaluates key startup performance indicators (KPIs) to determine
venture capital readiness and strategic growth targets.

Key Metrics:
- 💰 Revenue: MRR, ARR, Growth Rate
- 📈 Efficiency: CAC, LTV, Magic Number
- 🔄 Retention: Churn, NRR
- 🏆 Governance: Rule of 40, Readiness Score

Binh Pháp: 🎖️ Tướng (General) - Commanding the numbers.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List

# Configure logging
logger = logging.getLogger(__name__)


class FundingStage(Enum):
    """Startup funding stages based on standard VC milestones."""

    PRE_SEED = "pre_seed"  # $0-500K Raised | Validation
    SEED = "seed"  # $500K-2M Raised | Product-Market Fit
    SERIES_A = "series_a"  # $2M-15M Raised | Scaling
    SERIES_B = "series_b"  # $15M-50M Raised | Expansion
    SERIES_C = "series_c"  # $50M+ Raised | Maturity/Late Stage


# Industry standard targets for B2B SaaS by stage
STAGE_TARGETS = {
    FundingStage.PRE_SEED: {"mrr": 5000, "growth": 20, "ltv_cac": 2.0},
    FundingStage.SEED: {"mrr": 25000, "growth": 25, "ltv_cac": 3.0},
    FundingStage.SERIES_A: {"mrr": 100000, "growth": 20, "ltv_cac": 3.0},
    FundingStage.SERIES_B: {"mrr": 500000, "growth": 15, "ltv_cac": 4.0},
    FundingStage.SERIES_C: {"mrr": 2000000, "growth": 10, "ltv_cac": 5.0},
}


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


class VCMetrics:
    """
    🎖️ VC Metrics Engine

    Analyzes agency performance against industry benchmarks.
    """

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
        self.mrr = mrr
        self.growth_rate = growth_rate
        self.cac = cac
        self.ltv = ltv
        self.total_customers = total_customers
        self.churn_rate = churn_rate
        self.nrr = nrr
        self.net_margin = net_margin
        self.stage = stage

        # Computed fields
        self.arr = mrr * 12
        self.arpu = mrr / total_customers if total_customers > 0 else 0.0
        self.gross_margin = 80.0  # Default SaaS margin

    def ltv_cac_ratio(self) -> float:
        """
        Calculates LTV to CAC ratio.
        Benchmark: 3.0x+ is healthy, 5.0x+ is world-class.
        """
        if self.cac <= 0:
            return 0.0
        return self.ltv / self.cac

    def rule_of_40(self) -> float:
        """
        Calculates the Rule of 40 score (Growth % + Profit Margin %).
        Benchmark: >40 is the threshold for high-performing SaaS companies.
        """
        return self.growth_rate + self.net_margin

    def magic_number(self) -> float:
        """
        SaaS Magic Number: Measure of sales efficiency.
        Benchmark: >0.75 indicates efficient growth.
        """
        if self.cac <= 0 or self.total_customers <= 0:
            return 0.0

        # Simplified: Net New ARR / Sales & Marketing Spend
        # Estimated Spend = CAC * Total Customers (Approximate)
        net_new_arr = self.arr * (self.growth_rate / 100)
        spend = self.cac * self.total_customers
        return net_new_arr / spend if spend > 0 else 0.0

    def readiness_score(self) -> int:
        """
        Calculates a composite score (0-100) of VC readiness based on
        current stage targets.
        """
        score = 0
        targets = STAGE_TARGETS.get(self.stage, STAGE_TARGETS[FundingStage.SEED])

        # 1. MRR Momentum (30 points)
        mrr_ratio = min(self.mrr / targets["mrr"], 1.0)
        score += int(30 * mrr_ratio)

        # 2. Growth Velocity (25 points)
        growth_ratio = min(self.growth_rate / targets["growth"], 1.0)
        score += int(25 * growth_ratio)

        # 3. Unit Economics (25 points)
        ratio = self.ltv_cac_ratio()
        ratio_perf = min(ratio / targets["ltv_cac"], 1.0)
        score += int(25 * ratio_perf)

        # 4. Efficiency (10 points)
        if self.rule_of_40() >= 40:
            score += 10
        elif self.rule_of_40() >= 20:
            score += 5

        # 5. Retention (10 points)
        if self.nrr >= 115:
            score += 10
        elif self.nrr >= 100:
            score += 5

        return min(score, 100)

    def get_stage_recommendation(self) -> FundingStage:
        """Identifies the most appropriate funding stage based on current MRR."""
        if self.mrr >= 2000000:
            return FundingStage.SERIES_C
        elif self.mrr >= 500000:
            return FundingStage.SERIES_B
        elif self.mrr >= 100000:
            return FundingStage.SERIES_A
        elif self.mrr >= 25000:
            return FundingStage.SEED
        else:
            return FundingStage.PRE_SEED

    def get_gaps(self) -> List[str]:
        """Lists specific metric improvements needed to reach the next milestone."""
        gaps = []
        targets = STAGE_TARGETS.get(self.stage, STAGE_TARGETS[FundingStage.SEED])

        if self.mrr < targets["mrr"]:
            gaps.append(f"Revenue: Needs ${targets['mrr'] - self.mrr:,.0f} more MRR")

        if self.growth_rate < targets["growth"]:
            gaps.append(f"Growth: Increase by {targets['growth'] - self.growth_rate:.1f}% monthly")

        if self.ltv_cac_ratio() < targets["ltv_cac"]:
            gaps.append(
                f"Efficiency: Improve LTV/CAC from {self.ltv_cac_ratio():.1f}x to {targets['ltv_cac']}x"
            )

        return gaps

    def to_dict(self) -> Dict[str, Any]:
        """Exports metrics as a serializable dictionary for dashboards."""
        return {
            "summary": {
                "score": self.readiness_score(),
                "stage": self.stage.value,
                "recommended": self.get_stage_recommendation().value,
            },
            "revenue": {
                "mrr": self.mrr,
                "arr": self.arr,
                "growth": self.growth_rate,
                "arpu": self.arpu,
            },
            "efficiency": {
                "ltv_cac": round(self.ltv_cac_ratio(), 2),
                "rule_of_40": round(self.rule_of_40(), 2),
                "magic_number": round(self.magic_number(), 2),
            },
            "retention": {"churn": self.churn_rate, "nrr": self.nrr},
            "gaps": self.get_gaps(),
        }


def calculate_readiness(mrr: float, growth: float) -> int:
    """Quick static helper for readiness scoring."""
    metrics = VCMetrics(mrr=mrr, growth_rate=growth)
    return metrics.readiness_score()
