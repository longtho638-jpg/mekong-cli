"""
License Failure Monitor — Phase 2 + Phase 5

Tracks license validation failures with threshold alerting and grace period support.
Emits events to EventBus for real-time monitoring and Telegram alerts.
Triggers auto-recovery on critical license failures (Phase 5).
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, Any, List

from src.core.event_bus import get_event_bus, EventType
from src.core.auto_recovery import RecoveryType, attempt_recovery


@dataclass
class LicenseFailure:
    """
    Represents a single license validation failure.

    Attributes:
        error_code: Error code from validation failure
        timestamp: Unix timestamp of failure
        retry_count: Number of retries attempted
        key_id: License key ID (if available)
        command: Command that triggered validation
        error_message: Human-readable error message
    """
    error_code: str
    timestamp: float
    retry_count: int = 0
    key_id: Optional[str] = None
    command: Optional[str] = None
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "error_code": self.error_code,
            "timestamp": self.timestamp,
            "retry_count": self.retry_count,
            "key_id": self.key_id,
            "command": self.command,
            "error_message": self.error_message,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> LicenseFailure:
        """Create from dictionary."""
        return cls(
            error_code=data["error_code"],
            timestamp=data["timestamp"],
            retry_count=data.get("retry_count", 0),
            key_id=data.get("key_id"),
            command=data.get("command"),
            error_message=data.get("error_message"),
        )


@dataclass
class FailureThreshold:
    """
    Threshold configuration for alerting.

    Default: >3 failures in 5 minutes triggers critical alert.
    """
    max_failures: int = 3
    window_seconds: int = 300  # 5 minutes


class LicenseMonitor:
    """
    Monitor license validation failures with threshold alerting.

    Features:
    - Track failures with metadata (error_code, timestamp, retry_count)
    - Threshold alerting (>3 failures in 5min → emit license:critical)
    - Grace period for new installations (24h)
    - Persist failure history to .mekong/license_failures.json

    Usage:
        monitor = LicenseMonitor()
        monitor.record_failure("invalid_signature", key_id="key_123")
        if monitor.is_critical():
            handle_critical()
    """

    def __init__(
        self,
        storage_path: Optional[str] = None,
        threshold: Optional[FailureThreshold] = None,
        grace_period_hours: int = 24,
    ) -> None:
        """
        Initialize license monitor.

        Args:
            storage_path: Path to failure history JSON file.
                         Defaults to .mekong/license_failures.json
            threshold: Failure threshold configuration.
            grace_period_hours: Grace period for new installations.
        """
        self._storage_path = Path(storage_path) if storage_path else Path(".mekong/license_failures.json")
        self._threshold = threshold or FailureThreshold()
        self._grace_period_hours = grace_period_hours
        self._failures: List[LicenseFailure] = []
        self._installation_time: Optional[float] = None
        self._event_bus = get_event_bus()

        # Load existing failures on init
        self._load_failures()

    def _load_failures(self) -> None:
        """Load failure history from disk."""
        if not self._storage_path.exists():
            return

        try:
            data = json.loads(self._storage_path.read_text())
            self._failures = [LicenseFailure.from_dict(f) for f in data.get("failures", [])]
            self._installation_time = data.get("installation_time")
        except (json.JSONDecodeError, KeyError):
            self._failures = []
            self._installation_time = None

    def _save_failures(self) -> None:
        """Persist failure history to disk."""
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "failures": [f.to_dict() for f in self._failures],
            "installation_time": self._installation_time,
            "updated_at": time.time(),
        }

        self._storage_path.write_text(json.dumps(data, indent=2))

    def record_failure(
        self,
        error_code: str,
        key_id: Optional[str] = None,
        command: Optional[str] = None,
        error_message: Optional[str] = None,
        retry_count: int = 0,
    ) -> None:
        """
        Record a license validation failure.

        Args:
            error_code: Error code from validation
            key_id: License key ID (if known)
            command: Command that triggered validation
            error_message: Human-readable error message
            retry_count: Number of retries attempted

        Side Effects:
            - Emits license:validation_failed event
            - Emits license:critical if threshold exceeded
            - Persists to disk
        """
        failure = LicenseFailure(
            error_code=error_code,
            timestamp=time.time(),
            retry_count=retry_count,
            key_id=key_id,
            command=command,
            error_message=error_message,
        )

        self._failures.append(failure)
        self._prune_old_failures()
        self._save_failures()

        # Emit validation failed event
        self._event_bus.emit(
            EventType.LICENSE_VALIDATION_FAILED,
            data={
                "error_code": error_code,
                "key_id": key_id,
                "command": command,
                "error_message": error_message,
                "timestamp": failure.timestamp,
            },
        )

        # Check threshold and emit critical if exceeded
        if self._is_threshold_exceeded():
            self._emit_critical_alert()

    def _prune_old_failures(self) -> None:
        """Remove failures outside the monitoring window."""
        cutoff = time.time() - (self._threshold.window_seconds * 2)  # Keep 2x window for safety
        self._failures = [f for f in self._failures if f.timestamp > cutoff]

    def _is_threshold_exceeded(self) -> bool:
        """Check if failure threshold is exceeded in the monitoring window."""
        cutoff = time.time() - self._threshold.window_seconds
        recent_failures = [f for f in self._failures if f.timestamp > cutoff]
        return len(recent_failures) >= self._threshold.max_failures

    def _emit_critical_alert(self) -> None:
        """Emit critical alert event and trigger auto-recovery."""
        recent_failures = self.get_recent_failures()

        self._event_bus.emit(
            EventType.LICENSE_CRITICAL,
            data={
                "failure_count": len(recent_failures),
                "window_seconds": self._threshold.window_seconds,
                "failures": [f.to_dict() for f in recent_failures],
                "timestamp": time.time(),
            },
        )

        # Trigger auto-recovery (Phase 5) - safely handle missing event loop
        try:
            asyncio.get_running_loop()
            # Event loop is running - create task
            asyncio.create_task(self._trigger_recovery(recent_failures))
        except RuntimeError:
            # No running loop - run asynchronously in background
            asyncio.run(self._trigger_recovery(recent_failures))
        except Exception:
            # Silently fail - don't break validation flow
            pass

    async def _trigger_recovery(
        self,
        failures: List[LicenseFailure],
    ) -> None:
        """
        Trigger auto-recovery for license failures.

        Args:
            failures: List of recent license failures
        """
        logger = logging.getLogger(__name__)
        logger.info(f"Triggering auto-recovery for license failures ({len(failures)} failures)")

        try:
            result = await attempt_recovery(
                recovery_type=RecoveryType.LICENSE_RECOVERY,
                metadata={
                    "failure_count": len(failures),
                    "error_codes": [f.error_code for f in failures],
                },
            )
            if result.status.value == "success":
                logger.info(
                    f"License recovery succeeded after {result.attempt_number} attempt(s)"
                )
            else:
                logger.error(
                    f"License recovery failed after {result.attempt_number} attempt(s): "
                    f"{result.error_message}"
                )
        except Exception as e:
            logger.error(f"Error triggering license recovery: {e}")

    def is_critical(self) -> bool:
        """
        Check if monitor is in critical state.

        Returns:
            True if threshold exceeded in monitoring window.
        """
        return self._is_threshold_exceeded()

    def get_recent_failures(self) -> List[LicenseFailure]:
        """
        Get failures within the monitoring window.

        Returns:
            List of recent LicenseFailure objects.
        """
        cutoff = time.time() - self._threshold.window_seconds
        return [f for f in self._failures if f.timestamp > cutoff]

    def get_failure_count(self) -> int:
        """Get total failure count (all time)."""
        return len(self._failures)

    def get_failure_count_recent(self) -> int:
        """Get failure count in monitoring window."""
        return len(self.get_recent_failures())

    def is_grace_period_active(self) -> bool:
        """
        Check if grace period is active for new installation.

        Returns:
            True if installation is within grace period (24h).
        """
        if self._installation_time is None:
            # First run - set installation time and activate grace period
            self._installation_time = time.time()
            self._save_failures()

            # Emit grace period event
            self._event_bus.emit(
                EventType.LICENSE_GRACE_PERIOD_ACTIVE,
                data={
                    "grace_period_hours": self._grace_period_hours,
                    "expires_at": self._installation_time + (self._grace_period_hours * 3600),
                    "timestamp": time.time(),
                },
            )
            return True

        elapsed_hours = (time.time() - self._installation_time) / 3600
        return elapsed_hours < self._grace_period_hours

    def get_grace_period_remaining(self) -> Optional[float]:
        """
        Get remaining grace period in seconds.

        Returns:
            Remaining seconds in grace period, or None if expired.
        """
        if self._installation_time is None:
            return self._grace_period_hours * 3600  # Full grace period

        elapsed = time.time() - self._installation_time
        remaining = (self._grace_period_hours * 3600) - elapsed
        return max(0, remaining) if remaining > 0 else None

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get failure statistics for dashboard/monitoring.

        Returns:
            Dictionary with failure statistics.
        """
        recent = self.get_recent_failures()

        # Group by error code
        by_error_code: Dict[str, int] = {}
        for f in recent:
            by_error_code[f.error_code] = by_error_code.get(f.error_code, 0) + 1

        return {
            "total_failures": len(self._failures),
            "recent_failures": len(recent),
            "failures_by_error_code": by_error_code,
            "is_critical": self.is_critical(),
            "grace_period_active": self.is_grace_period_active(),
            "grace_period_remaining_seconds": self.get_grace_period_remaining(),
            "threshold_max_failures": self._threshold.max_failures,
            "threshold_window_seconds": self._threshold.window_seconds,
        }

    def clear_failures(self) -> None:
        """Clear all failure history (use after successful validation)."""
        self._failures = []
        self._save_failures()

    def reset_installation_time(self) -> None:
        """Reset installation time (for testing/redeployment)."""
        self._installation_time = None
        self._save_failures()


# Singleton instance
_monitor: Optional[LicenseMonitor] = None


def get_monitor(
    storage_path: Optional[str] = None,
    threshold: Optional[FailureThreshold] = None,
) -> LicenseMonitor:
    """
    Get or create the shared license monitor singleton.

    Args:
        storage_path: Custom storage path (optional).
        threshold: Custom threshold config (optional).

    Returns:
        LicenseMonitor instance.
    """
    global _monitor
    if _monitor is None:
        _monitor = LicenseMonitor(storage_path=storage_path, threshold=threshold)
    return _monitor


def record_failure(
    error_code: str,
    key_id: Optional[str] = None,
    command: Optional[str] = None,
    error_message: Optional[str] = None,
    retry_count: int = 0,
) -> None:
    """
    Record a license validation failure (convenience function).

    Args:
        error_code: Error code from validation
        key_id: License key ID
        command: Command that triggered validation
        error_message: Error message
        retry_count: Number of retries

    Side Effects:
        - Records failure to global monitor
        - Emits events via EventBus
    """
    get_monitor().record_failure(
        error_code=error_code,
        key_id=key_id,
        command=command,
        error_message=error_message,
        retry_count=retry_count,
    )


__all__ = [
    "LicenseMonitor",
    "LicenseFailure",
    "FailureThreshold",
    "get_monitor",
    "record_failure",
]
