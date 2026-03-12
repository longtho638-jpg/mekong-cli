"""Mekong CLI - Performance Benchmark.

Records execution timing and optional memory usage per step,
checks against thresholds, and provides summary statistics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class PerfThreshold:
    """Threshold constraints for a single step.

    Attributes:
        max_duration_ms: Maximum allowed wall-clock duration in milliseconds.
        max_memory_kb: Maximum allowed peak memory in kilobytes (optional).

    """

    max_duration_ms: float
    max_memory_kb: Optional[float] = None


@dataclass
class BenchmarkResult:
    """Performance result for a single recorded step.

    Attributes:
        step_order: Numeric order of the step (1-based).
        duration_ms: Observed duration in milliseconds.
        memory_peak_kb: Observed peak memory in KB (None if not measured).
        thresholds_met: True if all provided thresholds were satisfied.
        violations: List of human-readable threshold violation messages.

    """

    step_order: int
    duration_ms: float
    memory_peak_kb: Optional[float] = None
    thresholds_met: bool = True
    violations: List[str] = field(default_factory=list)


@dataclass
class _StepRecord:
    """Internal record stored per step."""

    step_order: int
    duration_ms: float
    memory_peak_kb: Optional[float]
    step_name: str = ""


class PerfBenchmark:
    """Records and evaluates per-step performance data.

    Usage::

        bench = PerfBenchmark()
        bench.record(step=1, duration=250.0, memory=4096.0)
        result = bench.check_thresholds(step=1, threshold=PerfThreshold(max_duration_ms=500))
        summary = bench.summary()

    """

    def __init__(self) -> None:
        """Initialize empty benchmark store."""
        self._records: Dict[int, _StepRecord] = {}

    def record(
        self,
        step: int,
        duration: float,
        memory: Optional[float] = None,
        step_name: str = "",
    ) -> None:
        """Record performance data for a step.

        Args:
            step: Step order (1-based integer key).
            duration: Wall-clock duration in milliseconds.
            memory: Optional peak memory in kilobytes.
            step_name: Optional human-readable label for the step.

        """
        self._records[step] = _StepRecord(
            step_order=step,
            duration_ms=duration,
            memory_peak_kb=memory,
            step_name=step_name,
        )

    def check_thresholds(
        self, step: int, threshold: PerfThreshold,
    ) -> BenchmarkResult:
        """Check recorded step data against thresholds.

        Args:
            step: Step order to check.
            threshold: PerfThreshold defining limits.

        Returns:
            BenchmarkResult with thresholds_met flag and any violations.

        Raises:
            KeyError: If step has not been recorded.

        """
        if step not in self._records:
            raise KeyError(f"No performance data recorded for step {step}")

        rec = self._records[step]
        violations: List[str] = []

        if rec.duration_ms > threshold.max_duration_ms:
            violations.append(
                f"Duration {rec.duration_ms:.1f}ms exceeds limit {threshold.max_duration_ms:.1f}ms",
            )

        if (
            threshold.max_memory_kb is not None
            and rec.memory_peak_kb is not None
            and rec.memory_peak_kb > threshold.max_memory_kb
        ):
            violations.append(
                f"Memory {rec.memory_peak_kb:.1f}KB exceeds limit {threshold.max_memory_kb:.1f}KB",
            )

        return BenchmarkResult(
            step_order=step,
            duration_ms=rec.duration_ms,
            memory_peak_kb=rec.memory_peak_kb,
            thresholds_met=not violations,
            violations=violations,
        )

    def summary(self) -> dict:
        """Return summary statistics across all recorded steps.

        Returns:
            Dict with keys: total_steps, total_duration_ms, avg_duration_ms,
            slowest_step, fastest_step.  slowest_step and fastest_step are
            step order ints (or None if no records exist).

        """
        if not self._records:
            return {
                "total_steps": 0,
                "total_duration_ms": 0.0,
                "avg_duration_ms": 0.0,
                "slowest_step": None,
                "fastest_step": None,
            }

        durations = {k: v.duration_ms for k, v in self._records.items()}
        total = sum(durations.values())
        slowest = max(durations, key=lambda k: durations[k])
        fastest = min(durations, key=lambda k: durations[k])

        return {
            "total_steps": len(self._records),
            "total_duration_ms": total,
            "avg_duration_ms": total / len(self._records),
            "slowest_step": slowest,
            "fastest_step": fastest,
        }

    def get_result(self, step: int) -> Optional[BenchmarkResult]:
        """Return a BenchmarkResult for a recorded step (no threshold check).

        Args:
            step: Step order.

        Returns:
            BenchmarkResult or None if step not recorded.

        """
        rec = self._records.get(step)
        if rec is None:
            return None
        return BenchmarkResult(
            step_order=rec.step_order,
            duration_ms=rec.duration_ms,
            memory_peak_kb=rec.memory_peak_kb,
        )

    def clear(self) -> None:
        """Remove all recorded data."""
        self._records.clear()


__all__ = [
    "BenchmarkResult",
    "PerfBenchmark",
    "PerfThreshold",
]
