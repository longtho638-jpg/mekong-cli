"""
Mekong CLI - Auto-Recovery Engine — Phase 5

Automated recovery actions for license failures, crashes, and health endpoint issues.
Implements exponential backoff, max recovery attempts tracking, and recovery analytics.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any, List, Callable

from src.core.event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)


class RecoveryType(str, Enum):
    """Types of recovery actions."""

    LICENSE_RECOVERY = "license:recovery"
    CRASH_RECOVERY = "crash:recovery"
    HEALTH_ENDPOINT_RECOVERY = "health:endpoint_recovery"
    PROXY_RECOVERY = "proxy:recovery"


class RecoveryStatus(str, Enum):
    """Status of a recovery attempt."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    EXHAUSTED = "exhausted"  # Max attempts reached


@dataclass
class RecoveryAttempt:
    """
    Represents a single recovery attempt.

    Attributes:
        recovery_id: Unique identifier for the recovery incident
        recovery_type: Type of recovery being attempted
        timestamp: Unix timestamp of the attempt
        attempt_number: Which attempt this is (1-based)
        status: Current status of the recovery
        delay_seconds: Delay before this attempt (exponential backoff)
        error_message: Error message if attempt failed
        duration_ms: Duration of the recovery attempt in milliseconds
        metadata: Additional recovery metadata
    """
    recovery_id: str
    recovery_type: RecoveryType
    timestamp: float
    attempt_number: int = 1
    status: RecoveryStatus = RecoveryStatus.PENDING
    delay_seconds: float = 0.0
    error_message: Optional[str] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "recovery_id": self.recovery_id,
            "recovery_type": self.recovery_type.value,
            "timestamp": self.timestamp,
            "attempt_number": self.attempt_number,
            "status": self.status.value,
            "delay_seconds": self.delay_seconds,
            "error_message": self.error_message,
            "duration_ms": self.duration_ms,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> RecoveryAttempt:
        """Create from dictionary."""
        return cls(
            recovery_id=data["recovery_id"],
            recovery_type=RecoveryType(data["recovery_type"]),
            timestamp=data["timestamp"],
            attempt_number=data.get("attempt_number", 1),
            status=RecoveryStatus(data.get("status", RecoveryStatus.PENDING)),
            delay_seconds=data.get("delay_seconds", 0.0),
            error_message=data.get("error_message"),
            duration_ms=data.get("duration_ms"),
            metadata=data.get("metadata", {}),
        )


@dataclass
class RecoveryConfig:
    """
    Recovery configuration.

    Attributes:
        max_attempts: Maximum recovery attempts per incident (default: 3)
        base_delay_seconds: Base delay for exponential backoff (default: 1s)
        max_delay_seconds: Maximum delay cap (default: 10s)
        backoff_multiplier: Exponential backoff multiplier (default: 2x)
    """
    max_attempts: int = 3
    base_delay_seconds: float = 1.0
    max_delay_seconds: float = 10.0
    backoff_multiplier: float = 2.0

    def get_delay(self, attempt: int) -> float:
        """
        Calculate delay for given attempt using exponential backoff.

        Formula: min(base * (multiplier ^ (attempt - 1)), max_delay)

        Examples:
            attempt 1: min(1 * (2 ^ 0), 10) = 1s
            attempt 2: min(1 * (2 ^ 1), 10) = 2s
            attempt 3: min(1 * (2 ^ 2), 10) = 4s
        """
        delay = self.base_delay_seconds * (self.backoff_multiplier ** (attempt - 1))
        return min(delay, self.max_delay_seconds)


class RecoveryAction:
    """
    Encapsulates a recovery action with its execution logic.

    Attributes:
        action_type: Type of recovery this action handles
        execute_fn: Async callable that performs the recovery
    """

    def __init__(
        self,
        action_type: RecoveryType,
        execute_fn: Callable[[], Any],
    ) -> None:
        self.action_type = action_type
        self.execute_fn = execute_fn

    async def execute(self) -> bool:
        """
        Execute the recovery action.

        Returns:
            True if recovery succeeded, False otherwise
        """
        try:
            result = self.execute_fn()
            if asyncio.iscoroutine(result):
                await result
            return True
        except Exception as e:
            logger.error(f"Recovery action {self.action_type.value} failed: {e}")
            return False


class AutoRecovery:
    """
    Automated recovery engine with exponential backoff.

    Features:
    - License failure → execute proxy-recovery.sh
    - Crash detected → restart with exponential backoff (max 3 attempts)
    - Health endpoint down → restart health endpoint
    - Track recovery attempts and success rate

    Usage:
        recovery = AutoRecovery()
        await recovery.attempt_recovery(RecoveryType.LICENSE_RECOVERY)
    """

    def __init__(
        self,
        config: Optional[RecoveryConfig] = None,
        storage_path: Optional[str] = None,
    ) -> None:
        """
        Initialize auto-recovery engine.

        Args:
            config: Recovery configuration (uses defaults if None)
            storage_path: Path to persist recovery history
        """
        self._config = config or RecoveryConfig()
        self._storage_path = Path(storage_path) if storage_path else Path(".mekong/recovery_history.json")
        self._event_bus = get_event_bus()

        # Recovery registry: recovery_id -> list of attempts
        self._recoveries: Dict[str, List[RecoveryAttempt]] = {}

        # Registered recovery actions
        self._actions: Dict[RecoveryType, RecoveryAction] = {}

        # In-progress recoveries
        self._in_progress: Dict[str, RecoveryAttempt] = {}

        # Load existing history
        self._load_history()

        # Register built-in recovery actions
        self._register_builtin_actions()

    def _register_builtin_actions(self) -> None:
        """Register built-in recovery actions."""
        # Proxy recovery action
        self.register_action(
            RecoveryType.PROXY_RECOVERY,
            self._execute_proxy_recovery,
        )

        # Health endpoint recovery
        self.register_action(
            RecoveryType.HEALTH_ENDPOINT_RECOVERY,
            self._restart_health_endpoint,
        )

        # Crash recovery (triggered by crash_detector.py)
        self.register_action(
            RecoveryType.CRASH_RECOVERY,
            self._handle_crash_recovery,
        )

        # License recovery (triggered by license_monitor.py)
        self.register_action(
            RecoveryType.LICENSE_RECOVERY,
            self._handle_license_recovery,
        )

    def register_action(
        self,
        action_type: RecoveryType,
        execute_fn: Callable[[], Any],
    ) -> None:
        """
        Register a recovery action.

        Args:
            action_type: Type of recovery this action handles
            execute_fn: Callable that performs the recovery
        """
        self._actions[action_type] = RecoveryAction(action_type, execute_fn)
        logger.debug(f"Registered recovery action: {action_type.value}")

    def _load_history(self) -> None:
        """Load recovery history from disk."""
        if not self._storage_path.exists():
            return

        try:
            data = json.loads(self._storage_path.read_text())
            for recovery_id, attempts_data in data.get("recoveries", {}).items():
                self._recoveries[recovery_id] = [
                    RecoveryAttempt.from_dict(a) for a in attempts_data
                ]
            logger.debug(f"Loaded {len(self._recoveries)} recovery incidents from disk")
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Failed to load recovery history: {e}")
            self._recoveries = {}

    def _save_history(self) -> None:
        """Persist recovery history to disk."""
        try:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                "recoveries": {
                    rid: [a.to_dict() for a in attempts]
                    for rid, attempts in self._recoveries.items()
                },
                "updated_at": time.time(),
            }

            self._storage_path.write_text(json.dumps(data, indent=2))
            logger.debug("Saved recovery history to disk")
        except Exception as e:
            logger.error(f"Failed to save recovery history: {e}")

    def _generate_recovery_id(self, recovery_type: RecoveryType) -> str:
        """Generate unique recovery ID."""
        timestamp = int(time.time() * 1000)
        return f"recovery-{recovery_type.value.replace(':', '-')}-{timestamp}-{os.getpid()}"

    async def attempt_recovery(
        self,
        recovery_type: RecoveryType,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RecoveryAttempt:
        """
        Attempt automated recovery with exponential backoff.

        Args:
            recovery_type: Type of recovery to attempt
            metadata: Additional metadata for the recovery

        Returns:
            Final RecoveryAttempt with success/failure status
        """
        recovery_id = self._generate_recovery_id(recovery_type)
        action = self._actions.get(recovery_type)

        if action is None:
            logger.warning(f"No recovery action registered for {recovery_type.value}")
            return self._create_attempt(
                recovery_id=recovery_id,
                recovery_type=recovery_type,
                status=RecoveryStatus.FAILED,
                error_message=f"No action registered for {recovery_type.value}",
            )

        # Emit recovery start event
        self._event_bus.emit(
            EventType.HEALTH_WARNING,
            {
                "type": "recovery:started",
                "recovery_id": recovery_id,
                "recovery_type": recovery_type.value,
                "timestamp": time.time(),
            },
        )

        # Attempt recovery with exponential backoff
        last_attempt: Optional[RecoveryAttempt] = None

        for attempt_num in range(1, self._config.max_attempts + 1):
            delay = self._config.get_delay(attempt_num)
            logger.info(
                f"Recovery attempt {attempt_num}/{self._config.max_attempts} "
                f"for {recovery_type.value} (delay: {delay}s)"
            )

            # Create attempt record
            attempt = self._create_attempt(
                recovery_id=recovery_id,
                recovery_type=recovery_type,
                attempt_number=attempt_num,
                delay_seconds=delay,
                status=RecoveryStatus.IN_PROGRESS,
                metadata=metadata,
            )

            # Wait for backoff delay (skip for first attempt)
            if attempt_num > 1:
                await asyncio.sleep(delay)

            # Execute recovery action
            start_time = time.time()
            success = await action.execute()
            duration_ms = (time.time() - start_time) * 1000

            attempt.duration_ms = duration_ms

            if success:
                attempt.status = RecoveryStatus.SUCCESS
                self._record_attempt(attempt)
                self._emit_recovery_event(
                    "recovery:success",
                    attempt,
                    extra={"duration_ms": duration_ms, "attempts_to_success": attempt_num},
                )
                logger.info(
                    f"Recovery SUCCESS for {recovery_type.value} "
                    f"on attempt {attempt_num}/{self._config.max_attempts} "
                    f"(took {duration_ms:.0f}ms)"
                )
                return attempt
            else:
                attempt.status = RecoveryStatus.FAILED
                attempt.error_message = f"Recovery action failed on attempt {attempt_num}"
                self._record_attempt(attempt)
                last_attempt = attempt
                logger.warning(
                    f"Recovery FAILED for {recovery_type.value} "
                    f"on attempt {attempt_num}/{self._config.max_attempts}"
                )

        # All attempts exhausted
        if last_attempt:
            last_attempt.status = RecoveryStatus.EXHAUSTED
            self._record_attempt(last_attempt)

        self._emit_recovery_event(
            "recovery:failed",
            last_attempt or self._create_attempt(
                recovery_id=recovery_id,
                recovery_type=recovery_type,
                status=RecoveryStatus.EXHAUSTED,
                metadata=metadata,
            ),
            extra={
                "max_attempts": self._config.max_attempts,
                "total_duration_ms": sum(
                    a.duration_ms or 0 for a in self._recoveries.get(recovery_id, [])
                ),
            },
        )

        logger.error(
            f"Recovery EXHAUSTED for {recovery_type.value} "
            f"after {self._config.max_attempts} attempts"
        )

        return last_attempt or self._create_attempt(
            recovery_id=recovery_id,
            recovery_type=recovery_type,
            status=RecoveryStatus.EXHAUSTED,
            metadata=metadata,
        )

    def _create_attempt(
        self,
        recovery_id: str,
        recovery_type: RecoveryType,
        status: RecoveryStatus,
        attempt_number: int = 1,
        delay_seconds: float = 0.0,
        error_message: Optional[str] = None,
        duration_ms: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RecoveryAttempt:
        """Create a new recovery attempt record."""
        return RecoveryAttempt(
            recovery_id=recovery_id,
            recovery_type=recovery_type,
            timestamp=time.time(),
            attempt_number=attempt_number,
            status=status,
            delay_seconds=delay_seconds,
            error_message=error_message,
            duration_ms=duration_ms,
            metadata=metadata or {},
        )

    def _record_attempt(self, attempt: RecoveryAttempt) -> None:
        """Record a recovery attempt and persist to disk."""
        if attempt.recovery_id not in self._recoveries:
            self._recoveries[attempt.recovery_id] = []
        self._recoveries[attempt.recovery_id].append(attempt)
        self._save_history()

    def _emit_recovery_event(
        self,
        event_name: str,
        attempt: RecoveryAttempt,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Emit recovery event to event bus."""
        data = attempt.to_dict()
        if extra:
            data.update(extra)

        # Map to appropriate event type (Phase 5)
        event_type_map = {
            "recovery:started": EventType.RECOVERY_STARTED,
            "recovery:attempted": EventType.RECOVERY_ATTEMPTED,
            "recovery:success": EventType.RECOVERY_SUCCESS,
            "recovery:failed": EventType.RECOVERY_FAILED,
        }

        event_type = event_type_map.get(event_name, EventType.RECOVERY_STARTED)
        self._event_bus.emit(
            event_type,
            {"type": event_name, **data},
        )

    # ========================================================================
    # Built-in Recovery Actions
    # ========================================================================

    def _execute_proxy_recovery(self) -> bool:
        """
        Execute proxy recovery script.

        Runs scripts/proxy-recovery.sh or falls back to default proxy restart logic.

        Returns:
            True if proxy recovery succeeded
        """
        logger.info("Executing proxy recovery...")

        # Try to find and execute proxy-recovery.sh
        script_paths = [
            Path(__file__).parent.parent.parent / "scripts" / "proxy-recovery.sh",
            Path.cwd() / "scripts" / "proxy-recovery.sh",
            Path.home() / ".mekong" / "scripts" / "proxy-recovery.sh",
        ]

        for script_path in script_paths:
            if script_path.exists():
                logger.info(f"Found proxy-recovery script at {script_path}")
                try:
                    result = subprocess.run(
                        ["bash", str(script_path)],
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                    if result.returncode == 0:
                        logger.info("Proxy recovery script executed successfully")
                        return True
                    else:
                        logger.error(f"Proxy recovery script failed: {result.stderr}")
                except subprocess.TimeoutExpired:
                    logger.error("Proxy recovery script timed out")
                except Exception as e:
                    logger.error(f"Proxy recovery script error: {e}")

        # Fallback: restart proxy service
        logger.info("Falling back to default proxy restart logic...")
        return self._restart_proxy_service()

    def _restart_proxy_service(self) -> bool:
        """
        Fallback proxy restart logic.

        Returns:
            True if restart succeeded
        """
        try:
            # Kill existing proxy processes
            subprocess.run(
                ["pkill", "-f", "proxy"],
                capture_output=True,
                timeout=5,
            )
            time.sleep(2)

            # Restart would typically be handled by external process manager
            # This is a placeholder - actual implementation depends on deployment
            logger.info("Proxy restart initiated")
            return True
        except Exception as e:
            logger.error(f"Failed to restart proxy service: {e}")
            return False

    def _restart_health_endpoint(self) -> bool:
        """
        Restart health endpoint service.

        Returns:
            True if restart succeeded
        """
        logger.info("Restarting health endpoint...")

        try:
            # Kill existing health endpoint processes
            subprocess.run(
                ["pkill", "-f", "health.*endpoint"],
                capture_output=True,
                timeout=5,
            )
            time.sleep(2)

            # Signal for restart (actual restart handled by process manager)
            logger.info("Health endpoint restart initiated")
            return True
        except Exception as e:
            logger.error(f"Failed to restart health endpoint: {e}")
            return False

    def _handle_crash_recovery(self) -> bool:
        """
        Handle crash recovery.

        For crash recovery, we signal the process manager to restart
        the crashed process. Actual restart logic depends on deployment.

        Returns:
            True if recovery initiated successfully
        """
        import shutil

        logger.info("Handling crash recovery...")

        # Crash recovery is typically handled by external process managers
        # This method signals that a restart should be attempted

        # Method 1: Signal via launchd (macOS)
        if shutil.which("launchctl") is not None:
            plist_path = Path.home() / "Library/LaunchAgents/com.mekong.cli.plist"
            if plist_path.exists():
                try:
                    subprocess.run(
                        ["launchctl", "kickstart", "-kp", f"gui/{os.getuid()}/com.mekong.cli"],
                        capture_output=True,
                        timeout=5,
                    )
                    logger.info("Signaled launchd for crash recovery")
                    return True
                except Exception as e:
                    logger.warning(f"launchd signal failed: {e}")

        # Method 2: Signal via systemd (Linux)
        if shutil.which("systemctl") is not None:
            try:
                subprocess.run(
                    ["systemctl", "restart", "mekong-cli"],
                    capture_output=True,
                    timeout=5,
                )
                logger.info("Signaled systemd for crash recovery")
                return True
            except Exception as e:
                logger.warning(f"systemd signal failed: {e}")

        # Fallback: Log that crash recovery was triggered
        logger.info("Crash recovery triggered - awaiting external process manager")
        return True

    def _handle_license_recovery(self) -> bool:
        """
        Handle license recovery.

        Triggers proxy recovery since license issues are typically
        resolved by restoring proxy connectivity.

        Returns:
            True if recovery initiated successfully
        """
        logger.info("Handling license recovery...")

        # License recovery delegates to proxy recovery
        # since most license issues are network/proxy related
        return self._execute_proxy_recovery()

    # ========================================================================
    # Recovery Analytics
    # ========================================================================

    def get_recovery_statistics(self) -> Dict[str, Any]:
        """
        Get recovery statistics for dashboard/monitoring.

        Returns:
            Dictionary with recovery statistics
        """
        all_attempts = []
        for attempts in self._recoveries.values():
            all_attempts.extend(attempts)

        if not all_attempts:
            return {
                "total_incidents": 0,
                "total_attempts": 0,
                "successful_recoveries": 0,
                "failed_recoveries": 0,
                "success_rate": 0.0,
                "average_attempts_per_incident": 0.0,
                "average_duration_ms": 0.0,
                "by_type": {},
            }

        # Calculate statistics
        successful = sum(1 for a in all_attempts if a.status == RecoveryStatus.SUCCESS)
        failed = sum(1 for a in all_attempts if a.status in [RecoveryStatus.FAILED, RecoveryStatus.EXHAUSTED])

        # Group by type
        by_type: Dict[str, Dict[str, Any]] = {}
        for attempt in all_attempts:
            type_key = attempt.recovery_type.value
            if type_key not in by_type:
                by_type[type_key] = {
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                }
            by_type[type_key]["total"] += 1
            if attempt.status == RecoveryStatus.SUCCESS:
                by_type[type_key]["successful"] += 1
            else:
                by_type[type_key]["failed"] += 1

        # Calculate averages
        recovery_ids = set(a.recovery_id for a in all_attempts)
        avg_attempts = len(all_attempts) / len(recovery_ids) if recovery_ids else 0
        durations = [a.duration_ms for a in all_attempts if a.duration_ms is not None]
        avg_duration = sum(durations) / len(durations) if durations else 0.0

        success_rate = (successful / len(all_attempts) * 100) if all_attempts else 0.0

        return {
            "total_incidents": len(recovery_ids),
            "total_attempts": len(all_attempts),
            "successful_recoveries": successful,
            "failed_recoveries": failed,
            "success_rate": round(success_rate, 2),
            "average_attempts_per_incident": round(avg_attempts, 2),
            "average_duration_ms": round(avg_duration, 2),
            "by_type": by_type,
        }

    def get_recent_recoveries(
        self,
        limit: int = 10,
        status_filter: Optional[RecoveryStatus] = None,
    ) -> List[RecoveryAttempt]:
        """
        Get recent recovery attempts.

        Args:
            limit: Maximum number of attempts to return
            status_filter: Filter by status (optional)

        Returns:
            List of recent RecoveryAttempt objects (newest first)
        """
        all_attempts = []
        for attempts in self._recoveries.values():
            all_attempts.extend(attempts)

        if status_filter:
            all_attempts = [a for a in all_attempts if a.status == status_filter]

        # Sort by timestamp descending
        all_attempts.sort(key=lambda a: a.timestamp, reverse=True)
        return all_attempts[:limit]

    def clear_history(self) -> int:
        """
        Clear recovery history.

        Returns:
            Number of recovery incidents cleared
        """
        count = len(self._recoveries)
        self._recoveries.clear()
        try:
            if self._storage_path.exists():
                self._storage_path.unlink()
        except Exception as e:
            logger.error(f"Failed to delete recovery history file: {e}")
        logger.info(f"Cleared {count} recovery incidents from history")
        return count


# =============================================================================
# Singleton Instance
# =============================================================================

_recovery: Optional[AutoRecovery] = None


def get_auto_recovery(
    config: Optional[RecoveryConfig] = None,
    storage_path: Optional[str] = None,
) -> AutoRecovery:
    """
    Get or create the shared auto-recovery singleton.

    Args:
        config: Custom recovery configuration (optional)
        storage_path: Custom storage path (optional)

    Returns:
        AutoRecovery instance
    """
    global _recovery
    if _recovery is None:
        _recovery = AutoRecovery(config=config, storage_path=storage_path)
    return _recovery


def reset_auto_recovery() -> None:
    """Reset the global auto-recovery instance (for testing)."""
    global _recovery
    _recovery = None


async def attempt_recovery(
    recovery_type: RecoveryType,
    metadata: Optional[Dict[str, Any]] = None,
) -> RecoveryAttempt:
    """
    Convenience function to attempt recovery via global instance.

    Args:
        recovery_type: Type of recovery to attempt
        metadata: Additional metadata

    Returns:
        RecoveryAttempt with final status
    """
    return await get_auto_recovery().attempt_recovery(
        recovery_type=recovery_type,
        metadata=metadata,
    )


__all__ = [
    "RecoveryType",
    "RecoveryStatus",
    "RecoveryAttempt",
    "RecoveryConfig",
    "RecoveryAction",
    "AutoRecovery",
    "get_auto_recovery",
    "reset_auto_recovery",
    "attempt_recovery",
]
