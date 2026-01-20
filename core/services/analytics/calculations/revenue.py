"""
Revenue calculation logic for Analytics.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List

from ..models import MetricPeriod, RevenueEntry


def calculate_period_revenue(
    revenue_entries: List[RevenueEntry], period: MetricPeriod
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

def calculate_mrr(revenue_entries: List[RevenueEntry]) -> Dict[str, Any]:
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
