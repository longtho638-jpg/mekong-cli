"""
HR Analytics Agent - Workforce Metrics & Analysis
Analyzes HR data, turnover, and workforce metrics.
"""

import random
from dataclasses import dataclass
from enum import Enum
from typing import Dict


class MetricType(Enum):
    HEADCOUNT = "headcount"
    TURNOVER = "turnover"
    TENURE = "tenure"
    ENGAGEMENT = "engagement"
    DIVERSITY = "diversity"


@dataclass
class HRMetric:
    """HR metric data point"""

    id: str
    metric_type: MetricType
    value: float
    period: str  # e.g., "2024-Q4"
    department: str = "ALL"
    target: float = 0
    trend: float = 0  # percentage change


class HRAnalyticsAgent:
    """
    HR Analytics Agent - Phân tích Nhân sự

    Responsibilities:
    - Track workforce metrics
    - Analyze turnover
    - Monitor tenure
    - Generate KPI reports
    """

    def __init__(self):
        self.name = "HR Analytics"
        self.status = "ready"
        self.metrics: Dict[str, HRMetric] = {}

    def record_metric(
        self,
        metric_type: MetricType,
        value: float,
        period: str,
        department: str = "ALL",
        target: float = 0,
    ) -> HRMetric:
        """Record HR metric"""
        metric_id = f"metric_{metric_type.value}_{period}_{random.randint(100, 999)}"

        # Calculate trend from previous period
        trend = self._calculate_trend(metric_type, value, department)

        metric = HRMetric(
            id=metric_id,
            metric_type=metric_type,
            value=value,
            period=period,
            department=department,
            target=target,
            trend=trend,
        )

        self.metrics[metric_id] = metric
        return metric

    def _calculate_trend(self, metric_type: MetricType, current: float, department: str) -> float:
        """Calculate trend vs previous period"""
        previous = [
            m
            for m in self.metrics.values()
            if m.metric_type == metric_type and m.department == department
        ]
        if previous:
            last = sorted(previous, key=lambda x: x.period)[-1]
            if last.value > 0:
                return ((current - last.value) / last.value) * 100
        return 0

    def get_turnover_rate(self, period: str = None) -> Dict:
        """Get turnover analysis"""
        turnover = [m for m in self.metrics.values() if m.metric_type == MetricType.TURNOVER]
        if period:
            turnover = [m for m in turnover if m.period == period]

        if not turnover:
            return {"rate": 0, "target": 0, "status": "no_data"}

        avg_rate = sum(m.value for m in turnover) / len(turnover)
        avg_target = sum(m.target for m in turnover) / len(turnover)

        return {
            "rate": avg_rate,
            "target": avg_target,
            "status": "on_target" if avg_rate <= avg_target else "above_target",
        }

    def get_headcount_by_department(self) -> Dict[str, float]:
        """Get headcount by department"""
        headcount = [m for m in self.metrics.values() if m.metric_type == MetricType.HEADCOUNT]
        result = {}
        for m in headcount:
            if m.department != "ALL":
                result[m.department] = m.value
        return result

    def get_stats(self) -> Dict:
        """Get analytics statistics"""
        metrics = list(self.metrics.values())

        return {
            "total_metrics": len(metrics),
            "metric_types": len(set(m.metric_type for m in metrics)),
            "departments_tracked": len(set(m.department for m in metrics if m.department != "ALL")),
            "periods_tracked": len(set(m.period for m in metrics)),
        }


# Demo
if __name__ == "__main__":
    agent = HRAnalyticsAgent()

    print("📊 HR Analytics Agent Demo\n")

    # Record metrics
    m1 = agent.record_metric(MetricType.HEADCOUNT, 150, "2024-Q4", "Engineering", target=160)
    m2 = agent.record_metric(MetricType.HEADCOUNT, 50, "2024-Q4", "Product", target=55)
    m3 = agent.record_metric(MetricType.TURNOVER, 8.5, "2024-Q4", "ALL", target=10)
    m4 = agent.record_metric(MetricType.TENURE, 2.5, "2024-Q4", "ALL", target=3)

    print(f"📋 Metric: {m1.metric_type.value}")
    print(f"   Value: {m1.value}")
    print(f"   Target: {m1.target}")
    print(f"   Department: {m1.department}")

    # Turnover
    print("\n📉 Turnover:")
    turnover = agent.get_turnover_rate("2024-Q4")
    print(f"   Rate: {turnover['rate']}%")
    print(f"   Status: {turnover['status']}")

    # Headcount
    print("\n👥 Headcount:")
    for dept, count in agent.get_headcount_by_department().items():
        print(f"   {dept}: {count}")
