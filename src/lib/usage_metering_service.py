"""
Usage Metering Service — ROIaaS Phase 4

Production-ready service for tracking API calls, feature usage, and runtime durations.
Buffers events locally with SQLite, batches transmission to analytics backend.
Implements retry logic, circuit breaker, and HMAC-SHA256 authentication.
"""

import hashlib
import hmac
import json
import os
import sqlite3
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Optional

import httpx

from src.config.logging_config import get_logger


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class MetricsEvent:
    """
    Single usage event.

    Attributes:
        event_type: Type of event (api_call, feature_usage, runtime_duration)
        tenant_id: Tenant/license identifier
        timestamp: ISO 8601 timestamp
        duration_ms: Duration in milliseconds (for runtime events)
        metadata: Additional event data
    """
    event_type: str
    tenant_id: str
    timestamp: str
    duration_ms: Optional[int] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "event_type": self.event_type,
            "tenant_id": self.tenant_id,
            "timestamp": self.timestamp,
            "duration_ms": self.duration_ms,
            "metadata": self.metadata,
        }


@dataclass
class MetricsBatch:
    """
    Batch of events ready for transmission.

    Attributes:
        tenant_id: Primary tenant ID in batch
        events: List of MetricsEvent objects
        batch_timestamp: When batch was created
    """
    tenant_id: str
    events: list[MetricsEvent]
    batch_timestamp: str

    def to_payload(self) -> dict[str, Any]:
        """Convert to API payload format."""
        return {
            "tenant_id": self.tenant_id,
            "events": [e.to_dict() for e in self.events],
            "batch_timestamp": self.batch_timestamp,
        }


class CircuitBreaker:
    """
    Circuit breaker for resilient API communication.

    States:
        CLOSED: Normal operation, requests flow through
        OPEN: Backend failing, reject requests immediately
        HALF_OPEN: Testing if backend recovered
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
    ) -> None:
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Consecutive failures before opening circuit
            recovery_timeout: Seconds to wait before testing recovery
        """
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[float] = None
        self._logger = get_logger(__name__)

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state

    def allow_request(self) -> bool:
        """
        Check if request should be allowed.

        Returns:
            True if request can proceed, False if circuit is OPEN
        """
        if self._state == CircuitState.CLOSED:
            return True

        if self._state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if self._last_failure_time is None:
                return True

            elapsed = time.time() - self._last_failure_time
            if elapsed >= self._recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._logger.info(
                    "circuitbreaker.state_change",
                    from_state="OPEN",
                    to_state="HALF_OPEN",
                    elapsed_seconds=elapsed,
                )
                return True

            return False

        # HALF_OPEN - allow one test request
        return True

    def record_success(self) -> None:
        """Record successful request."""
        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._logger.info("circuitbreaker.state_change", from_state="HALF_OPEN", to_state="CLOSED")
        elif self._state == CircuitState.CLOSED:
            # Reset failure count on success
            self._failure_count = 0

    def record_failure(self) -> None:
        """Record failed request."""
        self._failure_count += 1
        self._last_failure_time = time.time()

        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            self._logger.warning(
                "circuitbreaker.state_change",
                from_state="HALF_OPEN",
                to_state="OPEN",
            )
        elif self._state == CircuitState.CLOSED:
            if self._failure_count >= self._failure_threshold:
                self._state = CircuitState.OPEN
                self._logger.warning(
                    "circuitbreaker.state_change",
                    from_state="CLOSED",
                    to_state="OPEN",
                    failure_count=self._failure_count,
                )


class UsageMeteringService:
    """
    Production-ready usage metering service.

    Features:
        - Track API calls, feature usage, runtime durations
        - SQLite local buffer (~/.mekong/metrics_buffer.db)
        - Batch transmission with retry logic
        - Circuit breaker for resilience
        - HMAC-SHA256 authentication
        - Exponential backoff (1s → 2s → 4s → 8s → 16s)
    """

    def __init__(
        self,
        db_path: Optional[str] = None,
        api_endpoint: Optional[str] = None,
        license_key: Optional[str] = None,
        batch_size: int = 10,
        flush_interval: float = 10.0,
        request_timeout: float = 30.0,
        max_retries: int = 5,
    ) -> None:
        """
        Initialize usage metering service.

        Args:
            db_path: Path to SQLite database (default: ~/.mekong/metrics_buffer.db)
            api_endpoint: Analytics API endpoint URL
            license_key: RAAS license key for HMAC auth
            batch_size: Number of events per batch
            flush_interval: Seconds between automatic flushes
            request_timeout: HTTP request timeout in seconds
            max_retries: Maximum retry attempts
        """
        # Database path
        if db_path is None:
            db_path = str(Path.home() / ".mekong" / "metrics_buffer.db")
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

        # API configuration
        self._api_endpoint = api_endpoint or os.getenv("METRICS_API_ENDPOINT", "http://localhost:8000/api/metrics")
        self._license_key = license_key or os.getenv("RAAS_LICENSE_KEY", "")

        # Batch configuration
        self._batch_size = batch_size
        self._flush_interval = flush_interval

        # HTTP client
        self._timeout = httpx.Timeout(request_timeout)
        self._max_retries = max_retries

        # Circuit breaker
        self._circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)

        # Connection
        self._conn: Optional[sqlite3.Connection] = None

        # Logging
        self._logger = get_logger(__name__)

    def _get_connection(self) -> sqlite3.Connection:
        """Get or create SQLite connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(self._db_path)
            self._conn.row_factory = sqlite3.Row
            self._init_db()
        return self._conn

    def _init_db(self) -> None:
        """Initialize database schema."""
        conn = self._get_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                duration_ms INTEGER,
                metadata TEXT,
                status TEXT DEFAULT 'pending',
                retry_count INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                event_count INTEGER NOT NULL,
                batch_timestamp TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_status
            ON metrics_events(status, created_at)
        """)
        conn.commit()

    def close(self) -> None:
        """Close database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None

    def _generate_signature(self, payload: dict[str, Any]) -> str:
        """
        Generate HMAC-SHA256 signature for payload.

        Args:
            payload: JSON payload to sign

        Returns:
            Hex-encoded HMAC signature
        """
        if not self._license_key:
            return ""

        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        signature = hmac.new(
            self._license_key.encode("utf-8"),
            payload_json.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return signature

    def _log_api_call(
        self,
        tenant_id: str,
        endpoint: str,
        method: str = "POST",
        status_code: Optional[int] = None,
        duration_ms: Optional[int] = None,
        error: Optional[str] = None,
    ) -> None:
        """Log API call event."""
        self._logger.info(
            "metrics.api_call",
            tenant_id=tenant_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            error=error,
        )

        event = MetricsEvent(
            event_type="api_call",
            tenant_id=tenant_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            metadata={
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "error": error,
            },
        )
        self._store_event(event)

    def _store_event(self, event: MetricsEvent) -> None:
        """Store event to SQLite buffer."""
        conn = self._get_connection()
        query = """
            INSERT INTO metrics_events (event_type, tenant_id, timestamp, duration_ms, metadata)
            VALUES (?, ?, ?, ?, ?)
        """
        conn.execute(
            query,
            (
                event.event_type,
                event.tenant_id,
                event.timestamp,
                event.duration_ms,
                json.dumps(event.metadata),
            ),
        )
        conn.commit()

    def _send_batch(self, batch: MetricsBatch) -> bool:
        """
        Send batch to analytics API with retry logic.

        Args:
            batch: MetricsBatch to send

        Returns:
            True if successful, False otherwise
        """
        if not self._circuit_breaker.allow_request():
            self._logger.warning(
                "metrics.batch_rejected",
                reason="circuit_breaker_open",
                batch_size=len(batch.events),
            )
            return False

        payload = batch.to_payload()
        signature = self._generate_signature(payload)

        headers = {
            "Content-Type": "application/json",
            "X-Signature": signature,
        }

        last_error: Optional[str] = None

        for attempt in range(self._max_retries):
            try:
                start_time = time.time()

                with httpx.Client(timeout=self._timeout) as client:
                    response = client.post(
                        self._api_endpoint,
                        json=payload,
                        headers=headers,
                    )

                    duration_ms = int((time.time() - start_time) * 1000)

                    if response.status_code == 200:
                        self._circuit_breaker.record_success()
                        self._logger.info(
                            "metrics.batch_sent",
                            batch_size=len(batch.events),
                            duration_ms=duration_ms,
                            attempt=attempt + 1,
                        )
                        return True

                    # Non-200 response
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                    self._circuit_breaker.record_failure()

                    # Client errors (4xx) - don't retry
                    if 400 <= response.status_code < 500:
                        self._logger.error(
                            "metrics.batch_client_error",
                            status_code=response.status_code,
                            error=last_error,
                        )
                        return False

                    # Server errors (5xx) - retry with backoff
                    self._logger.warning(
                        "metrics.batch_server_error",
                        status_code=response.status_code,
                        error=last_error,
                        attempt=attempt + 1,
                        max_retries=self._max_retries,
                    )

            except httpx.TimeoutException as e:
                last_error = f"Timeout: {str(e)}"
                self._circuit_breaker.record_failure()
                self._logger.warning(
                    "metrics.batch_timeout",
                    attempt=attempt + 1,
                    error=last_error,
                )

            except httpx.RequestError as e:
                last_error = f"Request error: {str(e)}"
                self._circuit_breaker.record_failure()
                self._logger.warning(
                    "metrics.batch_request_error",
                    attempt=attempt + 1,
                    error=last_error,
                )

            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                self._circuit_breaker.record_failure()
                self._logger.error(
                    "metrics.batch_unexpected_error",
                    attempt=attempt + 1,
                    error=last_error,
                )
                return False

            # Exponential backoff: 1s → 2s → 4s → 8s → 16s
            if attempt < self._max_retries - 1:
                backoff = 2 ** attempt  # 1, 2, 4, 8, 16
                self._logger.debug(
                    "metrics.batch_retry_backoff",
                    backoff_seconds=backoff,
                    next_attempt=attempt + 2,
                )
                time.sleep(backoff)

        # All retries exhausted
        self._logger.error(
            "metrics.batch_all_retries_exhausted",
            batch_size=len(batch.events),
            last_error=last_error,
        )
        return False

    def _get_pending_events(self, limit: int = 10) -> list[MetricsEvent]:
        """Get pending events from database."""
        conn = self._get_connection()
        query = """
            SELECT event_type, tenant_id, timestamp, duration_ms, metadata
            FROM metrics_events
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT ?
        """
        cursor = conn.execute(query, (limit,))
        rows = cursor.fetchall()

        events = []
        for row in rows:
            events.append(MetricsEvent(
                event_type=row["event_type"],
                tenant_id=row["tenant_id"],
                timestamp=row["timestamp"],
                duration_ms=row["duration_ms"],
                metadata=json.loads(row["metadata"]) if row["metadata"] else {},
            ))

        return events

    def _update_event_status(self, event: MetricsEvent, status: str, error: Optional[str] = None) -> None:
        """Update event status in database."""
        conn = self._get_connection()

        if status == "sent":
            # Delete sent events to keep DB small
            conn.execute("DELETE FROM metrics_events WHERE id = (SELECT id FROM metrics_events WHERE event_type = ? AND tenant_id = ? AND timestamp = ? LIMIT 1)",
                (event.event_type, event.tenant_id, event.timestamp))
        else:
            query = """
                UPDATE metrics_events
                SET status = ?, retry_count = retry_count + 1, last_error = ?
                WHERE event_type = ? AND tenant_id = ? AND timestamp = ?
            """
            conn.execute(
                query,
                (status, error, event.event_type, event.tenant_id, event.timestamp),
            )

        conn.commit()

    def flush(self) -> int:
        """
        Flush pending events to analytics API.

        Returns:
            Number of events flushed
        """
        events = self._get_pending_events(self._batch_size)

        if not events:
            return 0

        # Group events by tenant_id
        tenant_events: dict[str, list[MetricsEvent]] = {}
        for event in events:
            if event.tenant_id not in tenant_events:
                tenant_events[event.tenant_id] = []
            tenant_events[event.tenant_id].append(event)

        total_flushed = 0

        for tenant_id, tenant_event_list in tenant_events.items():
            batch = MetricsBatch(
                tenant_id=tenant_id,
                events=tenant_event_list,
                batch_timestamp=datetime.now(timezone.utc).isoformat(),
            )

            success = self._send_batch(batch)

            if success:
                for event in tenant_event_list:
                    self._update_event_status(event, "sent")
                total_flushed += len(tenant_event_list)
            else:
                # Mark events for retry
                for event in tenant_event_list:
                    self._update_event_status(event, "pending", error="Batch send failed")

        return total_flushed

    def track_api_call(
        self,
        tenant_id: str,
        endpoint: str,
        method: str = "POST",
        status_code: Optional[int] = None,
        duration_ms: Optional[int] = None,
        error: Optional[str] = None,
    ) -> None:
        """
        Track an API call event.

        Args:
            tenant_id: Tenant identifier
            endpoint: API endpoint called
            method: HTTP method (default: POST)
            status_code: Response status code
            duration_ms: Call duration in milliseconds
            error: Error message if any
        """
        self._log_api_call(
            tenant_id=tenant_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            error=error,
        )

    def track_feature_usage(
        self,
        tenant_id: str,
        feature_name: str,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Track feature usage event.

        Args:
            tenant_id: Tenant identifier
            feature_name: Name of feature used
            metadata: Additional context
        """
        event = MetricsEvent(
            event_type="feature_usage",
            tenant_id=tenant_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            metadata={
                "feature_name": feature_name,
                **(metadata or {}),
            },
        )
        self._store_event(event)
        self._logger.debug(
            "metrics.feature_tracked",
            tenant_id=tenant_id,
            feature_name=feature_name,
        )

    def track_runtime_duration(
        self,
        tenant_id: str,
        command: str,
        duration_ms: int,
        exit_code: Optional[int] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Track command/runtime duration event.

        Args:
            tenant_id: Tenant identifier
            command: Command that was executed
            duration_ms: Execution duration in milliseconds
            exit_code: Command exit code
            metadata: Additional context
        """
        event = MetricsEvent(
            event_type="runtime_duration",
            tenant_id=tenant_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            duration_ms=duration_ms,
            metadata={
                "command": command,
                "exit_code": exit_code,
                **(metadata or {}),
            },
        )
        self._store_event(event)
        self._logger.debug(
            "metrics.runtime_tracked",
            tenant_id=tenant_id,
            command=command[:100],
            duration_ms=duration_ms,
        )

    def get_stats(self) -> dict[str, Any]:
        """
        Get usage statistics.

        Returns:
            Dictionary with pending/sent event counts and circuit breaker state
        """
        conn = self._get_connection()

        # Count by status
        cursor = conn.execute("""
            SELECT status, COUNT(*) as count
            FROM metrics_events
            GROUP BY status
        """)
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

        # Total events
        cursor = conn.execute("SELECT COUNT(*) as total FROM metrics_events")
        total = cursor.fetchone()["total"]

        return {
            "total_events": total,
            "pending_events": status_counts.get("pending", 0),
            "sent_events": status_counts.get("sent", 0),
            "failed_events": status_counts.get("failed", 0),
            "circuit_breaker_state": self._circuit_breaker.state.value,
            "db_path": str(self._db_path),
        }


# Global instance
_service: Optional[UsageMeteringService] = None


def get_service() -> UsageMeteringService:
    """Get global usage metering service instance."""
    global _service
    if _service is None:
        _service = UsageMeteringService()
    return _service


def init_service(
    db_path: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    license_key: Optional[str] = None,
    **kwargs: Any,
) -> UsageMeteringService:
    """Initialize and return global service instance."""
    global _service
    _service = UsageMeteringService(
        db_path=db_path,
        api_endpoint=api_endpoint,
        license_key=license_key,
        **kwargs,
    )
    return _service


def track_runtime_duration(
    tenant_id: str,
    command: str,
    duration_ms: int,
    exit_code: Optional[int] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    """Track runtime duration via global service."""
    get_service().track_runtime_duration(
        tenant_id=tenant_id,
        command=command,
        duration_ms=duration_ms,
        exit_code=exit_code,
        metadata=metadata,
    )


__all__ = [
    "MetricsEvent",
    "MetricsBatch",
    "CircuitState",
    "CircuitBreaker",
    "UsageMeteringService",
    "get_service",
    "init_service",
    "track_runtime_duration",
]
