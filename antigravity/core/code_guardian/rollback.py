"""
Rollback Manager Module.
"""
import hashlib
import logging
import os
import threading
import time
from typing import List, Optional

from .models import RollbackPoint

logger = logging.getLogger(__name__)


class RollbackManager:
    """Handles creating and restoring rollback points."""

    def __init__(self, max_points: int = 10):
        self.max_points = max_points
        self.rollback_points: List[RollbackPoint] = []
        self._lock = threading.Lock()

    def create_point(self, name: str, files: List[str] = None) -> str:
        """Create a rollback checkpoint."""
        files = files or []
        files_snapshot = {}

        for file_path in files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, "rb") as f:
                        files_snapshot[file_path] = hashlib.md5(f.read()).hexdigest()
                except Exception as e:
                    logger.error(f"Failed to snapshot {file_path}: {e}")

        point_id = f"rp_{hashlib.md5(f'{name}:{time.time()}'.encode()).hexdigest()[:8]}"

        rollback_point = RollbackPoint(
            id=point_id,
            name=name,
            timestamp=time.time(),
            state_hash=hashlib.md5(str(files_snapshot).encode()).hexdigest(),
            files_snapshot=files_snapshot,
        )

        with self._lock:
            self.rollback_points.append(rollback_point)

            # Keep only max rollback points
            if len(self.rollback_points) > self.max_points:
                self.rollback_points = self.rollback_points[-self.max_points :]

        logger.info(f"📍 Rollback point created: {name}")
        return point_id

    def rollback_to(self, point_id: str) -> bool:
        """Rollback to a specific point."""
        with self._lock:
            point = next((p for p in self.rollback_points if p.id == point_id), None)

        if not point:
            logger.error(f"Rollback point not found: {point_id}")
            return False

        logger.info(f"🔙 Rolling back to: {point.name}")
        # In real implementation, restore files
        # For now, we simulate success as per original implementation
        return True

    def get_latest_point(self) -> Optional[RollbackPoint]:
        """Get the latest rollback point."""
        with self._lock:
            if not self.rollback_points:
                return None
            return self.rollback_points[-1]

    def get_points_count(self) -> int:
        """Get number of rollback points."""
        with self._lock:
            return len(self.rollback_points)
