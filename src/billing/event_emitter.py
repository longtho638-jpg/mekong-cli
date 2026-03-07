"""
Mekong CLI - Billing Event Emitter

Emits structured billing events for analytics dashboard synchronization.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from src.core.event_bus import get_event_bus, EventType
from src.billing.engine import BillingResult, LineItem
from src.billing.proration import ProrationResult, OverageCalculation
from src.billing.idempotency import BatchResult, BatchStatus

logger = logging.getLogger(__name__)


class BillingEventEmitter:
    """
    Emit structured billing events for analytics sync.

    Events:
    - billing:recorded — New billing record created
    - billing:overage — Overage detected
    - billing:period_closed — Billing period finalized
    - billing:reconciliation — Audit completed
    - billing:batch_processed — Batch processing completed
    - billing:idempotency_conflict — Duplicate batch detected
    """

    def __init__(self) -> None:
        self._event_bus = get_event_bus()

    def emit_billing_recorded(
        self,
        billing_result: BillingResult,
        billing_record_id: str,
        billing_period_id: Optional[str] = None,
    ) -> None:
        """
        Emit event when billing record is created.

        Args:
            billing_result: Billing calculation result
            billing_record_id: Created record ID
            billing_period_id: Optional period ID
        """
        event_data = {
            "billing_record_id": billing_record_id,
            "billing_period_id": billing_period_id,
            "license_key": billing_result.license_key,
            "key_id": billing_result.key_id,
            "period_start": billing_result.period_start.isoformat(),
            "period_end": billing_result.period_end.isoformat(),
            "total_amount": str(billing_result.total),
            "currency": billing_result.currency,
            "line_items_count": len(billing_result.line_items),
            "line_items": [item.to_dict() for item in billing_result.line_items],
            "subtotal": str(billing_result.subtotal),
            "discount": str(billing_result.discount),
            "metadata": billing_result.metadata,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_RECORDED, event_data)
        logger.debug(f"Emitted billing:recorded for {billing_result.license_key}")

    def emit_billing_overage(
        self,
        license_key: str,
        key_id: str,
        overage_calculations: List[OverageCalculation],
        total_overage: Decimal,
        period_start: datetime,
        period_end: datetime,
    ) -> None:
        """
        Emit event when overage is detected.

        Args:
            license_key: License key
            key_id: Key ID
            overage_calculations: List of overage calculations
            total_overage: Total overage charge
            period_start: Period start date
            period_end: Period end date
        """
        event_data = {
            "license_key": license_key,
            "key_id": key_id,
            "total_overage": str(total_overage),
            "overage_count": len(overage_calculations),
            "breakdown": [calc.to_dict() for calc in overage_calculations],
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_OVERAGE, event_data)
        logger.info(f"Emitted billing:overage for {license_key}: {total_overage}")

    def emit_billing_period_closed(
        self,
        billing_period_id: str,
        license_key: str,
        key_id: str,
        total_amount: Decimal,
        final_usage: Dict[str, Any],
    ) -> None:
        """
        Emit event when billing period is closed.

        Args:
            billing_period_id: Period ID
            license_key: License key
            key_id: Key ID
            total_amount: Final amount
            final_usage: Final usage summary
        """
        event_data = {
            "billing_period_id": billing_period_id,
            "license_key": license_key,
            "key_id": key_id,
            "total_amount": str(total_amount),
            "final_usage": final_usage,
            "status": "closed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_PERIOD_CLOSED, event_data)
        logger.info(f"Emitted billing:period_closed for {license_key}")

    def emit_billing_reconciliation(
        self,
        audit_id: str,
        license_key: str,
        key_id: str,
        audit_date: str,
        expected_amount: Decimal,
        actual_amount: Decimal,
        variance: Decimal,
        variance_percent: float,
        status: str,
        discrepancies: Optional[List[Dict]] = None,
    ) -> None:
        """
        Emit event when reconciliation audit is completed.

        Args:
            audit_id: Audit record ID
            license_key: License key
            key_id: Key ID
            audit_date: Audit date
            expected_amount: Expected amount
            actual_amount: Actual amount
            variance: Variance amount
            variance_percent: Variance percentage
            status: Audit status
            discrepancies: List of discrepancies found
        """
        event_data = {
            "audit_id": audit_id,
            "license_key": license_key,
            "key_id": key_id,
            "audit_date": audit_date,
            "expected_amount": str(expected_amount),
            "actual_amount": str(actual_amount),
            "variance": str(variance),
            "variance_percent": variance_percent,
            "status": status,
            "discrepancies": discrepancies or [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_RECONCILIATION, event_data)
        logger.debug(f"Emitted billing:reconciliation for {license_key}: {status}")

    def emit_billing_batch_processed(
        self,
        batch_result: BatchResult,
        events_count: int,
        processing_duration_ms: int,
    ) -> None:
        """
        Emit event when batch processing is completed.

        Args:
            batch_result: Batch processing result
            events_count: Number of events processed
            processing_duration_ms: Processing duration in milliseconds
        """
        event_data = {
            "batch_id": batch_result.batch_id,
            "license_key": batch_result.license_key,
            "status": batch_result.status.value,
            "is_duplicate": batch_result.is_duplicate,
            "billing_record_id": batch_result.billing_record_id,
            "events_count": events_count,
            "total_charge": str(batch_result.total_charge),
            "processing_duration_ms": processing_duration_ms,
            "error_message": batch_result.error_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_BATCH_PROCESSED, event_data)
        logger.debug(f"Emitted billing:batch_processed for {batch_result.batch_id}")

    def emit_billing_idempotency_conflict(
        self,
        batch_id: str,
        license_key: str,
        original_billing_record_id: str,
        conflict_timestamp: datetime,
    ) -> None:
        """
        Emit event when idempotency conflict is detected.

        Args:
            batch_id: Batch ID
            license_key: License key
            original_billing_record_id: Original billing record ID
            conflict_timestamp: When conflict was detected
        """
        event_data = {
            "batch_id": batch_id,
            "license_key": license_key,
            "original_billing_record_id": original_billing_record_id,
            "conflict_timestamp": conflict_timestamp.isoformat(),
            "action": "rejected_duplicate",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._event_bus.emit(EventType.BILLING_IDEMPOTENCY_CONFLICT, event_data)
        logger.warning(f"Emitted billing:idempotency_conflict for {batch_id}")

    def emit_billing_proration(
        self,
        proration_result: ProrationResult,
        billing_period_id: str,
    ) -> None:
        """
        Emit event when proration is calculated.

        Args:
            proration_result: Proration calculation result
            billing_period_id: Billing period ID
        """
        event_data = proration_result.to_dict()
        event_data["billing_period_id"] = billing_period_id
        event_data["event_type"] = "proration_calculated"

        self._event_bus.emit(EventType.BILLING_RECORDED, event_data)
        logger.debug(
            f"Emitted proration event for {proration_result.license_key}: "
            f"{proration_result.new_plan}"
        )


# Module-level singleton
_emitter: Optional[BillingEventEmitter] = None


def get_emitter() -> BillingEventEmitter:
    """Get or create the billing event emitter singleton."""
    global _emitter
    if _emitter is None:
        _emitter = BillingEventEmitter()
    return _emitter


def reset_emitter() -> None:
    """Reset singleton (for testing)."""
    global _emitter
    _emitter = None


__all__ = [
    "BillingEventEmitter",
    "get_emitter",
    "reset_emitter",
]
