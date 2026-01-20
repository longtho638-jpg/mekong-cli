"""
Anomaly detection for revenue data.
"""
from typing import Any, Dict, List

from ..models import RevenueEntry


def identify_anomalies(
    revenue_entries: List[RevenueEntry], threshold_multiplier: float = 2.0
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
