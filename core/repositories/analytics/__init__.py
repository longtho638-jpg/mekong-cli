"""
Analytics Repository Facade.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from .cache import AnalyticsCache
from .conversion import ConversionRepo
from .reporting import ReportingRepo
from .traffic import TrafficRepo
from .user_behavior import UserBehaviorRepo

try:
    from ...services.analytics_service import ClientMetrics, RevenueEntry, RevenueType
except ImportError:
    from services.analytics_service import ClientMetrics, RevenueEntry, RevenueType

class AnalyticsRepository(ReportingRepo, TrafficRepo):
    """
    Facade for Analytics Repository.
    Combines all modular repositories into a single interface.
    """
    def __init__(self, storage_path: str = "data/analytics", enable_cache: bool = True):
        super().__init__(storage_path)
        self.cache = AnalyticsCache() if enable_cache else None

    # Cache Proxy Methods
    def get_cached_result(self, method: str, **kwargs) -> Optional[Dict[str, Any]]:
        if not self.cache:
            return None
        return self.cache.get(method, **kwargs)

    def cache_result(self, method: str, data: Dict[str, Any], **kwargs) -> None:
        if self.cache:
            self.cache.set(method, data, **kwargs)

    def invalidate_cache(self) -> None:
        if self.cache:
            self.cache.invalidate_all()

    def get_cache_info(self) -> Dict[str, Any]:
        if self.cache:
            return self.cache.get_cache_stats()
        return {"cache_enabled": False}

    # Override save methods to invalidate cache
    def save_revenue_entries(self, revenue_entries: List[RevenueEntry]) -> bool:
        success = super().save_revenue_entries(revenue_entries)
        if success and self.cache:
            self.cache.invalidate_all()
        return success

    def save_client_metrics(self, client_metrics: Dict[str, ClientMetrics]) -> bool:
        success = super().save_client_metrics(client_metrics)
        if success and self.cache:
            self.cache.invalidate_all()
        return success

    def generate_demo_data(self) -> bool:
        """Tạo demo data cho testing."""
        try:
            import random
            from datetime import timedelta

            now = datetime.now()
            revenue_entries = []

            types_weights = [
                (RevenueType.SERVICE, 0.4),
                (RevenueType.RETAINER, 0.3),
                (RevenueType.AFFILIATE, 0.15),
                (RevenueType.TEMPLATE, 0.1),
                (RevenueType.REFERRAL, 0.05),
            ]

            for months_ago in range(12):
                date = now - timedelta(days=months_ago * 30)
                base_revenue = 5000 + (12 - months_ago) * 500

                for _ in range(random.randint(5, 15)):
                    rev_type_data = random.choices(
                        types_weights, weights=[w for _, w in types_weights]
                    )[0]
                    rev_type = rev_type_data[0]

                    amount = random.uniform(100, base_revenue / 3)

                    entry = RevenueEntry(
                        id=f"REV-{len(revenue_entries):04d}",
                        amount=amount,
                        type=rev_type,
                        client_id=f"CLI-{random.randint(1, 10):04d}"
                        if rev_type in [RevenueType.SERVICE, RevenueType.RETAINER]
                        else None,
                        description=f"{rev_type.value.title()} revenue",
                        date=date,
                        recurring=rev_type == RevenueType.RETAINER,
                    )
                    revenue_entries.append(entry)

            self.save_revenue_entries(revenue_entries)

            clients = [
                ("CLI-0001", "Acme Corp", 15000, 3),
                ("CLI-0002", "TechStart Inc", 8500, 2),
                ("CLI-0003", "GrowthLab", 22000, 5),
                ("CLI-0004", "LocalBiz", 4500, 1),
                ("CLI-0005", "ScaleUp Co", 12000, 2),
            ]

            client_metrics = {}
            for client_id, name, revenue, projects in clients:
                client_metrics[client_id] = ClientMetrics(
                    client_id=client_id,
                    client_name=name,
                    total_revenue=float(revenue),
                    projects_count=projects,
                    avg_project_value=revenue / max(1, projects),
                    lifetime_value=float(revenue * 2.5),
                    months_active=random.randint(3, 24),
                    health_score=random.uniform(70, 100),
                )

            self.save_client_metrics(client_metrics)
            return True
        except Exception as e:
            print(f"Failed to generate demo data: {e}")
            return False

    def get_data_summary(self) -> Dict[str, Any]:
        summary = super().get_data_summary()
        summary["cache_info"] = self.get_cache_info()
        return summary
