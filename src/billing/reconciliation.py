"""
Mekong CLI - Reconciliation Service

Nightly audit service for variance detection and double-billing prevention.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from src.db.repository import LicenseRepository, get_repository
from src.billing.engine import BillingEngine, get_engine
from src.core.event_bus import get_event_bus, EventType

logger = logging.getLogger(__name__)


@dataclass
class AuditResult:
    """Result of reconciliation audit."""

    audit_id: str
    license_key: str
    key_id: str
    audit_date: date
    expected_amount: Decimal
    actual_amount: Decimal
    variance: Decimal
    variance_percent: float
    status: str  # 'matched', 'variance', 'investigating', 'resolved'
    discrepancies: List[Dict[str, Any]] = field(default_factory=list)
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = None

    def __post_init__(self) -> None:
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "audit_id": self.audit_id,
            "license_key": self.license_key,
            "key_id": self.key_id,
            "audit_date": self.audit_date.isoformat(),
            "expected_amount": str(self.expected_amount),
            "actual_amount": str(self.actual_amount),
            "variance": str(self.variance),
            "variance_percent": self.variance_percent,
            "status": self.status,
            "discrepancies": self.discrepancies,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class ReconciliationConfig:
    """Configuration for reconciliation service."""

    variance_threshold_percent: float = 5.0  # Alert if variance > 5%
    auto_resolve_threshold_percent: float = 0.5  # Auto-resolve if < 0.5%
    max_discrepancies: int = 100
    retention_days: int = 90


class ReconciliationService:
    """
    Nightly reconciliation service for billing audit.

    Responsibilities:
    - Compare expected vs actual billing amounts
    - Detect discrepancies (missing events, double-charges)
    - Log audit results to database
    - Alert on variance > threshold
    - Auto-resolve minor variances
    """

    def __init__(
        self,
        repository: Optional[LicenseRepository] = None,
        billing_engine: Optional[BillingEngine] = None,
        config: Optional[ReconciliationConfig] = None,
    ) -> None:
        self._repo = repository or get_repository()
        self._engine = billing_engine or get_engine()
        self._event_bus = get_event_bus()
        self._config = config or ReconciliationConfig()

    async def run_daily_reconciliation(
        self,
        audit_date: Optional[date] = None,
    ) -> List[AuditResult]:
        """
        Run daily reconciliation for all active licenses.

        Args:
            audit_date: Date to audit (defaults to yesterday)

        Returns:
            List of AuditResult for each license
        """
        if audit_date is None:
            # Default to yesterday (allow today's batch processing to complete)
            audit_date = date.today() - timedelta(days=1)

        logger.info(f"Starting daily reconciliation for {audit_date}")

        # Get all active licenses
        licenses = await self._get_active_licenses()

        results: List[AuditResult] = []

        for license_info in licenses:
            license_key = license_info["license_key"]
            key_id = license_info["key_id"]

            try:
                result = await self._reconcile_license(
                    license_key=license_key,
                    key_id=key_id,
                    audit_date=audit_date,
                )
                results.append(result)

                # Emit event
                self._emit_reconciliation_event(result)

                # Log if variance detected
                if result.status != "matched":
                    logger.warning(
                        f"Reconciliation variance for {license_key}: "
                        f"{result.variance_percent:.2f}%"
                    )

            except Exception as e:
                logger.error(
                    f"Reconciliation failed for {license_key}: {e}"
                )
                # Create error audit record
                results.append(AuditResult(
                    audit_id=f"audit_{license_key}_{audit_date}_error",
                    license_key=license_key,
                    key_id=key_id,
                    audit_date=audit_date,
                    expected_amount=Decimal(0),
                    actual_amount=Decimal(0),
                    variance=Decimal(0),
                    variance_percent=0,
                    status="investigating",
                    discrepancies=[{"error": str(e)}],
                    details={"reconciliation_error": str(e)},
                ))

        logger.info(
            f"Daily reconciliation complete: {len(results)} licenses audited"
        )
        return results

    async def _reconcile_license(
        self,
        license_key: str,
        key_id: str,
        audit_date: date,
    ) -> AuditResult:
        """
        Reconcile billing for a single license.

        Args:
            license_key: License key
            key_id: Key ID
            audit_date: Date to audit

        Returns:
            AuditResult
        """
        # Calculate expected amount from usage events
        expected_amount = await self._calculate_expected_amount(
            license_key=license_key,
            audit_date=audit_date,
        )

        # Get actual billed amount from billing_records
        actual_amount = await self._get_actual_billed_amount(
            license_key=license_key,
            audit_date=audit_date,
        )

        # Calculate variance
        variance = actual_amount - expected_amount
        variance_percent = 0.0
        if expected_amount > 0:
            variance_percent = float(abs(variance) / expected_amount * 100)
        elif actual_amount > 0:
            variance_percent = 100.0  # Everything is variance if expected is 0

        # Determine status
        status, discrepancies = self._determine_status(
            expected_amount=expected_amount,
            actual_amount=actual_amount,
            variance=variance,
            variance_percent=variance_percent,
        )

        # Create audit record
        audit_id = f"audit_{license_key}_{audit_date}"
        result = AuditResult(
            audit_id=audit_id,
            license_key=license_key,
            key_id=key_id,
            audit_date=audit_date,
            expected_amount=round(expected_amount, 2),
            actual_amount=round(actual_amount, 2),
            variance=round(variance, 2),
            variance_percent=round(variance_percent, 2),
            status=status,
            discrepancies=discrepancies,
            details={
                "calculation_method": "usage_events_vs_billing_records",
                "auto_resolved": status == "matched" and variance_percent < self._config.auto_resolve_threshold_percent,
            },
        )

        # Save to database
        await self._save_audit_result(result)

        return result

    async def _calculate_expected_amount(
        self,
        license_key: str,
        audit_date: date,
    ) -> Decimal:
        """
        Calculate expected amount from usage events.

        Args:
            license_key: License key
            audit_date: Date to audit

        Returns:
            Expected charge amount
        """
        start_dt = datetime.combine(audit_date, datetime.min.time())
        end_dt = start_dt + timedelta(days=1)

        # Get usage events for the day
        events = await self._repo.get_usage_events(
            license_key=license_key,
            start_date=start_dt,
            end_date=end_dt,
        )

        if not events:
            return Decimal(0)

        # Convert to usage event objects for billing engine
        from src.core.usage_metering import UsageEvent, UsageEventType

        usage_events = []
        for e in events:
            usage_events.append(
                UsageEvent(
                    event_type=e.get("event_type", "usage:api_call"),
                    category="usage",
                    metric=e.get("metric", "requests"),
                    value=e.get("value", 0),
                    timestamp=e["timestamp"].timestamp() if isinstance(e["timestamp"], datetime) else e["timestamp"],
                    metadata=e.get("metadata", {}),
                )
            )

        # Calculate expected charges
        billing_result = await self._engine.calculate_charges(
            license_key=license_key,
            usage_events=usage_events,
            period_start=start_dt,
            period_end=end_dt,
        )

        return billing_result.total

    async def _get_actual_billed_amount(
        self,
        license_key: str,
        audit_date: date,
    ) -> Decimal:
        """
        Get actual billed amount from billing_records.

        Args:
            license_key: License key
            audit_date: Date to audit

        Returns:
            Actual billed amount
        """
        # Query would be added to repository:
        # SELECT SUM(amount) FROM billing_records
        # WHERE license_key = $1 AND DATE(created_at) = $2
        # This is a placeholder - actual implementation needs repository method

        # For now, return 0 - this would be implemented with a new repository method
        return Decimal(0)

    def _determine_status(
        self,
        expected_amount: Decimal,
        actual_amount: Decimal,
        variance: Decimal,
        variance_percent: float,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Determine audit status and discrepancies.

        Args:
            expected_amount: Expected amount
            actual_amount: Actual amount
            variance: Variance amount
            variance_percent: Variance percentage

        Returns:
            Tuple of (status, discrepancies)
        """
        discrepancies = []

        # Auto-resolve minor variances
        if variance_percent < self._config.auto_resolve_threshold_percent:
            return "matched", []

        # Check if within acceptable threshold
        if variance_percent <= self._config.variance_threshold_percent:
            return "matched", []

        # Variance detected - determine type
        if variance > 0:
            discrepancies.append({
                "type": "over_billing",
                "description": f"Actual (${actual_amount}) exceeds expected (${expected_amount})",
                "variance": str(variance),
                "variance_percent": variance_percent,
            })
        else:
            discrepancies.append({
                "type": "under_billing",
                "description": f"Expected (${expected_amount}) exceeds actual (${actual_amount})",
                "variance": str(variance),
                "variance_percent": variance_percent,
            })

        # Limit discrepancies
        if len(discrepancies) > self._config.max_discrepancies:
            discrepancies = discrepancies[: self._config.max_discrepancies]

        return "variance", discrepancies

    async def _save_audit_result(self, result: AuditResult) -> None:
        """Save audit result to database."""
        await self._repo.create_reconciliation_audit(
            audit_date=result.audit_date,
            license_key=result.license_key,
            key_id=result.key_id,
            expected_amount=result.expected_amount,
            actual_amount=result.actual_amount,
            variance=result.variance,
            discrepancies=result.discrepancies,
            status=result.status,
            notes=f"Variance: {result.variance_percent:.2f}%",
        )

    def _emit_reconciliation_event(self, result: AuditResult) -> None:
        """Emit reconciliation event."""
        event_data = result.to_dict()
        self._event_bus.emit(EventType.BILLING_RECONCILIATION, event_data)

    async def get_audit_history(
        self,
        license_key: str,
        start_date: date,
        end_date: date,
    ) -> List[Dict[str, Any]]:
        """
        Get audit history for a license.

        Args:
            license_key: License key
            start_date: Start date
            end_date: End date

        Returns:
            List of audit records
        """
        # This would require a new repository method
        # SELECT * FROM reconciliation_audits
        # WHERE license_key = $1 AND audit_date BETWEEN $2 AND $3
        return []

    async def resolve_audit(
        self,
        audit_id: str,
        resolved_by: str,
        notes: str,
    ) -> bool:
        """
        Mark an audit as resolved.

        Args:
            audit_id: Audit ID
            resolved_by: User resolving
            notes: Resolution notes

        Returns:
            True if successful
        """
        # This would require a new repository method
        logger.info(f"Audit {audit_id} resolved by {resolved_by}: {notes}")
        return True


# Module-level singleton
_service: Optional[ReconciliationService] = None


def get_reconciliation_service() -> ReconciliationService:
    """Get or create the reconciliation service singleton."""
    global _service
    if _service is None:
        _service = ReconciliationService()
    return _service


def reset_reconciliation_service() -> None:
    """Reset singleton (for testing)."""
    global _service
    _service = None


__all__ = [
    "AuditResult",
    "ReconciliationConfig",
    "ReconciliationService",
    "get_reconciliation_service",
    "reset_reconciliation_service",
]
