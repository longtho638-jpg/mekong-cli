"""
Common base logic for Analytics repositories.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class BaseAnalyticsRepository:
    """Base class for analytics repositories."""
    def __init__(self, storage_path: str = "data/analytics"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # File paths
        self.revenue_file = self.storage_path / "revenue.json"
        self.clients_file = self.storage_path / "clients.json"
