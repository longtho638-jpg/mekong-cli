"""
Mekong CLI - Idempotency Layer

Prevent double-billing on batch processing with batch ID tracking
and concurrent submission safety.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from src.db.repository import LicenseRepository, get_repository

logger = logging.getLogger(__name__)


class BatchStatus(str, Enum):
    """Batch processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class BatchRecord:
    """Batch processing record."""

    batch_id: str
    license_key: str
    key_id: str
    events_count: int
    status: BatchStatus
    created_at: datetime
    processed_at: Optional[datetime] = None
    billing_record_id: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "batch_id": self.batch_id,
            "license_key": self.license_key,
            "key_id": self.key_id,
            "events_count": self.events_count,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "billing_record_id": self.billing_record_id,
            "error_message": self.error_message,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BatchRecord":
        """Deserialize from dictionary."""
        return cls(
            batch_id=data["batch_id"],
            license_key=data["license_key"],
            key_id=data["key_id"],
            events_count=data["events_count"],
            status=BatchStatus(data["status"]),
            created_at=(
                datetime.fromisoformat(data["created_at"])
                if data.get("created_at")
                else datetime.now(timezone.utc)
            ),
            processed_at=(
                datetime.fromisoformat(data["processed_at"])
                if data.get("processed_at")
                else None
            ),
            billing_record_id=data.get("billing_record_id"),
            error_message=data.get("error_message"),
            metadata=data.get("metadata", {}),
        )


@dataclass
class BatchResult:
    """Result of batch processing."""

    batch_id: str
    license_key: str
    status: BatchStatus
    is_duplicate: bool
    billing_record_id: Optional[str] = None
    error_message: Optional[str] = None
    processed_count: int = 0
    total_charge: Decimal = Decimal(0)
    created_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "batch_id": self.batch_id,
            "license_key": self.license_key,
            "status": self.status.value,
            "is_duplicate": self.is_duplicate,
            "billing_record_id": self.billing_record_id,
            "error_message": self.error_message,
            "processed_count": self.processed_count,
            "total_charge": str(self.total_charge),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class IdempotencyManager:
    """
    Manage batch idempotency for billing processing.

    Features:
    - Batch ID generation from usage events
    - Duplicate detection via database lookup
    - Concurrent submission handling with row-level locking
    - Retry support for failed batches
    """

    def __init__(self, repository: Optional[LicenseRepository] = None) -> None:
        self._repo = repository or get_repository()
        self._lock_timeout = 5000  # 5 seconds
        self._batch_ttl_hours = 720  # 30 days

    def generate_batch_id(
        self,
        license_key: str,
        events: List[Dict[str, Any]],
        timestamp: Optional[datetime] = None,
    ) -> str:
        """
        Generate deterministic batch ID from usage events.

        Uses hash of sorted event signatures to ensure same events
        always produce same batch ID.

        Args:
            license_key: License key
            events: List of usage events
            timestamp: Optional timestamp (defaults to now)

        Returns:
            Batch ID string
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        # Create event signatures
        event_sigs = []
        for event in events:
            sig = f"{event.get('event_type', '')}:{event.get('value', 0)}:{event.get('metric', '')}"
            event_sigs.append(sig)

        # Sort to ensure deterministic ordering
        event_sigs.sort()

        # Create hash
        content = f"{license_key}:{timestamp.date()}:{'|'.join(event_sigs)}"
        batch_hash = hashlib.sha256(content.encode()).hexdigest()[:16]

        return f"batch_{license_key}_{timestamp.strftime('%Y%m%d')}_{batch_hash}"

    async def check_or_create_batch(
        self,
        batch_id: str,
        license_key: str,
        key_id: str,
        events_count: int,
    ) -> tuple[Optional[BatchRecord], bool]:
        """
        Check if batch exists, create if not.

        Uses optimistic locking to handle concurrent submissions.

        Args:
            batch_id: Batch ID
            license_key: License key
            key_id: Key ID
            events_count: Number of events in batch

        Returns:
            Tuple of (BatchRecord or None, is_duplicate)
            - If duplicate: returns existing record, is_duplicate=True
            - If new: returns new record, is_duplicate=False
            - If conflict: returns None, is_duplicate=False (retry)
        """
        # Check if already exists
        existing = await self._repo.check_batch_idempotency(batch_id)

        if existing:
            # Return existing record
            return BatchRecord(
                batch_id=existing["batch_id"],
                license_key=existing["license_key"],
                key_id=existing["key_id"],
                events_count=existing["events_count"],
                status=BatchStatus(existing["status"]),
                created_at=existing["created_at"],
                processed_at=existing.get("processed_at"),
                billing_record_id=existing.get("billing_record_id"),
                error_message=existing.get("error_message"),
            ), True

        # Try to create new batch
        try:
            result = await self._repo.create_batch_idempotency(
                batch_id=batch_id,
                license_key=license_key,
                key_id=key_id,
                events_count=events_count,
            )

            if result:
                new_record = BatchRecord(
                    batch_id=result["batch_id"],
                    license_key=result["license_key"],
                    key_id=result["key_id"],
                    events_count=result["events_count"],
                    status=BatchStatus.PENDING,
                    created_at=result["created_at"],
                )
                return new_record, False
            else:
                # Creation failed (likely concurrent insert)
                logger.warning(f"Batch creation failed for {batch_id}")
                return None, False

        except Exception as e:
            # Handle unique constraint violation (concurrent insert)
            if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                # Another process created the batch concurrently
                logger.info(f"Concurrent batch creation detected: {batch_id}")
                return None, True
            raise

    async def mark_processing(self, batch_id: str) -> bool:
        """
        Mark batch as processing.

        Returns False if batch cannot be marked (already processed/failed).

        Args:
            batch_id: Batch ID

        Returns:
            True if marked successfully, False otherwise
        """
        return await self._repo.update_batch_idempotency(
            batch_id=batch_id,
            status="processing",
        )

    async def mark_completed(
        self,
        batch_id: str,
        billing_record_id: str,
        processed_count: Optional[int] = None,
    ) -> bool:
        """
        Mark batch as completed.

        Args:
            batch_id: Batch ID
            billing_record_id: Created billing record ID
            processed_count: Optional count of processed events

        Returns:
            True if marked successfully
        """
        return await self._repo.update_batch_idempotency(
            batch_id=batch_id,
            status="completed",
            billing_record_id=billing_record_id,
        )

    async def mark_failed(
        self,
        batch_id: str,
        error_message: str,
    ) -> bool:
        """
        Mark batch as failed.

        Args:
            batch_id: Batch ID
            error_message: Error description

        Returns:
            True if marked successfully
        """
        return await self._repo.update_batch_idempotency(
            batch_id=batch_id,
            status="failed",
            error_message=error_message,
        )

    async def process_batch(
        self,
        batch_id: str,
        license_key: str,
        key_id: str,
        events: List[Dict[str, Any]],
        process_fn,  # Callable to process batch
    ) -> BatchResult:
        """
        Process a batch with idempotency guarantees.

        This is the main entry point for batch processing.

        Args:
            batch_id: Batch ID (will be generated if not provided)
            license_key: License key
            key_id: Key ID
            events: Usage events to process
            process_fn: Async function to process events and return billing record ID

        Returns:
            BatchResult with processing outcome
        """
        timestamp = datetime.now(timezone.utc)

        # Generate batch ID if not provided
        if not batch_id:
            batch_id = self.generate_batch_id(license_key, events, timestamp)

        # Check or create batch record
        batch_record, is_duplicate = await self.check_or_create_batch(
            batch_id=batch_id,
            license_key=license_key,
            key_id=key_id,
            events_count=len(events),
        )

        if is_duplicate:
            # Batch already processed
            if batch_record:
                if batch_record.status == BatchStatus.COMPLETED:
                    return BatchResult(
                        batch_id=batch_id,
                        license_key=license_key,
                        status=batch_record.status,
                        is_duplicate=True,
                        billing_record_id=batch_record.billing_record_id,
                        created_at=batch_record.created_at,
                    )
                elif batch_record.status == BatchStatus.PROCESSING:
                    # Still processing - wait and retry or return conflict
                    logger.warning(f"Batch {batch_id} still processing")
                    return BatchResult(
                        batch_id=batch_id,
                        license_key=license_key,
                        status=BatchStatus.PROCESSING,
                        is_duplicate=True,
                        error_message="Batch still processing",
                        created_at=batch_record.created_at,
                    )
                elif batch_record.status == BatchStatus.FAILED:
                    # Failed - can retry
                    logger.info(f"Retrying failed batch {batch_id}")
                    # Fall through to process
                else:
                    return BatchResult(
                        batch_id=batch_id,
                        license_key=license_key,
                        status=batch_record.status,
                        is_duplicate=True,
                        created_at=batch_record.created_at,
                    )
            else:
                return BatchResult(
                    batch_id=batch_id,
                    license_key=license_key,
                    status=BatchStatus.PENDING,
                    is_duplicate=True,
                    error_message="Unknown batch state",
                )

        if not batch_record:
            # Concurrent creation detected, fetch existing
            await asyncio.sleep(0.1)  # Brief wait
            existing = await self._repo.check_batch_idempotency(batch_id)
            if existing:
                return BatchResult(
                    batch_id=batch_id,
                    license_key=license_key,
                    status=BatchStatus(existing["status"]),
                    is_duplicate=True,
                    billing_record_id=existing.get("billing_record_id"),
                    created_at=existing["created_at"],
                )

        # Mark as processing
        await self.mark_processing(batch_id)

        try:
            # Process the batch
            billing_record_id = await process_fn(events)

            # Mark as completed
            await self.mark_completed(batch_id, billing_record_id)

            return BatchResult(
                batch_id=batch_id,
                license_key=license_key,
                status=BatchStatus.COMPLETED,
                is_duplicate=False,
                billing_record_id=billing_record_id,
                created_at=timestamp,
            )

        except Exception as e:
            logger.error(f"Batch processing failed: {e}")
            await self.mark_failed(batch_id, str(e))

            return BatchResult(
                batch_id=batch_id,
                license_key=license_key,
                status=BatchStatus.FAILED,
                is_duplicate=False,
                error_message=str(e),
                created_at=timestamp,
            )

    async def get_batch_status(self, batch_id: str) -> Optional[BatchRecord]:
        """Get current batch status."""
        result = await self._repo.check_batch_idempotency(batch_id)
        if not result:
            return None

        return BatchRecord(
            batch_id=result["batch_id"],
            license_key=result["license_key"],
            key_id=result["key_id"],
            events_count=result["events_count"],
            status=BatchStatus(result["status"]),
            created_at=result["created_at"],
            processed_at=result.get("processed_at"),
            billing_record_id=result.get("billing_record_id"),
            error_message=result.get("error_message"),
        )

    async def cleanup_expired_batches(self, max_age_hours: int = 720) -> int:
        """
        Clean up expired batch records.

        Args:
            max_age_hours: Maximum age in hours (default 30 days)

        Returns:
            Number of records cleaned up
        """
        # This would require a DELETE query - implement in repository if needed
        logger.info(f"Cleanup requested for batches older than {max_age_hours}h")
        return 0


# Module-level singleton
_manager: Optional[IdempotencyManager] = None


def get_idempotency_manager() -> IdempotencyManager:
    """Get or create the idempotency manager singleton."""
    global _manager
    if _manager is None:
        _manager = IdempotencyManager()
    return _manager


def reset_idempotency_manager() -> None:
    """Reset singleton (for testing)."""
    global _manager
    _manager = None


__all__ = [
    "BatchStatus",
    "BatchRecord",
    "BatchResult",
    "IdempotencyManager",
    "get_idempotency_manager",
    "reset_idempotency_manager",
]
