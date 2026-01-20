"""
Common base logic for Client Portal repositories.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class BaseRepository:
    """Base class for repositories with shared storage logic."""
    def __init__(self, storage_path: str = "data/client_portal"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # File paths
        self.clients_file = self.storage_path / "clients.json"
        self.projects_file = self.storage_path / "projects.json"
        self.invoices_file = self.storage_path / "invoices.json"
        self.messages_file = self.storage_path / "messages.json"
        self.stats_file = self.storage_path / "stats.json"
