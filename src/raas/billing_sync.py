"""
RaaS Billing Sync Service - Usage Records Synchronization

Synchronizes local usage records from SQLite store to RaaS Gateway.
Features:
- Fetch unsynced records from local SQLite
- Build payload matching RaaS Gateway v2/usage schema
- Generate idempotency keys for each sync batch
- POST with retry logic + exponential backoff
- Mark records as synced on success

Usage:
    from src.raas.billing_sync import BillingSyncService

    service = BillingSyncService()
    result = service.sync_to_gateway()
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

from src.config.logging_config import get_logger


@dataclass
class SyncConfig:
    """Configuration for billing sync."""

    db_path: str = field(default_factory=lambda: str(
        Path.home() / ".mekong" / "usage.db"
    ))
    gateway_url: str = "https://raas.agencyos.network/v2/usage"
    api_key: Optional[str] = None
    batch_size: int = 100
    max_retries: int = 5
    base_backoff_seconds: float = 1.0
    max_backoff_seconds: float = 60.0
    request_timeout_seconds: float = 30.0


@dataclass
class SyncResult:
    """Result of a sync operation."""

    success: bool
    records_synced: int
    records_failed: int
    total_payload_size: int
    elapsed_ms: float
    error: Optional[str] = None
    gateway_response: Optional[dict] = None
    idempotency_key: Optional[str] = None
    retry_count: int = 0


@dataclass
class UsageRecord:
    """Single usage record from local store."""

    id: int
    event_id: str
    event_type: str
    tenant_id: str
    timestamp: str
    endpoint: Optional[str]
    model: Optional[str]
    input_tokens: int
    output_tokens: int
    duration_ms: float
    metadata: dict
    synced: bool
    created_at: str


class BillingSyncService:
    """
    Billing Sync Service for usage records synchronization.

    Syncs local SQLite usage records to RaaS Gateway v2/usage endpoint.
    Handles idempotency, retry logic, and error recovery.
    """

    def __init__(self, config: Optional[SyncConfig] = None) -> None:
        """
        Initialize billing sync service.

        Args:
            config: Optional SyncConfig instance
        """
        self.config = config or SyncConfig()
        self.api_key = self.config.api_key or os.getenv("MEKONG_API_KEY") or os.getenv("RAAS_LICENSE_KEY")
        self._conn: Optional[sqlite3.Connection] = None
        self._logger = get_logger(__name__)

    def _get_connection(self) -> sqlite3.Connection:
        """Get or create SQLite connection."""
        if self._conn is None:
            db_path = Path(self.config.db_path)
            db_path.parent.mkdir(parents=True, exist_ok=True)
            self._conn = sqlite3.connect(str(db_path))
            self._conn.row_factory = sqlite3.Row
            self._init_db()
        return self._conn

    def _init_db(self) -> None:
        """Initialize database schema if not exists."""
        conn = self._get_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS usage_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                event_type TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                endpoint TEXT,
                model TEXT,
                input_tokens INTEGER DEFAULT 0,
                output_tokens INTEGER DEFAULT 0,
                duration_ms REAL DEFAULT 0,
                metadata TEXT,
                synced INTEGER DEFAULT 0,
                sync_attempts INTEGER DEFAULT 0,
                last_sync_error TEXT,
                synced_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                idempotency_key TEXT UNIQUE NOT NULL,
                records_count INTEGER NOT NULL,
                payload_size INTEGER NOT NULL,
                status TEXT NOT NULL,
                gateway_response TEXT,
                error TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_usage_synced
            ON usage_records(synced, created_at)
        """)
        conn.commit()

    def close(self) -> None:
        """Close database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None

    def generate_idempotency_key(self, records: list[UsageRecord]) -> str:
        """
        Generate idempotency key for a batch of records.

        Uses SHA256 hash of sorted event IDs to ensure same batch
        always produces same key.

        Args:
            records: List of usage records

        Returns:
            Idempotency key string (mk_idem_<hash>)
        """
        event_ids = sorted([r.event_id for r in records])
        content = "|".join(event_ids)
        hash_digest = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"mk_idem_{hash_digest}"

    def fetch_unsynced_records(self, limit: Optional[int] = None) -> list[UsageRecord]:
        """
        Fetch unsynced records from local SQLite store.

        Args:
            limit: Optional limit on number of records

        Returns:
            List of unsynced UsageRecord objects
        """
        conn = self._get_connection()
        query = """
            SELECT id, event_id, event_type, tenant_id, timestamp,
                   endpoint, model, input_tokens, output_tokens,
                   duration_ms, metadata, synced, created_at
            FROM usage_records
            WHERE synced = 0
            ORDER BY created_at ASC
            LIMIT ?
        """
        cursor = conn.execute(query, (limit or self.config.batch_size,))
        rows = cursor.fetchall()

        records = []
        for row in rows:
            records.append(UsageRecord(
                id=row["id"],
                event_id=row["event_id"],
                event_type=row["event_type"],
                tenant_id=row["tenant_id"],
                timestamp=row["timestamp"],
                endpoint=row["endpoint"],
                model=row["model"],
                input_tokens=row["input_tokens"] or 0,
                output_tokens=row["output_tokens"] or 0,
                duration_ms=row["duration_ms"] or 0.0,
                metadata=json.loads(row["metadata"]) if row["metadata"] else {},
                synced=bool(row["synced"]),
                created_at=row["created_at"],
            ))

        return records

    def build_payload(self, records: list[UsageRecord]) -> dict[str, Any]:
        """
        Build payload for RaaS Gateway v2/usage endpoint.

        Matches the expected schema:
        {
            "tenant_id": str,
            "license_key": str,
            "events": [
                {
                    "event_id": str,
                    "event_type": str,
                    "timestamp": str,
                    "endpoint": str,
                    "model": str,
                    "input_tokens": int,
                    "output_tokens": int,
                    "duration_ms": float,
                    "metadata": dict
                }
            ],
            "summary": {
                "total_events": int,
                "total_input_tokens": int,
                "total_output_tokens": int,
                "total_duration_ms": float
            }
        }

        Args:
            records: List of usage records

        Returns:
            Payload dict ready for POST
        """
        events = []
        total_input = 0
        total_output = 0
        total_duration = 0.0

        for record in records:
            events.append({
                "event_id": record.event_id,
                "event_type": record.event_type,
                "timestamp": record.timestamp,
                "endpoint": record.endpoint,
                "model": record.model,
                "input_tokens": record.input_tokens,
                "output_tokens": record.output_tokens,
                "duration_ms": record.duration_ms,
                "metadata": record.metadata,
            })
            total_input += record.input_tokens
            total_output += record.output_tokens
            total_duration += record.duration_ms

        # Get tenant_id from first record (all should have same tenant)
        tenant_id = records[0].tenant_id if records else ""

        payload = {
            "tenant_id": tenant_id,
            "license_key": self.api_key or "",
            "events": events,
            "summary": {
                "total_events": len(events),
                "total_input_tokens": total_input,
                "total_output_tokens": total_output,
                "total_duration_ms": total_duration,
            },
        }

        return payload

    def _calculate_backoff(self, attempt: int) -> float:
        """
        Calculate exponential backoff with jitter.

        Formula: min(base * 2^attempt, max_backoff)

        Args:
            attempt: Current attempt number (0-indexed)

        Returns:
            Backoff time in seconds
        """
        backoff = self.config.base_backoff_seconds * (2 ** attempt)
        return min(backoff, self.config.max_backoff_seconds)

    def send_to_gateway(self, payload: dict[str, Any], idempotency_key: str) -> tuple[bool, Optional[dict], Optional[str]]:
        """
        Send payload to RaaS Gateway with retry logic.

        Implements exponential backoff: 1s → 2s → 4s → 8s → 16s → 32s

        Args:
            payload: Payload dict to send
            idempotency_key: Idempotency key for request

        Returns:
            Tuple of (success, response_dict, error_message)
        """
        if not self.api_key:
            return False, None, "API key not configured"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "X-Idempotency-Key": idempotency_key,
        }

        last_error: Optional[str] = None

        for attempt in range(self.config.max_retries):
            try:
                start_time = time.time()
                payload_size = len(json.dumps(payload))

                with httpx.Client(timeout=self.config.request_timeout_seconds) as client:
                    response = client.post(
                        self.config.gateway_url,
                        json=payload,
                        headers=headers,
                    )

                    elapsed_ms = (time.time() - start_time) * 1000

                    if response.status_code == 200:
                        response_data = response.json()
                        # Validate response has expected format
                        if response_data.get("status") == "accepted":
                            self._logger.info(
                                "billing_sync.success",
                                payload_size=payload_size,
                                elapsed_ms=elapsed_ms,
                                attempt=attempt + 1,
                            )
                            return True, response_data, None
                        else:
                            last_error = f"Unexpected response status: {response_data.get('status')}"
                            self._logger.warning("billing_sync.unexpected_status", status=response_data.get("status"))

                    # Handle HTTP errors
                    if response.status_code >= 500:
                        # Server error - retry
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        self._logger.warning(
                            "billing_sync.server_error",
                            status_code=response.status_code,
                            attempt=attempt + 1,
                            max_retries=self.config.max_retries,
                        )
                    elif response.status_code == 429:
                        # Rate limited - wait and retry
                        last_error = "Rate limit exceeded"
                        retry_after = int(response.headers.get("Retry-After", 60))
                        self._logger.warning(
                            "billing_sync.rate_limited",
                            retry_after=retry_after,
                            attempt=attempt + 1,
                        )
                        time.sleep(min(retry_after, 60))
                        continue
                    elif 400 <= response.status_code < 500:
                        # Client error - don't retry
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        self._logger.error(
                            "billing_sync.client_error",
                            status_code=response.status_code,
                            error=last_error,
                        )
                        return False, None, last_error

            except httpx.TimeoutException as e:
                last_error = f"Timeout: {str(e)}"
                self._logger.warning(
                    "billing_sync.timeout",
                    attempt=attempt + 1,
                    error=last_error,
                )
            except httpx.RequestError as e:
                last_error = f"Request error: {str(e)}"
                self._logger.warning(
                    "billing_sync.request_error",
                    attempt=attempt + 1,
                    error=last_error,
                )
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                self._logger.error(
                    "billing_sync.unexpected_error",
                    attempt=attempt + 1,
                    error=last_error,
                )
                return False, None, last_error

            # Exponential backoff before next retry
            if attempt < self.config.max_retries - 1:
                backoff = self._calculate_backoff(attempt)
                self._logger.debug(
                    "billing_sync.retry_backoff",
                    backoff_seconds=backoff,
                    next_attempt=attempt + 2,
                )
                time.sleep(backoff)

        # All retries exhausted
        self._logger.error(
            "billing_sync.all_retries_exhausted",
            max_retries=self.config.max_retries,
            last_error=last_error,
        )
        return False, None, last_error

    def mark_as_synced(self, record_ids: list[int]) -> None:
        """
        Mark records as synced in local database.

        Args:
            record_ids: List of record IDs to mark
        """
        if not record_ids:
            return

        conn = self._get_connection()
        now = datetime.now(timezone.utc).isoformat()

        # Use parameterized query for safety
        placeholders = ",".join("?" * len(record_ids))
        query = f"""
            UPDATE usage_records
            SET synced = 1,
                sync_attempts = sync_attempts + 1,
                synced_at = ?
            WHERE id IN ({placeholders})
        """

        params = [now] + record_ids
        conn.execute(query, params)
        conn.commit()

        self._logger.info(
            "billing_sync.marked_synced",
            record_count=len(record_ids),
        )

    def mark_sync_failed(self, record_ids: list[int], error: str) -> None:
        """
        Mark records as sync failed.

        Args:
            record_ids: List of record IDs
            error: Error message
        """
        if not record_ids:
            return

        conn = self._get_connection()
        query = """
            UPDATE usage_records
            SET sync_attempts = sync_attempts + 1,
                last_sync_error = ?
            WHERE id IN (?)
        """

        # Note: For simplicity, we update one at a time for failed records
        for record_id in record_ids:
            conn.execute(query, (error, record_id))

        conn.commit()

    def record_sync_history(
        self,
        idempotency_key: str,
        records_count: int,
        payload_size: int,
        status: str,
        gateway_response: Optional[dict] = None,
        error: Optional[str] = None,
    ) -> None:
        """
        Record sync attempt in history table.

        Args:
            idempotency_key: Idempotency key used
            records_count: Number of records in batch
            payload_size: Size of payload in bytes
            status: 'success' or 'failed'
            gateway_response: Response from gateway
            error: Error message if failed
        """
        conn = self._get_connection()
        conn.execute("""
            INSERT INTO sync_history (idempotency_key, records_count, payload_size, status, gateway_response, error)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            idempotency_key,
            records_count,
            payload_size,
            status,
            json.dumps(gateway_response) if gateway_response else None,
            error,
        ))
        conn.commit()

    def sync_to_gateway(self, limit: Optional[int] = None) -> SyncResult:
        """
        Main sync method - fetch, build, send, mark.

        Args:
            limit: Optional limit on records to sync

        Returns:
            SyncResult with sync status
        """
        start_time = time.time()

        # Step 1: Fetch unsynced records
        records = self.fetch_unsynced_records(limit)

        if not records:
            return SyncResult(
                success=True,
                records_synced=0,
                records_failed=0,
                total_payload_size=0,
                elapsed_ms=(time.time() - start_time) * 1000,
                gateway_response={"message": "No unsynced records"},
            )

        # Step 2: Generate idempotency key
        idempotency_key = self.generate_idempotency_key(records)

        # Step 3: Build payload
        payload = self.build_payload(records)
        payload_size = len(json.dumps(payload))

        # Step 4: Send to gateway with retry
        success, gateway_response, error = self.send_to_gateway(payload, idempotency_key)

        elapsed_ms = (time.time() - start_time) * 1000

        if success and gateway_response:
            # Step 5: Mark records as synced
            self.mark_as_synced([r.id for r in records])

            # Record success in history
            self.record_sync_history(
                idempotency_key=idempotency_key,
                records_count=len(records),
                payload_size=payload_size,
                status="success",
                gateway_response=gateway_response,
            )

            return SyncResult(
                success=True,
                records_synced=len(records),
                records_failed=0,
                total_payload_size=payload_size,
                elapsed_ms=elapsed_ms,
                gateway_response=gateway_response,
                idempotency_key=idempotency_key,
            )
        else:
            # Record failure in history
            self.record_sync_history(
                idempotency_key=idempotency_key,
                records_count=len(records),
                payload_size=payload_size,
                status="failed",
                error=error,
            )

            # Mark records with failed attempt
            self.mark_sync_failed([r.id for r in records], error or "Unknown error")

            return SyncResult(
                success=False,
                records_synced=0,
                records_failed=len(records),
                total_payload_size=payload_size,
                elapsed_ms=elapsed_ms,
                error=error,
                idempotency_key=idempotency_key,
            )

    def get_sync_status(self) -> dict[str, Any]:
        """
        Get current sync status.

        Returns:
            Dict with sync statistics
        """
        conn = self._get_connection()

        # Count unsynced records
        cursor = conn.execute("SELECT COUNT(*) as count FROM usage_records WHERE synced = 0")
        unsynced_count = cursor.fetchone()["count"]

        # Count synced records
        cursor = conn.execute("SELECT COUNT(*) as count FROM usage_records WHERE synced = 1")
        synced_count = cursor.fetchone()["count"]

        # Get last sync time
        cursor = conn.execute("""
            SELECT MAX(synced_at) as last_sync
            FROM usage_records
            WHERE synced = 1
        """)
        row = cursor.fetchone()
        last_sync = row["last_sync"] if row else None

        # Get recent sync history
        cursor = conn.execute("""
            SELECT idempotency_key, records_count, status, created_at
            FROM sync_history
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_history = [dict(row) for row in cursor.fetchall()]

        return {
            "unsynced_records": unsynced_count,
            "synced_records": synced_count,
            "last_sync": last_sync,
            "recent_history": recent_history,
            "api_key_configured": bool(self.api_key),
            "gateway_url": self.config.gateway_url,
        }

    def force_resync(self, limit: Optional[int] = None) -> SyncResult:
        """
        Force resync of already synced records.

        Use with caution - only for recovery scenarios.

        Args:
            limit: Optional limit on records to resync

        Returns:
            SyncResult with sync status
        """
        conn = self._get_connection()

        # Reset synced flag for records
        query = """
            UPDATE usage_records
            SET synced = 0,
                last_sync_error = NULL
            WHERE synced = 1
            ORDER BY created_at ASC
            LIMIT ?
        """
        conn.execute(query, (limit or self.config.batch_size,))
        conn.commit()

        # Now sync them
        return self.sync_to_gateway(limit)


# Global instance
_service: Optional[BillingSyncService] = None


def get_service() -> BillingSyncService:
    """Get global billing sync service instance."""
    global _service
    if _service is None:
        _service = BillingSyncService()
    return _service


def reset_service() -> None:
    """Reset global service instance (for testing)."""
    global _service
    _service = None
