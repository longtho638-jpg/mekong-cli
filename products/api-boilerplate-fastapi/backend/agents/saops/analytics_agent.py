"""
Analytics Agent - KPI Calculations & Metrics
Tracks and calculates sales KPIs and metrics.
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum


class MetricType(Enum):
    REVENUE = "revenue"
    CONVERSION = "conversion"
    ACTIVITY = "activity"
    PIPELINE = "pipeline"


@dataclass
class KPI:
    """Key Performance Indicator"""
    name: str
    value: float
    target: float
    unit: str = ""
    period: str = "MTD"

    @property
    def attainment(self) -> float:
        return (self.value / self.target * 100) if self.target > 0 else 0

    @property
    def status(self) -> str:
        if self.attainment >= 100:
            return "on_target"
        elif self.attainment >= 80:
            return "at_risk"
        else:
            return "behind"


@dataclass
class FunnelStage:
    """Conversion funnel stage"""
    name: str
    count: int
    value: float


class AnalyticsAgent:
    """
    Analytics Agent - Phân tích KPIs
    
    Responsibilities:
    - Calculate KPIs
    - Aggregate metrics
    - Build conversion funnels
    - Period comparisons
    """

    def __init__(self):
        self.name = "Analytics"
        self.status = "ready"
        self.kpis: Dict[str, KPI] = {}
        self.funnel: List[FunnelStage] = []

    def set_kpi(
        self,
        name: str,
        value: float,
        target: float,
        unit: str = "",
        period: str = "MTD"
    ) -> KPI:
        """Set or update a KPI"""
        kpi = KPI(
            name=name,
            value=value,
            target=target,
            unit=unit,
            period=period
        )
        self.kpis[name] = kpi
        return kpi

    def build_funnel(self, stages: List[Dict]) -> List[FunnelStage]:
        """Build conversion funnel"""
        self.funnel = [
            FunnelStage(
                name=stage["name"],
                count=stage["count"],
                value=stage.get("value", 0)
            )
            for stage in stages
        ]
        return self.funnel

    def get_conversion_rates(self) -> Dict[str, float]:
        """Calculate stage-to-stage conversion rates"""
        rates = {}
        for i in range(len(self.funnel) - 1):
            current = self.funnel[i]
            next_stage = self.funnel[i + 1]
            rate = (next_stage.count / current.count * 100) if current.count > 0 else 0
            rates[f"{current.name} → {next_stage.name}"] = round(rate, 1)
        return rates

    def compare_periods(self, current: float, previous: float) -> Dict:
        """Compare two periods"""
        if previous == 0:
            change = 100 if current > 0 else 0
        else:
            change = ((current - previous) / previous) * 100

        return {
            "current": current,
            "previous": previous,
            "change": round(change, 1),
            "direction": "up" if change > 0 else "down" if change < 0 else "flat"
        }

    def get_kpi_summary(self) -> Dict:
        """Get KPI summary"""
        kpis = list(self.kpis.values())

        on_target = len([k for k in kpis if k.status == "on_target"])
        at_risk = len([k for k in kpis if k.status == "at_risk"])
        behind = len([k for k in kpis if k.status == "behind"])

        return {
            "total_kpis": len(kpis),
            "on_target": on_target,
            "at_risk": at_risk,
            "behind": behind,
            "avg_attainment": sum(k.attainment for k in kpis) / len(kpis) if kpis else 0
        }


# Demo
if __name__ == "__main__":
    agent = AnalyticsAgent()

    print("📊 Analytics Agent Demo\n")

    # Set KPIs
    agent.set_kpi("Revenue", 125000, 150000, "$")
    agent.set_kpi("Deals Closed", 28, 35, "deals")
    agent.set_kpi("Win Rate", 42, 40, "%")
    agent.set_kpi("Avg Deal Size", 4500, 5000, "$")

    print("📈 KPIs:")
    for kpi in agent.kpis.values():
        print(f"   {kpi.name}: {kpi.value}/{kpi.target} ({kpi.attainment:.0f}%) - {kpi.status}")

    # Build funnel
    agent.build_funnel([
        {"name": "Leads", "count": 500, "value": 250000},
        {"name": "MQLs", "count": 150, "value": 150000},
        {"name": "SQLs", "count": 75, "value": 112500},
        {"name": "Opportunities", "count": 40, "value": 80000},
        {"name": "Closed Won", "count": 15, "value": 45000},
    ])

    print("\n🔻 Funnel Conversions:")
    for stage, rate in agent.get_conversion_rates().items():
        print(f"   {stage}: {rate}%")

    # Summary
    print("\n📊 Summary:")
    summary = agent.get_kpi_summary()
    print(f"   Avg Attainment: {summary['avg_attainment']:.0f}%")
