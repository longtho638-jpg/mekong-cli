"""
Mekong CLI - Billing Reconciliation Service (Phase 6)

Reconciles local usage records with RaaS Gateway remote data.
Features:
- Fetch local records from SQLite via BillingSyncService
- Compare with RaaS Gateway v2/usage/reconcile endpoint
- Detect and resolve discrepancies
- Emit BILLING_RECONCILIATION events
- Rich console logging

Usage:
    from src.raas.billing_reconciliation import BillingReconciliationService

    service = BillingReconciliationService()
    result = service.reconcile_batch()
"""

from __future__ import annotations

import hashlib
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import httpx

from src.config.logging_config import get_logger
from src.raas.billing_sync import BillingSyncService, get_service as get_sync_service
from src.billing.event_emitter import get_emitter
from src.core.event_bus import get_event_bus, EventType


class ReconciliationStatus(str, Enum):
    """Status of reconciliation record."""

    MATCHED = "matched"
    VARIANCE = "variance"
    MISSING_REMOTE = "missing_remote"
    MISSING_LOCAL = "missing_local"
    ERROR = "error"


@dataclass
class ReconciliationRecord:
    """Single reconciliation record."""

    record_id: str
    license_key: str
    local_amount: Decimal
    remote_amount: Decimal
    variance: Decimal
    variance_percent: float
    status: ReconciliationStatus
    discrepancies: List[Dict[str, Any]] = field(default_factory=list)
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    local_event_count: int = 0
    remote_event_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "record_id": self.record_id,
            "license_key": self.license_key,
            "local_amount": str(self.local_amount),
            "remote_amount": str(self.remote_amount),
            "variance": str(self.variance),
            "variance_percent": self.variance_percent,
            "status": self.status.value,
            "discrepancies": self.discrepancies,
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "local_event_count": self.local_event_count,
            "remote_event_count": self.remote_event_count,
        }


@dataclass
class ReconciliationResult:
    """Result of reconciliation batch."""

    success: bool
    total_records: int
    matched_count: int
    variance_count: int
    missing_remote_count: int
    missing_local_count: int
    error_count: int
    total_local_amount: Decimal
    total_remote_amount: Decimal
    total_variance: Decimal
    records: List[ReconciliationRecord] = field(default_factory=list)
    error: Optional[str] = None
    elapsed_ms: float = 0.0
    gateway_response: Optional[Dict] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "success": self.success,
            "total_records": self.total_records,
            "matched_count": self.matched_count,
            "variance_count": self.variance_count,
            "missing_remote_count": self.missing_remote_count,
            "missing_local_count": self.missing_local_count,
            "error_count": self.error_count,
            "total_local_amount": str(self.total_local_amount),
            "total_remote_amount": str(self.total_remote_amount),
            "total_variance": str(self.total_variance),
            "records": [r.to_dict() for r in self.records],
            "error": self.error,
            "elapsed_ms": self.elapsed_ms,
        }


@dataclass
class ReconciliationConfig:
    """Configuration for reconciliation service."""

    gateway_url: str = "https://raas.agencyos.network/v2/usage/reconcile"
    api_key: Optional[str] = None
    variance_threshold_percent: float = 5.0  # Alert if variance > 5%
    auto_resolve_threshold_percent: float = 0.5  # Auto-resolve if < 0.5%
    max_retries: int = 3
    base_backoff_seconds: float = 1.0
    request_timeout_seconds: float = 30.0
    batch_size: int = 100


class BillingReconciliationService:
    """
    Billing Reconciliation Service (Phase 6).

    Reconciles local usage records with RaaS Gateway remote data.
    Detects discrepancies, resolves minor variances, and emits events.
    """

    def __init__(self, config: Optional[ReconciliationConfig] = None) -> None:
        """
        Initialize reconciliation service.

        Args:
            config: Optional ReconciliationConfig instance
        """
        self.config = config or ReconciliationConfig()
        self.api_key = self.config.api_key or os.getenv("MEKONG_API_KEY") or os.getenv("RAAS_LICENSE_KEY")
        self._sync_service: Optional[BillingSyncService] = None
        self._logger = get_logger(__name__)
        self._event_emitter = get_emitter()
        self._event_bus = get_event_bus()

    @property
    def sync_service(self) -> BillingSyncService:
        """Get or create sync service."""
        if self._sync_service is None:
            self._sync_service = get_sync_service()
        return self._sync_service

    def generate_record_id(self, license_key: str, period_start: datetime) -> str:
        """Generate unique record ID for reconciliation."""
        content = f"{license_key}:{period_start.isoformat()}"
        hash_digest = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"recon_{hash_digest}"

    def fetch_local_summary(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Fetch local usage summary from SQLite.

        Args:
            period_start: Period start datetime
            period_end: Period end datetime

        Returns:
            Dict with local usage summary
        """
        records = self.sync_service.fetch_unsynced_records(limit=self.config.batch_size)

        total_amount = Decimal(0)
        total_events = len(records)
        total_input_tokens = 0
        total_output_tokens = 0

        for record in records:
            # Calculate approximate amount from tokens
            # Using placeholder rate - adjust based on actual pricing
            total_input_tokens += record.input_tokens
            total_output_tokens += record.output_tokens

        # Placeholder calculation - in production, use actual pricing
        total_amount = Decimal(str(total_input_tokens * 0.000001 + total_output_tokens * 0.000002))

        return {
            "total_events": total_events,
            "total_amount": str(total_amount),
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
        }

    def fetch_remote_summary(self, license_key: str, period_start: datetime, period_end: datetime) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch remote usage summary from RaaS Gateway.

        Args:
            license_key: License key
            period_start: Period start datetime
            period_end: Period end datetime

        Returns:
            Tuple of (success, remote_summary, error)
        """
        if not self.api_key:
            return False, None, "API key not configured"

        payload = {
            "license_key": license_key,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        try:
            with httpx.Client(timeout=self.config.request_timeout_seconds) as client:
                response = client.post(
                    self.config.gateway_url,
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "accepted":
                        return True, data.get("remote_summary"), None
                    else:
                        return False, None, f"Unexpected status: {data.get('status')}"
                elif response.status_code == 404:
                    # No remote data for this period
                    return True, None, None
                else:
                    return False, None, f"HTTP {response.status_code}: {response.text[:200]}"

        except httpx.TimeoutException as e:
            return False, None, f"Timeout: {str(e)}"
        except httpx.RequestError as e:
            return False, None, f"Request error: {str(e)}"
        except Exception as e:
            return False, None, f"Unexpected error: {str(e)}"

    def compare_records(self, local_summary: Dict, remote_summary: Optional[Dict]) -> ReconciliationRecord:
        """
        Compare local and remote summaries.

        Args:
            local_summary: Local usage summary
            remote_summary: Remote usage summary (or None if missing)

        Returns:
            ReconciliationRecord with comparison results
        """
        license_key = "unknown"  # Would extract from context
        local_amount = Decimal(local_summary.get("total_amount", "0"))
        local_events = local_summary.get("total_events", 0)

        if remote_summary is None:
            # No remote data
            return ReconciliationRecord(
                record_id=self.generate_record_id(license_key, datetime.now()),
                license_key=license_key,
                local_amount=local_amount,
                remote_amount=Decimal(0),
                variance=local_amount,
                variance_percent=100.0 if local_amount > 0 else 0.0,
                status=ReconciliationStatus.MISSING_REMOTE,
                local_event_count=local_events,
                remote_event_count=0,
                discrepancies=[
                    {
                        "type": "missing_remote",
                        "description": "No remote data found for this period",
                    }
                ],
            )

        remote_amount = Decimal(remote_summary.get("total_amount", "0"))
        remote_events = remote_summary.get("total_events", 0)
        variance = remote_amount - local_amount

        variance_percent = 0.0
        if local_amount > 0:
            variance_percent = float(abs(variance) / local_amount * 100)

        # Determine status
        discrepancies = []
        if variance_percent < self.config.auto_resolve_threshold_percent:
            status = ReconciliationStatus.MATCHED
        elif variance_percent <= self.config.variance_threshold_percent:
            status = ReconciliationStatus.MATCHED
        else:
            status = ReconciliationStatus.VARIANCE
            if variance > 0:
                discrepancies.append({
                    "type": "over_billing",
                    "description": f"Remote (${remote_amount}) exceeds local (${local_amount})",
                    "variance": str(variance),
                    "variance_percent": variance_percent,
                })
            else:
                discrepancies.append({
                    "type": "under_billing",
                    "description": f"Local (${local_amount}) exceeds remote (${remote_amount})",
                    "variance": str(variance),
                    "variance_percent": variance_percent,
                })

        return ReconciliationRecord(
            record_id=self.generate_record_id(license_key, datetime.now()),
            license_key=license_key,
            local_amount=local_amount,
            remote_amount=remote_amount,
            variance=variance,
            variance_percent=variance_percent,
            status=status,
            local_event_count=local_events,
            remote_event_count=remote_events,
            discrepancies=discrepancies,
        )

    def resolve_discrepancies(self, record: ReconciliationRecord) -> bool:
        """
        Auto-resolve minor discrepancies.

        Args:
            record: ReconciliationRecord to resolve

        Returns:
            True if resolved successfully
        """
        if record.variance_percent < self.config.auto_resolve_threshold_percent:
            record.resolved = True
            record.resolved_at = datetime.now(timezone.utc)
            return True

        if record.status == ReconciliationStatus.MATCHED:
            record.resolved = True
            record.resolved_at = datetime.now(timezone.utc)
            return True

        return False

    def emit_reconciliation_event(self, result: ReconciliationResult) -> None:
        """
        Emit reconciliation event to event bus.

        Args:
            result: ReconciliationResult
        """
        event_data = {
            "event_type": "billing:reconciled",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_records": result.total_records,
            "matched_count": result.matched_count,
            "variance_count": result.variance_count,
            "total_local_amount": str(result.total_local_amount),
            "total_remote_amount": str(result.total_remote_amount),
            "total_variance": str(result.total_variance),
            "success": result.success,
        }

        # Emit via event emitter
        self._event_emitter.emit_billing_reconciliation(
            audit_id=f"recon_{int(time.time())}",
            license_key="bulk_reconciliation",
            key_id="system",
            audit_date=datetime.now(timezone.utc).isoformat(),
            expected_amount=result.total_local_amount,
            actual_amount=result.total_remote_amount,
            variance=result.total_variance,
            variance_percent=float(result.total_variance / result.total_local_amount * 100) if result.total_local_amount > 0 else 0.0,
            status="completed" if result.success else "failed",
            discrepancies=[r.to_dict() for r in result.records if r.status != ReconciliationStatus.MATCHED],
        )

        # Also emit raw event
        self._event_bus.emit(EventType.BILLING_RECONCILIATION, event_data)

    def reconcile_batch(self, license_key: Optional[str] = None, period_days: int = 1) -> ReconciliationResult:
        """
        Main reconciliation workflow - fetch, compare, resolve.

        Args:
            license_key: Optional license key (defaults to env var)
            period_days: Number of days to reconcile

        Returns:
            ReconciliationResult with reconciliation status
        """
        start_time = time.time()
        license_key = license_key or self.api_key or ""

        if not license_key:
            return ReconciliationResult(
                success=False,
                total_records=0,
                matched_count=0,
                variance_count=0,
                missing_remote_count=0,
                missing_local_count=0,
                error_count=0,
                total_local_amount=Decimal(0),
                total_remote_amount=Decimal(0),
                total_variance=Decimal(0),
                error="API key not configured",
                elapsed_ms=(time.time() - start_time) * 1000,
            )

        # Calculate period
        period_end = datetime.now(timezone.utc)
        period_start = period_end - timedelta(days=period_days)

        self._logger.info(
            "reconciliation.started",
            license_key=license_key[:10] + "..." if len(license_key) > 10 else license_key,
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
        )

        # Step 1: Fetch local summary
        local_summary = self.fetch_local_summary(period_start, period_end)

        # Step 2: Fetch remote summary
        success, remote_summary, error = self.fetch_remote_summary(license_key, period_start, period_end)

        if not success and error:
            self._logger.error("reconciliation.remote_fetch_failed", error=error)
            return ReconciliationResult(
                success=False,
                total_records=1,
                matched_count=0,
                variance_count=0,
                missing_remote_count=0,
                missing_local_count=0,
                error_count=1,
                total_local_amount=Decimal(local_summary.get("total_amount", "0")),
                total_remote_amount=Decimal(0),
                total_variance=Decimal(local_summary.get("total_amount", "0")),
                error=error,
                elapsed_ms=(time.time() - start_time) * 1000,
            )

        # Step 3: Compare records
        record = self.compare_records(local_summary, remote_summary)

        # Step 4: Resolve discrepancies
        self.resolve_discrepancies(record)

        # Step 5: Build result
        records = [record]
        result = ReconciliationResult(
            success=True,
            total_records=1,
            matched_count=1 if record.status == ReconciliationStatus.MATCHED else 0,
            variance_count=1 if record.status == ReconciliationStatus.VARIANCE else 0,
            missing_remote_count=1 if record.status == ReconciliationStatus.MISSING_REMOTE else 0,
            missing_local_count=1 if record.status == ReconciliationStatus.MISSING_LOCAL else 0,
            error_count=0,
            total_local_amount=record.local_amount,
            total_remote_amount=record.remote_amount,
            total_variance=record.variance,
            records=records,
            elapsed_ms=(time.time() - start_time) * 1000,
        )

        # Step 6: Emit event
        self.emit_reconciliation_event(result)

        self._logger.info(
            "reconciliation.completed",
            total_records=result.total_records,
            matched_count=result.matched_count,
            variance_count=result.variance_count,
            elapsed_ms=result.elapsed_ms,
        )

        return result

    def get_reconciliation_status(self) -> Dict[str, Any]:
        """
        Get current reconciliation status.

        Returns:
            Dict with reconciliation status info
        """
        return {
            "api_key_configured": bool(self.api_key),
            "gateway_url": self.config.gateway_url,
            "variance_threshold_percent": self.config.variance_threshold_percent,
            "auto_resolve_threshold_percent": self.config.auto_resolve_threshold_percent,
            "last_reconciliation": None,  # Would query from history
        }


# Global instance
_service: Optional[BillingReconciliationService] = None


def get_service() -> BillingReconciliationService:
    """Get global reconciliation service instance."""
    global _service
    if _service is None:
        _service = BillingReconciliationService()
    return _service


def reset_service() -> None:
    """Reset global service instance (for testing)."""
    global _service
    _service = None


__all__ = [
    "ReconciliationStatus",
    "ReconciliationRecord",
    "ReconciliationResult",
    "ReconciliationConfig",
    "BillingReconciliationService",
    "get_service",
    "reset_service",
]
