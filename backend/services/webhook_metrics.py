"""
Webhook Metrics Service.
Tracks health metrics, success rates, and operational patterns.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from core.infrastructure.database import get_db


class WebhookMetricsService:
    def __init__(self):
        self.db = get_db()

    def get_health_stats(self, webhook_config_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculate health statistics for the last 24 hours.
        """
        since = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        query = self.db.table("webhook_delivery_attempts")\
            .select("status, duration_ms, created_at")\
            .gte("created_at", since)

        if webhook_config_id:
            query = query.eq("webhook_config_id", webhook_config_id)

        res = query.execute()
        attempts = res.data or []

        if not attempts:
            return {
                "success_rate": 0,
                "avg_latency": 0,
                "total_events": 0,
                "hourly_volume": []
            }

        total = len(attempts)
        success_count = sum(1 for a in attempts if a["status"] == "success")
        latencies = [a["duration_ms"] for a in attempts if a["duration_ms"] is not None]

        success_rate = (success_count / total) * 100 if total > 0 else 0
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        return {
            "success_rate": round(success_rate, 2),
            "avg_latency": int(avg_latency),
            "total_events": total,
            "period": "24h"
        }
