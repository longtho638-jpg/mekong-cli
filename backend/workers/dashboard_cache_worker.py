import asyncio
import logging
from datetime import datetime

# from celery import Celery # Assuming Celery might be used, but implementing as standalone func for now
from backend.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)


# Mock Redis for cache
class MockRedis:
    def __init__(self):
        self.store = {}

    def set(self, key, value, ex=None):
        self.store[key] = value
        logger.info(f"Cache set: {key}")

    def get(self, key):
        return self.store.get(key)


redis_client = MockRedis()


async def refresh_dashboard_cache():
    """
    Worker task to pre-compute expensive dashboard metrics.
    Should be scheduled to run periodically (e.g., every 5 mins).
    """
    logger.info("Starting dashboard cache refresh...")
    service = DashboardService()

    # List of expensive metrics to cache
    metrics_to_cache = [
        ("revenue", "30d"),
        ("users", "30d"),
        ("churn_rate", "30d"),
        ("active_users", "today"),
    ]

    for metric, date_range in metrics_to_cache:
        try:
            logger.info(f"Computing {metric} for {date_range}...")
            # Simulate computation
            _ = await service.get_metric_data(metric, date_range)

            # Serialize and store in cache
            cache_key = f"dashboard:cache:{metric}:{date_range}"
            # In real app: redis_client.set(cache_key, data.json(), ex=300)
            redis_client.set(cache_key, "cached_data_blob", ex=300)

        except Exception as e:
            logger.error(f"Failed to compute {metric}: {e}")

    logger.info("Dashboard cache refresh completed.")


if __name__ == "__main__":
    # For testing the worker manually
    logging.basicConfig(level=logging.INFO)
    asyncio.run(refresh_dashboard_cache())
