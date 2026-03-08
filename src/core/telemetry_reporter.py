"""
Telemetry Reporter — Usage Metering & Analytics

Tracks CLI usage and reports to RaaS Gateway for billing/analytics.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


@dataclass
class UsageRecord:
    """Single usage record."""

    endpoint: str
    method: str
    status_code: int
    payload_size: int
    timestamp: float
    error: Optional[str] = None
    tenant_id: Optional[str] = None


class TelemetryReporter:
    """
    Telemetry Reporter with local SQLite buffering.

    Batches usage records and flushes to gateway periodically.
    """

    DB_PATH = "~/.mekong/telemetry/usage.db"
    BATCH_SIZE = 10
    FLUSH_INTERVAL = 60  # seconds

    def __init__(self, gateway_url: Optional[str] = None):
        """
        Initialize telemetry reporter.

        Args:
            gateway_url: Optional gateway URL for flushing
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", "https://raas.agencyos.network"
        )
        self.db_path = Path(self.DB_PATH).expanduser()
        self._buffer: list[UsageRecord] = []
        self._last_flush = time.time()
        self._ensure_db()

    def _ensure_db(self) -> None:
        """Ensure telemetry database exists."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint TEXT NOT NULL,
                    method TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    payload_size INTEGER NOT NULL,
                    timestamp REAL NOT NULL,
                    error TEXT,
                    tenant_id TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON usage_records(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tenant ON usage_records(tenant_id)")

            # Migration: Add tenant_id column if not exists (for existing DBs)
            try:
                conn.execute("ALTER TABLE usage_records ADD COLUMN tenant_id TEXT")
            except sqlite3.OperationalError:
                pass  # Column already exists

    def record_call(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        payload_size: int,
        error: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> None:
        """
        Record API call usage.

        Args:
            endpoint: API endpoint path
            method: HTTP method
            status_code: Response status code
            payload_size: Request payload size in bytes
            error: Optional error message
            tenant_id: Optional tenant ID for attribution
        """
        record = UsageRecord(
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            payload_size=payload_size,
            timestamp=time.time(),
            error=error,
            tenant_id=tenant_id,
        )
        self._buffer.append(record)

        # Auto-flush if buffer full
        if len(self._buffer) >= self.BATCH_SIZE:
            self.flush()

    def flush(self) -> None:
        """Flush buffered records to gateway."""
        if not self._buffer:
            return

        # Save to local DB first (guaranteed persistence)
        with sqlite3.connect(self.db_path) as conn:
            conn.executemany(
                """
                INSERT INTO usage_records (endpoint, method, status_code, payload_size, timestamp, error)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (r.endpoint, r.method, r.status_code, r.payload_size, r.timestamp, r.error)
                    for r in self._buffer
                ],
            )
            conn.commit()

        # Try to flush to gateway (best effort)
        self._flush_to_gateway()

        self._buffer.clear()
        self._last_flush = time.time()

    def _flush_to_gateway(self) -> None:
        """Send pending records to gateway (non-blocking)."""
        # Lazy import to avoid circular dependency
        import requests

        try:
            records = self._get_unsent_records()
            if not records:
                return

            # Get auth token
            token = self._get_auth_token()
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}" if token else "",
            }

            # Send batch
            response = requests.post(
                f"{self.gateway_url}/v1/usage/report",
                headers=headers,
                json={"records": records},
                timeout=10,
            )

            if response.status_code == 200:
                self._mark_sent(records)

        except Exception as e:
            import logging
            logging.debug(f"Failed to flush telemetry: {e}")
            pass  # Best effort - records saved locally

    def _get_auth_token(self) -> Optional[str]:
        """Get auth token from credentials."""
        creds_path = Path("~/.mekong/raas/credentials.json").expanduser()
        if creds_path.exists():
            try:
                with open(creds_path) as f:
                    return json.load(f).get("token")
            except (json.JSONDecodeError, OSError) as e:
                import logging
                logging.debug(f"Failed to load credentials: {e}")
        return os.getenv("RAAS_LICENSE_KEY")

    def _get_unsent_records(self) -> list[dict[str, Any]]:
        """Get records not yet sent to gateway."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT * FROM usage_records
                WHERE timestamp > ?
                ORDER BY timestamp ASC
                LIMIT 100
                """,
                (self._last_flush,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def _mark_sent(self, records: list[dict[str, Any]]) -> None:
        """Mark records as sent (cleanup old records)."""
        with sqlite3.connect(self.db_path) as conn:
            # Keep only last 24 hours
            cutoff = time.time() - 86400
            conn.execute("DELETE FROM usage_records WHERE timestamp < ?", (cutoff,))
            conn.commit()

    def get_current_usage(self) -> dict[str, Any]:
        """Get current usage summary."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT
                    COUNT(*) as total_requests,
                    SUM(payload_size) as total_payload,
                    AVG(status_code) as avg_status,
                    MIN(timestamp) as first_request,
                    MAX(timestamp) as last_request
                FROM usage_records
                WHERE timestamp > ?
                """,
                (time.time() - 3600,),  # Last hour
            )
            row = cursor.fetchone()
            return {
                "total_requests": row[0] or 0,
                "total_payload_bytes": row[1] or 0,
                "avg_status_code": row[2] or 0,
                "first_request": datetime.fromtimestamp(row[3], tz=timezone.utc).isoformat()
                if row[3]
                else None,
                "last_request": datetime.fromtimestamp(row[4], tz=timezone.utc).isoformat()
                if row[4]
                else None,
            }

    def get_metrics(self) -> list[dict[str, Any]]:
        """
        Get all telemetry metrics for sync.

        Returns:
            List of metric dictionaries
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT * FROM usage_records
                ORDER BY timestamp ASC
                LIMIT 1000
                """
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_hourly_metrics(self) -> list[dict[str, Any]]:
        """
        Get metrics aggregated by hour bucket.

        Returns:
            List of hourly bucket metrics
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT
                    strftime('%Y-%m-%d-%H', datetime(timestamp, 'unixepoch')) as hour_bucket,
                    COUNT(*) as request_count,
                    SUM(payload_size) as total_payload_size,
                    endpoint,
                    method
                FROM usage_records
                GROUP BY hour_bucket, endpoint, method
                ORDER BY hour_bucket ASC
                """
            )
            return [
                {
                    "hour_bucket": row[0],
                    "request_count": row[1],
                    "payload_size": row[2],
                    "endpoint": row[3],
                    "method": row[4],
                }
                for row in cursor.fetchall()
            ]


# Singleton
_telemetry_reporter: Optional[TelemetryReporter] = None


def get_telemetry_reporter() -> TelemetryReporter:
    """Get or create telemetry reporter singleton."""
    global _telemetry_reporter
    if _telemetry_reporter is None:
        _telemetry_reporter = TelemetryReporter()
    return _telemetry_reporter
