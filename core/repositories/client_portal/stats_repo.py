"""
Stats and Analytics database operations.
"""
import json
import logging
from typing import Any, Dict

from .base import BaseRepository

logger = logging.getLogger(__name__)

class StatsRepo(BaseRepository):
    def save_stats(self, stats: Dict[str, Any]) -> bool:
        """Lưu thống kê."""
        try:
            with open(self.stats_file, "w") as f:
                json.dump(stats, f, indent=2)

            logger.info("Stats saved successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to save stats: {e}")
            return False

    def load_stats(self) -> Dict[str, Any]:
        """Tải thống kê."""
        try:
            if not self.stats_file.exists():
                return {
                    "total_clients": 0,
                    "active_clients": 0,
                    "total_projects": 0,
                    "active_projects": 0,
                    "total_invoiced": 0.0,
                    "total_collected": 0.0,
                }

            with open(self.stats_file, "r") as f:
                stats = json.load(f)

            logger.info("Stats loaded successfully")
            return stats
        except Exception as e:
            logger.error(f"Failed to load stats: {e}")
            return {
                "total_clients": 0,
                "active_clients": 0,
                "total_projects": 0,
                "active_projects": 0,
                "total_invoiced": 0.0,
                "total_collected": 0.0,
            }
