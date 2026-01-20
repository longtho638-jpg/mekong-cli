"""
Growth trends and revenue breakdown calculations.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List

from ..models import MetricPeriod, RevenueEntry


def calculate_growth_trend(
    revenue_entries: List[RevenueEntry], months: int = 12
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
    revenue_entries: List[RevenueEntry], period: MetricPeriod = MetricPeriod.MONTH
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
