"""
Scale Infrastructure - Connection Pool.
========================================

HTTP connection pool for external services.
"""

import threading
from typing import Dict


class ConnectionPool:
    """HTTP connection pool for external services."""

    def __init__(self, max_connections: int = 100):
        self.max_connections = max_connections
        self.active_connections = 0
        self._lock = threading.Lock()

    def acquire(self) -> bool:
        """Acquire a connection from pool."""
        with self._lock:
            if self.active_connections < self.max_connections:
                self.active_connections += 1
                return True
            return False

    def release(self):
        """Release connection back to pool."""
        with self._lock:
            if self.active_connections > 0:
                self.active_connections -= 1

    def get_stats(self) -> Dict[str, int]:
        """Get pool statistics."""
        return {
            "max": self.max_connections,
            "active": self.active_connections,
            "available": self.max_connections - self.active_connections,
        }
