"""
Agency Scorecard engine logic.
"""
import logging
from typing import List, Optional

from .models import KPI, Grade, MetricCategory

logger = logging.getLogger(__name__)

class ScorecardEngine:
    def __init__(self):
        self.kpis: List[KPI] = []

    def add_kpi(self, kpi: KPI) -> None:
        """Add a new KPI to the scorecard."""
        self.kpis.append(kpi)

    def update_kpi(self, name: str, current: float, trend: Optional[float] = None) -> bool:
        """Update an existing KPI's current value and trend."""
        for kpi in self.kpis:
            if kpi.name == name:
                kpi.current = current
                if trend is not None:
                    kpi.trend = trend
                return True
        return False

    def get_achievement(self, kpi: KPI) -> float:
        """Get KPI achievement percentage. Handles zero targets."""
        if kpi.target == 0:
            return 100.0 if kpi.current >= 0 else 0.0
        return kpi.current / kpi.target * 100.0

    def get_grade(self, kpi: KPI) -> Grade:
        achievement = self.get_achievement(kpi)
        if achievement >= 90: return Grade.A
        if achievement >= 75: return Grade.B
        if achievement >= 60: return Grade.C
        return Grade.D

    def get_overall_grade(self) -> Grade:
        if not self.kpis: return Grade.C
        avg_achievement = sum(self.get_achievement(k) for k in self.kpis) / len(self.kpis)
        if avg_achievement >= 90: return Grade.A
        if avg_achievement >= 75: return Grade.B
        if avg_achievement >= 60: return Grade.C
        return Grade.D
