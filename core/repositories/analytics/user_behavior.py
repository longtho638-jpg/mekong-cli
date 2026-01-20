"""
User behavior and client metrics analytics operations.
"""
import json
import logging
from typing import Dict

from .base import BaseAnalyticsRepository

try:
    from ...services.analytics_service import ClientMetrics
except ImportError:
    from services.analytics_service import ClientMetrics

logger = logging.getLogger(__name__)

class UserBehaviorRepo(BaseAnalyticsRepository):
    def save_client_metrics(self, client_metrics: Dict[str, ClientMetrics]) -> bool:
        """Lưu client metrics."""
        try:
            data = {}
            for client_id, metrics in client_metrics.items():
                data[client_id] = {
                    "client_id": metrics.client_id,
                    "client_name": metrics.client_name,
                    "total_revenue": metrics.total_revenue,
                    "projects_count": metrics.projects_count,
                    "avg_project_value": metrics.avg_project_value,
                    "lifetime_value": metrics.lifetime_value,
                    "months_active": metrics.months_active,
                    "health_score": metrics.health_score,
                }

            with open(self.clients_file, "w") as f:
                json.dump(data, f, indent=2)

            logger.info(f"Saved {len(client_metrics)} client metrics")
            return True
        except Exception as e:
            logger.error(f"Failed to save client metrics: {e}")
            return False

    def load_client_metrics(self) -> Dict[str, ClientMetrics]:
        """Tải client metrics."""
        try:
            if not self.clients_file.exists():
                return {}

            with open(self.clients_file, "r") as f:
                data = json.load(f)

            client_metrics = {}
            for client_id, metrics_data in data.items():
                metrics = ClientMetrics(
                    client_id=metrics_data["client_id"],
                    client_name=metrics_data["client_name"],
                    total_revenue=metrics_data["total_revenue"],
                    projects_count=metrics_data["projects_count"],
                    avg_project_value=metrics_data["avg_project_value"],
                    lifetime_value=metrics_data["lifetime_value"],
                    months_active=metrics_data["months_active"],
                    health_score=metrics_data["health_score"],
                )
                client_metrics[client_id] = metrics

            logger.info(f"Loaded {len(client_metrics)} client metrics")
            return client_metrics
        except Exception as e:
            logger.error(f"Failed to load client metrics: {e}")
            return {}

    def update_client_metrics(self, client_id: str, metrics: ClientMetrics) -> bool:
        """Cập nhật metrics cho một client."""
        try:
            client_metrics = self.load_client_metrics()
            client_metrics[client_id] = metrics
            return self.save_client_metrics(client_metrics)
        except Exception as e:
            logger.error(f"Failed to update client metrics: {e}")
            return False
