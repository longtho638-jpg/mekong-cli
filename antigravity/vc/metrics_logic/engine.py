"""
VC Metrics analysis engine logic.
"""
from typing import List

from .models import FundingStage

# Industry standard targets for B2B SaaS by stage
STAGE_TARGETS = {
    FundingStage.PRE_SEED: {"mrr": 5000, "growth": 20, "ltv_cac": 2.0},
    FundingStage.SEED: {"mrr": 25000, "growth": 25, "ltv_cac": 3.0},
    FundingStage.SERIES_A: {"mrr": 100000, "growth": 20, "ltv_cac": 3.0},
    FundingStage.SERIES_B: {"mrr": 500000, "growth": 15, "ltv_cac": 4.0},
    FundingStage.SERIES_C: {"mrr": 2000000, "growth": 10, "ltv_cac": 5.0},
}

class MetricsEngine:
    def __init__(self, mrr: float, growth: float, cac: float, ltv: float, margin: float, nrr: float, stage: FundingStage):
        self.mrr = mrr
        self.growth_rate = growth
        self.cac = cac
        self.ltv = ltv
        self.net_margin = margin
        self.nrr = nrr
        self.stage = stage
        self.arr = mrr * 12

    def ltv_cac_ratio(self) -> float:
        if self.cac <= 0: return 0.0
        return self.ltv / self.cac

    def rule_of_40(self) -> float:
        return self.growth_rate + self.net_margin

    def readiness_score(self) -> int:
        score = 0
        targets = STAGE_TARGETS.get(self.stage, STAGE_TARGETS[FundingStage.SEED])
        score += int(30 * min(self.mrr / targets["mrr"], 1.0))
        score += int(25 * min(self.growth_rate / targets["growth"], 1.0))
        ratio = self.ltv_cac_ratio()
        score += int(25 * min(ratio / targets["ltv_cac"], 1.0))
        if self.rule_of_40() >= 40: score += 10
        if self.nrr >= 100: score += 10
        return min(score, 100)

    def get_stage_recommendation(self) -> FundingStage:
        if self.mrr >= 2000000: return FundingStage.SERIES_C
        if self.mrr >= 500000: return FundingStage.SERIES_B
        if self.mrr >= 100000: return FundingStage.SERIES_A
        if self.mrr >= 25000: return FundingStage.SEED
        return FundingStage.PRE_SEED
