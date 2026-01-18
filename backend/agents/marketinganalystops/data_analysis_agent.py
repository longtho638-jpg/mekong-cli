"""
Data Analysis Agent - Metrics & Trends
Manages marketing data analysis, trends, and anomaly detection.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class MetricCategory(Enum):
    ACQUISITION = "acquisition"
    ENGAGEMENT = "engagement"
    CONVERSION = "conversion"
    REVENUE = "revenue"
    RETENTION = "retention"


class TrendDirection(Enum):
    UP = "up"
    DOWN = "down"
    FLAT = "flat"


@dataclass
class Metric:
    """Marketing metric"""

    name: str
    category: MetricCategory
    current_value: float
    previous_value: float
    unit: str = ""

    @property
    def change_percent(self) -> float:
        if self.previous_value == 0:
            return 0
        return ((self.current_value - self.previous_value) / self.previous_value) * 100

    @property
    def trend(self) -> TrendDirection:
        if self.change_percent > 5:
            return TrendDirection.UP
        elif self.change_percent < -5:
            return TrendDirection.DOWN
        return TrendDirection.FLAT


@dataclass
class Anomaly:
    """Detected anomaly in metrics"""

    metric_name: str
    expected_value: float
    actual_value: float
    deviation_percent: float
    severity: str  # low, medium, high
    detected_at: datetime = field(default_factory=datetime.now)


class DataAnalysisAgent:
    """
    Data Analysis Agent - Phân tích Dữ liệu Marketing

    Responsibilities:
    - Metrics aggregation
    - Trend analysis
    - Anomaly detection
    - Attribution modeling
    """

    def __init__(self):
        self.name = "Data Analysis"
        self.status = "ready"
        self.metrics: Dict[str, Metric] = {}
        self.anomalies: List[Anomaly] = []

    def aggregate_metrics(self) -> Dict[str, Metric]:
        """Aggregate key marketing metrics"""
        metrics_config = [
            ("Sessions", MetricCategory.ACQUISITION, 50000, 45000, ""),
            ("Users", MetricCategory.ACQUISITION, 35000, 32000, ""),
            ("Bounce Rate", MetricCategory.ENGAGEMENT, 42.5, 45.0, "%"),
            ("Pages/Session", MetricCategory.ENGAGEMENT, 3.2, 2.9, ""),
            ("Conversion Rate", MetricCategory.CONVERSION, 3.5, 3.2, "%"),
            ("Leads", MetricCategory.CONVERSION, 1750, 1440, ""),
            ("Revenue", MetricCategory.REVENUE, 125000, 98000, "$"),
            ("ROAS", MetricCategory.REVENUE, 4.2, 3.8, "x"),
            ("Retention Rate", MetricCategory.RETENTION, 68, 65, "%"),
            ("Churn Rate", MetricCategory.RETENTION, 4.2, 4.8, "%"),
        ]

        for name, category, current, previous, unit in metrics_config:
            # Add some randomness
            current = current * random.uniform(0.9, 1.1)
            previous = previous * random.uniform(0.9, 1.1)

            self.metrics[name] = Metric(
                name=name,
                category=category,
                current_value=current,
                previous_value=previous,
                unit=unit,
            )

        return self.metrics

    def detect_anomalies(self, threshold: float = 20) -> List[Anomaly]:
        """Detect anomalies in metrics"""
        self.anomalies = []

        for metric in self.metrics.values():
            deviation = abs(metric.change_percent)
            if deviation > threshold:
                severity = "high" if deviation > 50 else "medium" if deviation > 30 else "low"

                anomaly = Anomaly(
                    metric_name=metric.name,
                    expected_value=metric.previous_value,
                    actual_value=metric.current_value,
                    deviation_percent=deviation,
                    severity=severity,
                )
                self.anomalies.append(anomaly)

        return self.anomalies

    def get_category_summary(self, category: MetricCategory) -> Dict:
        """Get summary for a metric category"""
        cat_metrics = [m for m in self.metrics.values() if m.category == category]

        return {
            "category": category.value,
            "metrics_count": len(cat_metrics),
            "positive_trends": len([m for m in cat_metrics if m.trend == TrendDirection.UP]),
            "negative_trends": len([m for m in cat_metrics if m.trend == TrendDirection.DOWN]),
        }

    def get_stats(self) -> Dict:
        """Get analysis statistics"""
        metrics = list(self.metrics.values())

        return {
            "total_metrics": len(metrics),
            "anomalies": len(self.anomalies),
            "positive_trends": len([m for m in metrics if m.trend == TrendDirection.UP]),
            "negative_trends": len([m for m in metrics if m.trend == TrendDirection.DOWN]),
        }


# Demo
if __name__ == "__main__":
    agent = DataAnalysisAgent()

    print("📊 Data Analysis Agent Demo\n")

    # Aggregate metrics
    metrics = agent.aggregate_metrics()
    print(f"📋 Aggregated: {len(metrics)} metrics")

    # Show key metrics
    print("\n📈 Key Metrics:")
    for name in ["Revenue", "Conversion Rate", "ROAS"]:
        m = metrics[name]
        trend_icon = (
            "↑" if m.trend == TrendDirection.UP else "↓" if m.trend == TrendDirection.DOWN else "→"
        )
        print(
            f"   {m.name}: {m.unit}{m.current_value:,.1f} ({trend_icon} {m.change_percent:+.1f}%)"
        )

    # Detect anomalies
    anomalies = agent.detect_anomalies()
    print(f"\n⚠️ Anomalies: {len(anomalies)}")
    for a in anomalies[:2]:
        print(f"   [{a.severity}] {a.metric_name}: {a.deviation_percent:.1f}% deviation")

    # Stats
    stats = agent.get_stats()
    print("\n📊 Summary:")
    print(f"   Positive Trends: {stats['positive_trends']}")
    print(f"   Negative Trends: {stats['negative_trends']}")
