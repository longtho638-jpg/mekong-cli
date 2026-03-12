"""PEV Structured Logger — Phase 7 Telemetry.

Centralized structured logging for all PEV operations.
Outputs JSON-formatted log entries with consistent fields:
  timestamp, level, component, operation, duration_ms, metadata.

Usage:
    from src.core.pev_structured_logger import get_pev_logger
    pev_log = get_pev_logger()
    pev_log.step_started(step_order=1, title="install deps")
    pev_log.step_completed(step_order=1, duration_ms=1200)
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional


@dataclass
class PEVLogEntry:
    """Structured log entry for PEV operations."""

    timestamp: str
    level: str
    component: str
    operation: str
    message: str
    duration_ms: Optional[float] = None
    step_order: Optional[int] = None
    pipeline_id: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> str:
        """Serialize to JSON, omitting None fields."""
        data = {k: v for k, v in asdict(self).items() if v is not None}
        return json.dumps(data, default=str)


class PEVStructuredLogger:
    """Structured logger for Plan-Execute-Verify operations.

    Wraps Python logging with structured JSON output and
    PEV-specific convenience methods.
    """

    COMPONENT_PLANNER = "planner"
    COMPONENT_EXECUTOR = "executor"
    COMPONENT_VERIFIER = "verifier"
    COMPONENT_ORCHESTRATOR = "orchestrator"
    COMPONENT_PIPELINE = "pipeline"

    def __init__(self, logger_name: str = "mekong.pev") -> None:
        self._logger = logging.getLogger(logger_name)
        self._pipeline_id: Optional[str] = None
        self._step_timers: dict[int, float] = {}

    def set_pipeline_id(self, pipeline_id: str) -> None:
        """Set current pipeline context for all subsequent logs."""
        self._pipeline_id = pipeline_id

    def clear_pipeline_id(self) -> None:
        """Clear pipeline context."""
        self._pipeline_id = None

    def _log(
        self,
        level: int,
        component: str,
        operation: str,
        message: str,
        duration_ms: Optional[float] = None,
        step_order: Optional[int] = None,
        **kwargs: Any,
    ) -> PEVLogEntry:
        """Create and emit a structured log entry."""
        entry = PEVLogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=logging.getLevelName(level),
            component=component,
            operation=operation,
            message=message,
            duration_ms=duration_ms,
            step_order=step_order,
            pipeline_id=self._pipeline_id,
            metadata=kwargs if kwargs else {},
        )
        self._logger.log(level, entry.to_json())
        return entry

    # --- Planning operations ---

    def plan_started(self, goal: str, **kwargs: Any) -> PEVLogEntry:
        """Log planning phase start."""
        return self._log(
            logging.INFO,
            self.COMPONENT_PLANNER,
            "plan_started",
            f"Planning started for: {goal}",
            goal=goal,
            **kwargs,
        )

    def plan_completed(
        self, step_count: int, duration_ms: float, **kwargs: Any
    ) -> PEVLogEntry:
        """Log planning phase completion."""
        return self._log(
            logging.INFO,
            self.COMPONENT_PLANNER,
            "plan_completed",
            f"Plan generated with {step_count} steps",
            duration_ms=duration_ms,
            step_count=step_count,
            **kwargs,
        )

    def plan_failed(self, error: str, **kwargs: Any) -> PEVLogEntry:
        """Log planning failure."""
        return self._log(
            logging.ERROR,
            self.COMPONENT_PLANNER,
            "plan_failed",
            f"Planning failed: {error}",
            error=error,
            **kwargs,
        )

    # --- Execution operations ---

    def step_started(self, step_order: int, title: str, **kwargs: Any) -> PEVLogEntry:
        """Log step execution start and begin timer."""
        self._step_timers[step_order] = time.time()
        return self._log(
            logging.INFO,
            self.COMPONENT_EXECUTOR,
            "step_started",
            f"Step {step_order}: {title}",
            step_order=step_order,
            title=title,
            **kwargs,
        )

    def step_completed(
        self,
        step_order: int,
        duration_ms: Optional[float] = None,
        **kwargs: Any,
    ) -> PEVLogEntry:
        """Log step completion. Auto-calculates duration if timer was started."""
        if duration_ms is None and step_order in self._step_timers:
            duration_ms = (time.time() - self._step_timers.pop(step_order)) * 1000
        return self._log(
            logging.INFO,
            self.COMPONENT_EXECUTOR,
            "step_completed",
            f"Step {step_order} completed",
            duration_ms=duration_ms,
            step_order=step_order,
            **kwargs,
        )

    def step_failed(
        self, step_order: int, error: str, **kwargs: Any
    ) -> PEVLogEntry:
        """Log step failure."""
        self._step_timers.pop(step_order, None)
        return self._log(
            logging.ERROR,
            self.COMPONENT_EXECUTOR,
            "step_failed",
            f"Step {step_order} failed: {error}",
            step_order=step_order,
            error=error,
            **kwargs,
        )

    def step_retried(
        self, step_order: int, attempt: int, **kwargs: Any
    ) -> PEVLogEntry:
        """Log step retry attempt."""
        return self._log(
            logging.WARNING,
            self.COMPONENT_EXECUTOR,
            "step_retried",
            f"Step {step_order} retry attempt {attempt}",
            step_order=step_order,
            attempt=attempt,
            **kwargs,
        )

    # --- Verification operations ---

    def verify_started(self, step_order: int, **kwargs: Any) -> PEVLogEntry:
        """Log verification start."""
        return self._log(
            logging.INFO,
            self.COMPONENT_VERIFIER,
            "verify_started",
            f"Verifying step {step_order}",
            step_order=step_order,
            **kwargs,
        )

    def verify_passed(self, step_order: int, **kwargs: Any) -> PEVLogEntry:
        """Log verification passed."""
        return self._log(
            logging.INFO,
            self.COMPONENT_VERIFIER,
            "verify_passed",
            f"Step {step_order} verification passed",
            step_order=step_order,
            **kwargs,
        )

    def verify_failed(
        self, step_order: int, reason: str, **kwargs: Any
    ) -> PEVLogEntry:
        """Log verification failure."""
        return self._log(
            logging.WARNING,
            self.COMPONENT_VERIFIER,
            "verify_failed",
            f"Step {step_order} verification failed: {reason}",
            step_order=step_order,
            reason=reason,
            **kwargs,
        )

    # --- Orchestration operations ---

    def orchestration_started(self, goal: str, **kwargs: Any) -> PEVLogEntry:
        """Log orchestration workflow start."""
        return self._log(
            logging.INFO,
            self.COMPONENT_ORCHESTRATOR,
            "orchestration_started",
            f"Orchestration started: {goal}",
            goal=goal,
            **kwargs,
        )

    def orchestration_completed(
        self, status: str, duration_ms: float, **kwargs: Any
    ) -> PEVLogEntry:
        """Log orchestration completion."""
        level = logging.INFO if status == "success" else logging.WARNING
        return self._log(
            level,
            self.COMPONENT_ORCHESTRATOR,
            "orchestration_completed",
            f"Orchestration {status}",
            duration_ms=duration_ms,
            status=status,
            **kwargs,
        )

    def rollback_triggered(self, reason: str, **kwargs: Any) -> PEVLogEntry:
        """Log rollback trigger."""
        return self._log(
            logging.WARNING,
            self.COMPONENT_ORCHESTRATOR,
            "rollback_triggered",
            f"Rollback triggered: {reason}",
            reason=reason,
            **kwargs,
        )

    # --- Pipeline operations ---

    def pipeline_started(
        self, pipeline_id: str, stage_count: int, **kwargs: Any
    ) -> PEVLogEntry:
        """Log pipeline start."""
        self.set_pipeline_id(pipeline_id)
        return self._log(
            logging.INFO,
            self.COMPONENT_PIPELINE,
            "pipeline_started",
            f"Pipeline {pipeline_id} started with {stage_count} stages",
            stage_count=stage_count,
            **kwargs,
        )

    def pipeline_completed(
        self,
        pipeline_id: str,
        status: str,
        duration_ms: float,
        **kwargs: Any,
    ) -> PEVLogEntry:
        """Log pipeline completion."""
        level = logging.INFO if status == "completed" else logging.WARNING
        entry = self._log(
            level,
            self.COMPONENT_PIPELINE,
            "pipeline_completed",
            f"Pipeline {pipeline_id} {status}",
            duration_ms=duration_ms,
            status=status,
            **kwargs,
        )
        self.clear_pipeline_id()
        return entry


# Singleton
_pev_logger: Optional[PEVStructuredLogger] = None


def get_pev_logger() -> PEVStructuredLogger:
    """Get singleton PEVStructuredLogger instance."""
    global _pev_logger
    if _pev_logger is None:
        _pev_logger = PEVStructuredLogger()
    return _pev_logger
