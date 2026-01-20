"""
Client overview and health distribution calculations.
"""
from typing import Any, Dict, List

from ..models import ClientMetrics


def _calculate_health_distribution(metrics: List[ClientMetrics]) -> Dict[str, int]:
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

def calculate_client_overview(client_metrics: Dict[str, ClientMetrics]) -> Dict[str, Any]:
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
        "health_distribution": _calculate_health_distribution(metrics),
    }
