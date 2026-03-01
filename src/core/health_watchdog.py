"""
Mekong CLI - Health Watchdog Engine

Cascading quality gates with hysteresis, inspired by Netdata's health engine.
Evaluates execution results against configurable thresholds with warning/critical
severity levels and flap protection.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from .event_bus import EventType, get_event_bus


class AlertSeverity(str, Enum):
    """Alert severity levels (Netdata-style cascade)."""

    CLEAR = "clear"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class HealthCheck:
    """A single health check definition with cascading thresholds."""

    name: str
    description: str
    check_fn: Callable[..., float]
    warning_threshold: float = 80.0
    critical_threshold: float = 95.0
    hysteresis: float = 5.0
    unit: str = "%"
    every_seconds: int = 10

    def evaluate(self, value: float, previous: "AlertSeverity") -> "AlertSeverity":
        """Evaluate value against thresholds with hysteresis to prevent flapping."""
        if value >= self.critical_threshold:
            return AlertSeverity.CRITICAL
        # Critical hysteresis: stay critical if value only dipped slightly
        if previous == AlertSeverity.CRITICAL and value > (self.critical_threshold - self.hysteresis):
            return AlertSeverity.CRITICAL
        if value >= self.warning_threshold:
            return AlertSeverity.WARNING
        # Warning hysteresis: stay warning if value only dipped slightly
        if previous == AlertSeverity.WARNING and value > (self.warning_threshold - self.hysteresis):
            return AlertSeverity.WARNING
        return AlertSeverity.CLEAR


@dataclass
class AlertState:
    """Current state of an alert with history tracking."""

    check_name: str
    severity: AlertSeverity = AlertSeverity.CLEAR
    value: float = 0.0
    last_evaluated: float = field(default_factory=time.time)
    transitions: int = 0


@dataclass
class WatchdogReport:
    """Report from a watchdog evaluation cycle."""

    alerts: List[AlertState] = field(default_factory=list)
    total_checks: int = 0
    warnings: int = 0
    criticals: int = 0
    timestamp: float = field(default_factory=time.time)

    @property
    def healthy(self) -> bool:
        """True if no warnings or criticals."""
        return self.criticals == 0 and self.warnings == 0


class HealthWatchdog:
    """
    Cascading health watchdog engine.

    Inspired by Netdata's health engine: configurable thresholds,
    hysteresis for flap protection, and event bus integration.
    """

    def __init__(self) -> None:
        """Initialize watchdog with empty check registry."""
        self._checks: Dict[str, HealthCheck] = {}
        self._states: Dict[str, AlertState] = {}
        self._event_bus = get_event_bus()

    def register(self, check: HealthCheck) -> None:
        """Register a health check."""
        self._checks[check.name] = check
        if check.name not in self._states:
            self._states[check.name] = AlertState(check_name=check.name)

    def unregister(self, name: str) -> bool:
        """Unregister a health check by name."""
        removed = self._checks.pop(name, None) is not None
        self._states.pop(name, None)
        return removed

    def evaluate(self, context: Optional[Dict[str, Any]] = None) -> WatchdogReport:
        """
        Run all registered health checks and return report.

        Args:
            context: Optional context dict passed to check functions.

        Returns:
            WatchdogReport with alert states and summary.
        """
        report = WatchdogReport(total_checks=len(self._checks))
        ctx = context or {}

        for name, check in self._checks.items():
            state = self._states.get(name, AlertState(check_name=name))
            previous = state.severity

            try:
                value = check.check_fn(ctx)
            except Exception:
                value = 100.0  # Treat errors as critical

            new_severity = check.evaluate(value, previous)

            # Track transitions
            if new_severity != previous:
                state.transitions += 1
                self._event_bus.emit(
                    EventType.PATTERN_DETECTED,
                    {"check": name, "from": previous.value, "to": new_severity.value,
                     "value": value},
                )

            state.severity = new_severity
            state.value = value
            state.last_evaluated = time.time()
            self._states[name] = state

            report.alerts.append(state)
            if new_severity == AlertSeverity.WARNING:
                report.warnings += 1
            elif new_severity == AlertSeverity.CRITICAL:
                report.criticals += 1

        return report

    def get_state(self, name: str) -> Optional[AlertState]:
        """Get current alert state for a check."""
        return self._states.get(name)

    def list_checks(self) -> List[str]:
        """List all registered check names."""
        return list(self._checks.keys())

    def clear(self) -> None:
        """Clear all checks and states."""
        self._checks.clear()
        self._states.clear()


# Built-in quality gate checks (Binh Phap fronts)

def check_success_rate(ctx: Dict[str, Any]) -> float:
    """Check execution success rate (inverted: 100 = all failing)."""
    total = ctx.get("total_steps", 0)
    failed = ctx.get("failed_steps", 0)
    if total == 0:
        return 0.0
    return (failed / total) * 100.0


def check_step_duration(ctx: Dict[str, Any]) -> float:
    """Check if step duration exceeds budget (% of budget used)."""
    actual = ctx.get("duration_seconds", 0.0)
    budget = ctx.get("duration_budget", 60.0)
    if budget <= 0:
        return 0.0
    return min((actual / budget) * 100.0, 100.0)


def check_error_count(ctx: Dict[str, Any]) -> float:
    """Check error count as percentage of max tolerable."""
    errors = ctx.get("error_count", 0)
    max_errors = ctx.get("max_errors", 5)
    if max_errors <= 0:
        return 0.0
    return min((errors / max_errors) * 100.0, 100.0)


# Default watchdog factory with Binh Phap quality gates
def create_default_watchdog() -> HealthWatchdog:
    """Create a watchdog with default Binh Phap quality gate checks."""
    wd = HealthWatchdog()
    wd.register(HealthCheck(
        name="success_rate",
        description="Execution step success rate",
        check_fn=check_success_rate,
        warning_threshold=20.0,
        critical_threshold=50.0,
        hysteresis=5.0,
        unit="%_failed",
    ))
    wd.register(HealthCheck(
        name="step_duration",
        description="Step execution duration budget",
        check_fn=check_step_duration,
        warning_threshold=80.0,
        critical_threshold=95.0,
        hysteresis=5.0,
        unit="%_budget",
    ))
    wd.register(HealthCheck(
        name="error_count",
        description="Error count threshold",
        check_fn=check_error_count,
        warning_threshold=60.0,
        critical_threshold=80.0,
        hysteresis=10.0,
        unit="%_max",
    ))
    return wd


__all__ = [
    "AlertSeverity",
    "AlertState",
    "HealthCheck",
    "HealthWatchdog",
    "WatchdogReport",
    "create_default_watchdog",
]
