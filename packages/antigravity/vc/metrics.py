"""
VCMetrics - VC-ready metrics dashboard.

Tracks key metrics:
- MRR, ARR, Growth Rate
- CAC, LTV, LTV/CAC Ratio
- Churn, NRR
- Rule of 40

🏯 Binh Pháp: Tướng (General) - Leadership metrics
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class FundingStage(Enum):
    """Startup funding stages."""

    PRE_SEED = "pre_seed"  # $0-500K
    SEED = "seed"  # $500K-2M
    SERIES_A = "series_a"  # $2M-15M
    SERIES_B = "series_b"  # $15M-50M
    SERIES_C = "series_c"  # $50M+


# Target metrics by stage
STAGE_TARGETS = {
    FundingStage.PRE_SEED: {"mrr": 5000, "growth": 20, "ltv_cac": 2},
    FundingStage.SEED: {"mrr": 25000, "growth": 25, "ltv_cac": 3},
    FundingStage.SERIES_A: {"mrr": 100000, "growth": 20, "ltv_cac": 3},
    FundingStage.SERIES_B: {"mrr": 500000, "growth": 15, "ltv_cac": 4},
    FundingStage.SERIES_C: {"mrr": 2000000, "growth": 10, "ltv_cac": 5},
}


@dataclass
class MetricsSnapshot:
    """Monthly metrics snapshot."""

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
    def net_mrr(self) -> float:
        """Net new MRR."""
        return self.new_mrr + self.expansion_mrr - self.churned_mrr


@dataclass
class VCMetrics:
    """
    VC-ready metrics dashboard.

    Example:
        metrics = VCMetrics()
        metrics.mrr = 50000
        metrics.growth_rate = 15
        metrics.cac = 200
        metrics.ltv = 2400

        print(metrics.rule_of_40())       # 15 + X = ?
        print(metrics.ltv_cac_ratio())    # 12x
        print(metrics.readiness_score())  # 72/100
    """

    # Revenue metrics
    mrr: float = 0.0
    arr: float = 0.0
    growth_rate: float = 0.0  # Monthly %

    # Unit economics
    cac: float = 0.0  # Customer Acquisition Cost
    ltv: float = 0.0  # Lifetime Value

    # Churn metrics
    churn_rate: float = 0.0  # Monthly churn %
    nrr: float = 100.0  # Net Revenue Retention %

    # Efficiency metrics
    gross_margin: float = 80.0
    net_margin: float = 0.0
    burn_rate: float = 0.0
    runway_months: int = 0

    # Customers
    total_customers: int = 0
    arpu: float = 0.0  # Average Revenue Per User

    # Stage
    stage: FundingStage = FundingStage.PRE_SEED

    def __post_init__(self):
        if self.mrr > 0:
            self.arr = self.mrr * 12
        if self.total_customers > 0 and self.mrr > 0:
            self.arpu = self.mrr / self.total_customers

    def ltv_cac_ratio(self) -> float:
        """LTV/CAC ratio (should be >3x)."""
        if self.cac <= 0:
            return 0.0
        return self.ltv / self.cac

    def rule_of_40(self) -> float:
        """Rule of 40 score (growth + margin > 40)."""
        return self.growth_rate + self.net_margin

    def magic_number(self) -> float:
        """SaaS Magic Number (>0.75 is good)."""
        if self.cac <= 0:
            return 0.0
        # Simplified: Net New ARR / Sales & Marketing Spend
        net_new_arr = self.arr * (self.growth_rate / 100)
        return net_new_arr / (self.cac * self.total_customers) if self.total_customers > 0 else 0

    def readiness_score(self) -> int:
        """Calculate VC readiness score (0-100)."""
        score = 0
        targets = STAGE_TARGETS.get(self.stage, STAGE_TARGETS[FundingStage.SEED])

        # MRR score (30 points)
        if self.mrr >= targets["mrr"]:
            score += 30
        else:
            score += int(30 * (self.mrr / targets["mrr"]))

        # Growth score (25 points)
        if self.growth_rate >= targets["growth"]:
            score += 25
        else:
            score += int(25 * (self.growth_rate / targets["growth"]))

        # LTV/CAC score (25 points)
        ratio = self.ltv_cac_ratio()
        if ratio >= targets["ltv_cac"]:
            score += 25
        else:
            score += int(25 * (ratio / targets["ltv_cac"]))

        # Rule of 40 (10 points)
        if self.rule_of_40() >= 40:
            score += 10

        # NRR (10 points)
        if self.nrr >= 110:
            score += 10
        elif self.nrr >= 100:
            score += 5

        return min(score, 100)

    def get_stage_recommendation(self) -> FundingStage:
        """Recommend appropriate funding stage based on metrics."""
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
        """Identify gaps to next funding stage."""
        gaps = []
        targets = STAGE_TARGETS.get(self.stage, STAGE_TARGETS[FundingStage.SEED])

        if self.mrr < targets["mrr"]:
            gaps.append(f"MRR: ${self.mrr:,.0f} → ${targets['mrr']:,.0f}")

        if self.growth_rate < targets["growth"]:
            gaps.append(f"Growth: {self.growth_rate:.0f}% → {targets['growth']}%")

        if self.ltv_cac_ratio() < targets["ltv_cac"]:
            gaps.append(f"LTV/CAC: {self.ltv_cac_ratio():.1f}x → {targets['ltv_cac']}x")

        if self.rule_of_40() < 40:
            gaps.append(f"Rule of 40: {self.rule_of_40():.0f} → 40")

        if self.nrr < 110:
            gaps.append(f"NRR: {self.nrr:.0f}% → 110%")

        return gaps

    def to_dashboard(self) -> Dict:
        """Export as dashboard data."""
        return {
            "revenue": {"mrr": self.mrr, "arr": self.arr, "growth_rate": self.growth_rate},
            "unit_economics": {
                "cac": self.cac,
                "ltv": self.ltv,
                "ltv_cac_ratio": self.ltv_cac_ratio(),
                "arpu": self.arpu,
            },
            "churn": {"churn_rate": self.churn_rate, "nrr": self.nrr},
            "efficiency": {
                "gross_margin": self.gross_margin,
                "net_margin": self.net_margin,
                "rule_of_40": self.rule_of_40(),
                "magic_number": self.magic_number(),
            },
            "readiness": {
                "score": self.readiness_score(),
                "current_stage": self.stage.value,
                "recommended_stage": self.get_stage_recommendation().value,
                "gaps": self.get_gaps(),
            },
        }
