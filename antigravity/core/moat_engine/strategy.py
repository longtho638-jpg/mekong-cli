"""
🏰 Moat Strategy Logic
"""
from typing import Any, Dict

from typing_extensions import TypedDict

from .models import Moat


class SwitchingCostDict(TypedDict):
    """Estimate of the cost to leave the platform"""
    hours: int
    days: float
    financial_usd: int
    verdict: str


class MoatStrategy:
    """
    Encapsulates the logic for calculating moat strength and switching costs.
    """

    def update_strength(self, moats: Dict[str, Moat], moat_id: str) -> None:
        """Recalculates 0-100% strength for a specific moat based on its metrics."""
        moat = moats[moat_id]

        if moat_id == "data":
            total = sum(v for v in moat.metrics.values() if isinstance(v, (int, float)))
            moat.strength = min(100, int(total / 5))  # 500 points = 100%

        elif moat_id == "learning":
            patterns = moat.metrics["patterns"]
            rate = moat.metrics["success_rate"]
            moat.strength = min(
                100, int((patterns / 2) * rate)
            )  # 200 patterns @ 100% success = 100%

        elif moat_id == "workflow":
            wf = moat.metrics["custom_workflows"]
            moat.strength = min(100, wf * 5)  # 20 workflows = 100%

        elif moat_id == "identity":
            moat.strength = 100 if moat.metrics["dna_sync"] else 20

        elif moat_id == "network":
            total = moat.metrics["partners"] + (moat.metrics["referrals"] * 2)
            moat.strength = min(100, total * 10)

    def get_aggregate_strength(self, moats: Dict[str, Moat]) -> int:
        """Calculates the weighted average strength of all 5 moats."""
        return sum(m.strength for m in moats.values()) // 5

    def calculate_switching_cost(self, moats: Dict[str, Moat]) -> SwitchingCostDict:
        """Estimates the time and financial impact of leaving the Agency OS."""

        # Heuristic Time Impact (Hours)
        h_data = moats["data"].metrics.get("projects", 0) * 3
        h_learn = moats["learning"].metrics.get("patterns", 0) * 0.5
        h_work = moats["workflow"].metrics.get("custom_workflows", 0) * 10
        total_hours = h_data + h_learn + h_work

        # Opportunity Cost ($100/hr)
        financial_loss = int(total_hours * 100)

        return {
            "hours": int(total_hours),
            "days": round(total_hours / 8, 1),
            "financial_usd": financial_loss,
            "verdict": self._get_verdict(total_hours),
        }

    def _get_verdict(self, hours: float) -> str:
        """Returns a strategic verdict based on estimated switching pain."""
        if hours > 400:
            return "🚫 RỜI ĐI LÀ KHÔNG THỂ (Moat tối cao)"
        if hours > 100:
            return "⚠️ RỜI ĐI RẤT ĐAU ĐỚN (Moat mạnh)"
        if hours > 20:
            return "😟 RỜI ĐI KHÁ KHÓ KHĂN (Moat trung bình)"
        return "⚡ RỜI ĐI DỄ DÀNG (Cần xây thêm Moat!)"
