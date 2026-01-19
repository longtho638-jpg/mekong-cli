"""
📊 Analytics Service - Core Business Logic
===========================================

Service layer cho analytics với calculation engine tách biệt.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MetricPeriod(Enum):
    """Khoảng thời gian cho metrics."""

    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL_TIME = "all_time"


class RevenueType(Enum):
    """Loại revenue."""

    SERVICE = "service"
    RETAINER = "retainer"
    AFFILIATE = "affiliate"
    TEMPLATE = "template"
    REFERRAL = "referral"
    OTHER = "other"


@dataclass
class RevenueEntry:
    """Revenue entry entity."""

    id: str
    amount: float
    type: RevenueType
    client_id: Optional[str]
    description: str
    date: datetime
    recurring: bool = False


@dataclass
class MetricSnapshot:
    """Metric snapshot tại một thời điểm."""

    timestamp: datetime
    value: float
    change_percent: float = 0.0


@dataclass
class ClientMetrics:
    """Metrics cho một client."""

    client_id: str
    client_name: str
    total_revenue: float
    projects_count: int
    avg_project_value: float
    lifetime_value: float
    months_active: int
    health_score: float  # 0-100


class AnalyticsCalculationEngine:
    """Core calculation engine cho analytics."""

    def __init__(self):
        logger.info("Analytics calculation engine initialized")

    def calculate_period_revenue(
        self, revenue_entries: List[RevenueEntry], period: MetricPeriod
    ) -> Dict[str, Any]:
        """Tính revenue cho một khoảng thời gian."""
        now = datetime.now()

        period_days = {
            MetricPeriod.TODAY: 1,
            MetricPeriod.WEEK: 7,
            MetricPeriod.MONTH: 30,
            MetricPeriod.QUARTER: 90,
            MetricPeriod.YEAR: 365,
            MetricPeriod.ALL_TIME: 9999,
        }

        days = period_days.get(period, 30)
        cutoff = now - timedelta(days=days)
        prev_cutoff = cutoff - timedelta(days=days)

        # Current period
        current = [e for e in revenue_entries if e.date >= cutoff]
        current_total = sum(e.amount for e in current)

        # Previous period
        previous = [e for e in revenue_entries if prev_cutoff <= e.date < cutoff]
        previous_total = sum(e.amount for e in previous)

        # Growth
        growth = ((current_total - previous_total) / max(1, previous_total)) * 100

        # By type
        by_type: Dict[str, float] = {}
        for entry in current:
            t = entry.type.value
            by_type[t] = by_type.get(t, 0.0) + entry.amount

        return {
            "period": period.value,
            "total": current_total,
            "previous": previous_total,
            "growth_percent": growth,
            "by_type": by_type,
            "transaction_count": len(current),
            "current_entries": current,
            "previous_entries": previous,
        }

    def calculate_mrr(self, revenue_entries: List[RevenueEntry]) -> Dict[str, Any]:
        """Tính Monthly Recurring Revenue (MRR)."""
        now = datetime.now()
        month_ago = now - timedelta(days=30)

        recurring = [e for e in revenue_entries if e.recurring and e.date >= month_ago]

        mrr = sum(e.amount for e in recurring)

        # Previous month
        two_months = now - timedelta(days=60)
        prev_recurring = [
            e for e in revenue_entries if e.recurring and two_months <= e.date < month_ago
        ]
        prev_mrr = sum(e.amount for e in prev_recurring)

        growth = ((mrr - prev_mrr) / max(1, prev_mrr)) * 100

        return {
            "mrr": mrr,
            "arr": mrr * 12,
            "previous_mrr": prev_mrr,
            "growth_percent": growth,
            "retainer_count": len(set(e.client_id for e in recurring if e.client_id)),
            "current_recurring": recurring,
            "previous_recurring": prev_recurring,
        }

    def calculate_revenue_forecast(
        self, mrr_data: Dict[str, Any], months: int = 6
    ) -> List[Dict[str, Any]]:
        """Dự báo revenue dựa trên MRR hiện tại và growth."""
        current_mrr = mrr_data["mrr"]
        # Cap growth rate cho realistic forecast
        growth_rate = max(0.0, min(0.2, mrr_data["growth_percent"] / 100))

        forecasts = []
        now = datetime.now()

        for i in range(1, months + 1):
            # Apply growth rate
            projected_mrr = current_mrr * ((1 + growth_rate) ** i)
            one_time_estimate = projected_mrr * 0.3  # Assume 30% của revenue là one-time

            forecasts.append(
                {
                    "month": (now + timedelta(days=30 * i)).strftime("%B %Y"),
                    "projected_mrr": projected_mrr,
                    "projected_one_time": one_time_estimate,
                    "projected_total": projected_mrr + one_time_estimate,
                    "confidence": max(50, 95 - (i * 5)),
                }
            )

        return forecasts

    def calculate_client_overview(self, client_metrics: Dict[str, ClientMetrics]) -> Dict[str, Any]:
        """Tính tổng quan client metrics."""
        metrics = list(client_metrics.values())

        if not metrics:
            return {"total_clients": 0}

        total_revenue = sum(m.total_revenue for m in metrics)
        avg_ltv = total_revenue / len(metrics)  # Simplified
        avg_health = sum(m.health_score for m in metrics) / len(metrics)

        # At-risk clients
        at_risk = [m for m in metrics if m.health_score < 70]

        # Top clients by revenue
        top_clients = sorted(metrics, key=lambda m: m.total_revenue, reverse=True)[:5]

        return {
            "total_clients": len(metrics),
            "total_revenue": total_revenue,
            "avg_lifetime_value": avg_ltv,
            "avg_health_score": avg_health,
            "at_risk_count": len(at_risk),
            "at_risk_clients": at_risk,
            "top_clients": top_clients,
            "health_distribution": self._calculate_health_distribution(metrics),
        }

    def _calculate_health_distribution(self, metrics: List[ClientMetrics]) -> Dict[str, int]:
        """Tính phân bố health score."""
        distribution = {
            "excellent": 0,  # 90-100
            "good": 0,  # 70-89
            "fair": 0,  # 50-69
            "poor": 0,  # 0-49
        }

        for metric in metrics:
            if metric.health_score >= 90:
                distribution["excellent"] += 1
            elif metric.health_score >= 70:
                distribution["good"] += 1
            elif metric.health_score >= 50:
                distribution["fair"] += 1
            else:
                distribution["poor"] += 1

        return distribution

    def calculate_growth_trend(
        self, revenue_entries: List[RevenueEntry], months: int = 12
    ) -> List[Dict[str, Any]]:
        """Tính growth trend theo tháng."""
        now = datetime.now()
        trends = []

        for i in range(months):
            month_start = now - timedelta(days=30 * (i + 1))
            month_end = now - timedelta(days=30 * i)

            month_entries = [e for e in revenue_entries if month_start <= e.date < month_end]

            month_total = sum(e.amount for e in month_entries)

            trends.append(
                {
                    "month": month_start.strftime("%Y-%m"),
                    "revenue": month_total,
                    "transactions": len(month_entries),
                }
            )

        return list(reversed(trends))  # Most recent first

    def calculate_revenue_breakdown(
        self, revenue_entries: List[RevenueEntry], period: MetricPeriod = MetricPeriod.MONTH
    ) -> Dict[str, Any]:
        """Phân tích revenue theo các loại khác nhau."""
        now = datetime.now()

        period_days = {
            MetricPeriod.TODAY: 1,
            MetricPeriod.WEEK: 7,
            MetricPeriod.MONTH: 30,
            MetricPeriod.QUARTER: 90,
            MetricPeriod.YEAR: 365,
            MetricPeriod.ALL_TIME: 9999,
        }

        days = period_days.get(period, 30)
        cutoff = now - timedelta(days=days)

        period_entries = [e for e in revenue_entries if e.date >= cutoff]

        # By type
        by_type: Dict[str, Dict[str, Any]] = {}
        for entry in period_entries:
            type_name = entry.type.value
            if type_name not in by_type:
                by_type[type_name] = {"amount": 0.0, "count": 0, "recurring": 0}

            by_type[type_name]["amount"] += entry.amount
            by_type[type_name]["count"] += 1
            if entry.recurring:
                by_type[type_name]["recurring"] += 1

        # By client
        by_client: Dict[str, Dict[str, Any]] = {}
        for entry in period_entries:
            if entry.client_id:
                if entry.client_id not in by_client:
                    by_client[entry.client_id] = {"amount": 0.0, "count": 0}

                by_client[entry.client_id]["amount"] += entry.amount
                by_client[entry.client_id]["count"] += 1

        return {
            "period": period.value,
            "total": sum(e.amount for e in period_entries),
            "by_type": by_type,
            "by_client": by_client,
            "recurring_ratio": sum(e.amount for e in period_entries if e.recurring)
            / max(1, sum(e.amount for e in period_entries)),
        }

    def identify_anomalies(
        self, revenue_entries: List[RevenueEntry], threshold_multiplier: float = 2.0
    ) -> List[Dict[str, Any]]:
        """Identify anomalies trong revenue data."""
        if len(revenue_entries) < 3:
            return []

        amounts = [e.amount for e in revenue_entries]
        mean_amount = sum(amounts) / len(amounts)

        # Calculate standard deviation
        variance = sum((x - mean_amount) ** 2 for x in amounts) / len(amounts)
        std_dev = variance**0.5

        threshold = mean_amount + (threshold_multiplier * std_dev)

        anomalies = []
        for entry in revenue_entries:
            if entry.amount > threshold:
                anomalies.append(
                    {
                        "entry_id": entry.id,
                        "amount": entry.amount,
                        "date": entry.date,
                        "type": entry.type.value,
                        "z_score": (entry.amount - mean_amount) / std_dev if std_dev > 0 else 0,
                    }
                )

        return anomalies
