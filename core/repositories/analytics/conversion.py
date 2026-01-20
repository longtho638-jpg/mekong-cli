"""
Revenue and Conversion analytics operations.
"""
import json
import logging
from datetime import datetime
from typing import List

from .base import BaseAnalyticsRepository

try:
    from ...services.analytics_service import RevenueEntry, RevenueType
except ImportError:
    from services.analytics_service import RevenueEntry, RevenueType

logger = logging.getLogger(__name__)

class ConversionRepo(BaseAnalyticsRepository):
    def save_revenue_entries(self, revenue_entries: List[RevenueEntry]) -> bool:
        """Lưu revenue entries."""
        try:
            data = []
            for entry in revenue_entries:
                data.append(
                    {
                        "id": entry.id,
                        "amount": entry.amount,
                        "type": entry.type.value,
                        "client_id": entry.client_id,
                        "description": entry.description,
                        "date": entry.date.isoformat(),
                        "recurring": entry.recurring,
                    }
                )

            with open(self.revenue_file, "w") as f:
                json.dump(data, f, indent=2)

            # Invalidate cache handled in facade
            logger.info(f"Saved {len(revenue_entries)} revenue entries")
            return True
        except Exception as e:
            logger.error(f"Failed to save revenue entries: {e}")
            return False

    def load_revenue_entries(self) -> List[RevenueEntry]:
        """Tải revenue entries."""
        try:
            if not self.revenue_file.exists():
                return []

            with open(self.revenue_file, "r") as f:
                data = json.load(f)

            revenue_entries = []
            for entry_data in data:
                entry = RevenueEntry(
                    id=entry_data["id"],
                    amount=entry_data["amount"],
                    type=RevenueType(entry_data["type"]),
                    client_id=entry_data.get("client_id"),
                    description=entry_data["description"],
                    date=datetime.fromisoformat(entry_data["date"]),
                    recurring=entry_data.get("recurring", False),
                )
                revenue_entries.append(entry)

            logger.info(f"Loaded {len(revenue_entries)} revenue entries")
            return revenue_entries
        except Exception as e:
            logger.error(f"Failed to load revenue entries: {e}")
            return []

    def add_revenue_entry(self, entry: RevenueEntry) -> bool:
        """Thêm revenue entry mới."""
        try:
            revenue_entries = self.load_revenue_entries()
            revenue_entries.append(entry)
            return self.save_revenue_entries(revenue_entries)
        except Exception as e:
            logger.error(f"Failed to add revenue entry: {e}")
            return False

    def get_revenue_entries_by_date_range(
        self, start_date: datetime, end_date: datetime
    ) -> List[RevenueEntry]:
        """Lấy revenue entries theo khoảng thời gian."""
        revenue_entries = self.load_revenue_entries()
        return [entry for entry in revenue_entries if start_date <= entry.date <= end_date]

    def get_revenue_entries_by_type(self, revenue_type: RevenueType) -> List[RevenueEntry]:
        """Lấy revenue entries theo loại."""
        revenue_entries = self.load_revenue_entries()
        return [entry for entry in revenue_entries if entry.type == revenue_type]

    def get_revenue_entries_by_client(self, client_id: str) -> List[RevenueEntry]:
        """Lấy revenue entries theo client."""
        revenue_entries = self.load_revenue_entries()
        return [entry for entry in revenue_entries if entry.client_id == client_id]
