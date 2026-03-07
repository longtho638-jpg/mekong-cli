"""
PostgreSQL Database Layer — ROIaaS Phase 3

Database connection, pooling, and async operations for license data.
"""

import os
import logging
from typing import Optional, Any, Dict, List
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False


class DatabaseConnection:
    """PostgreSQL connection manager with connection pooling."""

    def __init__(self, connection_string: Optional[str] = None) -> None:
        """
        Initialize database connection.

        Args:
            connection_string: PostgreSQL connection string.
                              Falls back to DATABASE_URL env var.
        """
        self._connection_string = connection_string or os.getenv("DATABASE_URL")
        self._pool: Optional[Any] = None
        self._initialized = False

        if not self._connection_string:
            logger.warning("DATABASE_URL not set. Using SQLite fallback.")

    async def connect(self, min_size: int = 2, max_size: int = 10) -> None:
        """
        Create connection pool.

        Args:
            min_size: Minimum connections in pool
            max_size: Maximum connections in pool
        """
        if not ASYNCPG_AVAILABLE:
            raise ImportError("asyncpg not installed. Run: pip install asyncpg")

        if self._initialized:
            return

        if not self._connection_string:
            return

        self._pool = await asyncpg.create_pool(
            self._connection_string,
            min_size=min_size,
            max_size=max_size,
            command_timeout=60,
        )
        self._initialized = True
        logger.info("PostgreSQL connected (pool: %d-%d connections)", min_size, max_size)

    async def disconnect(self) -> None:
        """Close connection pool."""
        if self._pool:
            await self._pool.close()
            self._initialized = False
            logger.info("PostgreSQL disconnected")

    @asynccontextmanager
    async def acquire(self):
        """Acquire connection from pool."""
        if not self._pool:
            raise RuntimeError("Database not connected. Call connect() first.")

        async with self._pool.acquire() as connection:
            yield connection

    async def fetch_all(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """Execute query and return all results."""
        async with self.acquire() as conn:
            if params:
                rows = await conn.fetch(query, *params)
            else:
                rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    async def fetch_one(self, query: str, params: Optional[tuple] = None) -> Optional[Dict]:
        """Execute query and return single result."""
        async with self.acquire() as conn:
            if params:
                row = await conn.fetchrow(query, *params)
            else:
                row = await conn.fetchrow(query)
            return dict(row) if row else None

    async def execute(self, query: str, params: Optional[tuple] = None) -> str:
        """Execute command and return status."""
        async with self.acquire() as conn:
            if params:
                return await conn.execute(query, *params)
            return await conn.execute(query)

    async def fetchval(self, query: str, params: Optional[tuple] = None, column: int = 0):
        """Execute query and return single value."""
        async with self.acquire() as conn:
            if params:
                return await conn.fetchval(query, *params, column=column)
            return await conn.fetchval(query, column=column)


# Global instance
_db: Optional[DatabaseConnection] = None


def get_database() -> DatabaseConnection:
    """Get global database instance."""
    global _db
    if _db is None:
        _db = DatabaseConnection()
    return _db


async def init_database() -> DatabaseConnection:
    """Initialize database connection."""
    db = get_database()
    await db.connect()
    return db


async def close_database() -> None:
    """Close database connection."""
    db = get_database()
    await db.disconnect()


__all__ = [
    "DatabaseConnection",
    "get_database",
    "init_database",
    "close_database",
]
