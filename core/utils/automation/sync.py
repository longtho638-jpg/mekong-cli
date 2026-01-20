"""
Integration sync and Data Import logic.
"""
import logging
import uuid
from typing import Dict, List

from .models import DataImport, IntegrationSync

logger = logging.getLogger(__name__)

class SyncManager:
    def __init__(self):
        self.imports: List[DataImport] = []
        self.syncs: Dict[str, IntegrationSync] = {}

    def setup_sync(self, app_a: str, app_b: str, sync_type: str = "two_way") -> IntegrationSync:
        """Define a persistent sync connection between two external apps."""
        sync = IntegrationSync(
            id=f"SNC-{uuid.uuid4().hex[:6].upper()}", app_a=app_a, app_b=app_b, sync_type=sync_type
        )
        self.syncs[sync.id] = sync
        logger.info(f"Sync established: {app_a} {sync_type} {app_b}")
        return sync
