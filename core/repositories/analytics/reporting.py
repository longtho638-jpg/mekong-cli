"""
Reporting and data summary operations.
"""
import logging
from typing import Any, Dict

from .conversion import ConversionRepo
from .user_behavior import UserBehaviorRepo

logger = logging.getLogger(__name__)

class ReportingRepo(ConversionRepo, UserBehaviorRepo):
    def get_data_summary(self) -> Dict[str, Any]:
        """Lấy summary của data."""
        revenue_entries = self.load_revenue_entries()
        client_metrics = self.load_client_metrics()

        return {
            "revenue_entries_count": len(revenue_entries),
            "client_metrics_count": len(client_metrics),
            "total_revenue": sum(e.amount for e in revenue_entries),
            "date_range": {
                "earliest": min(e.date for e in revenue_entries).isoformat()
                if revenue_entries
                else None,
                "latest": max(e.date for e in revenue_entries).isoformat()
                if revenue_entries
                else None,
            },
        }
