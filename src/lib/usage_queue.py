"""
Usage Queue — Async Buffer Layer for Usage Metering

Buffers usage events in memory and flushes to PostgreSQL in background.
SQLite fallback for reliability when database is unavailable.
"""

import asyncio
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


from src.config.logging_config import get_logger
from src.lib.usage_meter import UsageMeter


class UsageQueue:
    """Async queue for buffering usage events before PostgreSQL flush."""

    def __init__(
        self,
        max_size: int = 100,
        flush_interval: float = 5.0,
        sqlite_path: Optional[str] = None,
    ) -> None:
        """
        Initialize usage queue.

        Args:
            max_size: Maximum queue size before blocking
            flush_interval: Seconds between automatic flushes
            sqlite_path: Path to SQLite fallback database
        """
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=max_size)
        self._flush_interval = flush_interval
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._logger = get_logger(__name__)

        # SQLite fallback
        if sqlite_path is None:
            sqlite_path = ".mekong/usage_buffer.db"
        self._sqlite_path = Path(sqlite_path)
        self._sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        self._sqlite_conn: Optional[sqlite3.Connection] = None

        # Usage meter for recording
        self._meter = UsageMeter()

    async def start(self) -> None:
        """Start background worker."""
        self._running = True
        self._task = asyncio.create_task(self._process_queue())
        self._logger.info("usage.queue.started")

    async def stop(self) -> None:
        """Stop worker and flush remaining events."""
        self._running = False
        if self._task:
            await self._flush_batch()
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._logger.info("usage.queue.stopped")

    async def enqueue(
        self,
        key_id: str,
        tier: str,
        command: str,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Add usage event to queue.

        Args:
            key_id: License key ID
            tier: License tier
            command: Command that was executed
            metadata: Additional context (timestamp, exit_code, etc.)
        """
        event = {
            "key_id": key_id,
            "tier": tier,
            "command": command,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self._queue.put(event)
        self._logger.debug(
            "usage.queue.enqueued",
            key_id=key_id,
            queue_size=self._queue.qsize(),
        )

    async def _process_queue(self) -> None:
        """Background worker: flush queue periodically."""
        while self._running:
            try:
                # Wait for events or timeout
                try:
                    await asyncio.wait_for(
                        self._queue.join(),
                        timeout=self._flush_interval,
                    )
                except asyncio.TimeoutError:
                    pass

                # Flush batch
                await self._flush_batch()

            except Exception as e:
                self._logger.error(
                    "usage.queue.error",
                    error=str(e),
                )

    async def _flush_batch(self) -> None:
        """Flush all queued events to PostgreSQL."""
        batch = []
        while not self._queue.empty():
            try:
                event = self._queue.get_nowait()
                batch.append(event)
            except asyncio.QueueEmpty:
                break

        if not batch:
            return

        self._logger.info(
            "usage.queue.flushed",
            batch_size=len(batch),
        )

        # Record each event
        for event in batch:
            try:
                # Parse timestamp for validation
                timestamp = datetime.fromisoformat(event["timestamp"])
                allowed, error = await self._meter.record_usage(
                    key_id=event["key_id"],
                    tier=event["tier"],
                    commands_count=1,
                    event_timestamp=timestamp,
                )
                if allowed:
                    self._logger.info(
                        "usage.recorded",
                        key_id=event["key_id"],
                        tier=event["tier"],
                    )
                else:
                    self._logger.warning(
                        "usage.rejected",
                        key_id=event["key_id"],
                        reason=error,
                    )
            except Exception as e:
                # Fallback to SQLite
                self._store_sqlite_fallback(event)
                self._logger.warning(
                    "usage.postgresql_failed",
                    key_id=event["key_id"],
                    fallback="sqlite",
                    error=str(e),
                )

    def _store_sqlite_fallback(self, event: dict[str, Any]) -> None:
        """Store event to SQLite if PostgreSQL unavailable."""
        if self._sqlite_conn is None:
            self._sqlite_conn = sqlite3.connect(self._sqlite_path)
            self._init_sqlite()

        query = """
            INSERT INTO usage_buffer (key_id, tier, command, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """
        self._sqlite_conn.execute(
            query,
            (
                event["key_id"],
                event["tier"],
                event["command"],
                str(event["metadata"]),
                event["timestamp"],
            ),
        )
        self._sqlite_conn.commit()

    def _init_sqlite(self) -> None:
        """Initialize SQLite schema."""
        self._sqlite_conn.execute("""
            CREATE TABLE IF NOT EXISTS usage_buffer (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id TEXT NOT NULL,
                tier TEXT NOT NULL,
                command TEXT NOT NULL,
                metadata TEXT,
                timestamp TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self._sqlite_conn.commit()


# Global instance
_queue: Optional[UsageQueue] = None


def get_queue() -> UsageQueue:
    """Get global queue instance."""
    global _queue
    if _queue is None:
        _queue = UsageQueue()
    return _queue


async def init_queue() -> UsageQueue:
    """Initialize and start queue."""
    q = get_queue()
    await q.start()
    return q


__all__ = ["UsageQueue", "get_queue", "init_queue"]
