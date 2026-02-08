"""
Mekong CLI - Telemetry Collector

Records execution traces for observability and debugging.
Writes structured traces to .mekong/telemetry/ directory.
"""

import json
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Optional


@dataclass
class StepTrace:
    """Trace data for a single execution step"""

    step_order: int
    title: str
    duration_seconds: float
    exit_code: int
    self_healed: bool = False
    agent_used: Optional[str] = None


@dataclass
class ExecutionTrace:
    """Complete trace for one orchestration run"""

    goal: str
    steps: List[StepTrace] = field(default_factory=list)
    total_duration: float = 0.0
    llm_calls: int = 0
    errors: List[str] = field(default_factory=list)


class TelemetryCollector:
    """
    Collects execution telemetry and writes traces to disk.

    Usage:
        collector = TelemetryCollector()
        collector.start_trace("deploy app")
        collector.record_step(1, "Install deps", 2.5, 0)
        collector.record_llm_call()
        collector.finish_trace()
    """

    def __init__(self, output_dir: Optional[str] = None):
        """
        Initialize collector.

        Args:
            output_dir: Directory for trace files. Defaults to .mekong/telemetry/
        """
        self._trace: Optional[ExecutionTrace] = None
        self._start_time: float = 0.0
        self._output_dir = Path(output_dir) if output_dir else Path(".mekong/telemetry")

    def start_trace(self, goal: str) -> None:
        """Begin a new execution trace."""
        self._trace = ExecutionTrace(goal=goal)
        self._start_time = time.time()

    def record_step(
        self,
        step_order: int,
        title: str,
        duration: float,
        exit_code: int,
        self_healed: bool = False,
        agent: Optional[str] = None,
    ) -> None:
        """Record a completed step in the current trace."""
        if self._trace is None:
            return

        self._trace.steps.append(
            StepTrace(
                step_order=step_order,
                title=title,
                duration_seconds=round(duration, 3),
                exit_code=exit_code,
                self_healed=self_healed,
                agent_used=agent,
            )
        )

    def record_llm_call(self) -> None:
        """Increment LLM call counter."""
        if self._trace is not None:
            self._trace.llm_calls += 1

    def record_error(self, error_msg: str) -> None:
        """Record an error message."""
        if self._trace is not None:
            self._trace.errors.append(error_msg)

    def finish_trace(self) -> Optional[ExecutionTrace]:
        """
        Finalize trace and write to disk.

        Returns:
            The completed ExecutionTrace, or None if no trace was started.
        """
        if self._trace is None:
            return None

        self._trace.total_duration = round(time.time() - self._start_time, 3)

        # Write to disk
        self._output_dir.mkdir(parents=True, exist_ok=True)
        output_path = self._output_dir / "execution_trace.json"
        output_path.write_text(json.dumps(asdict(self._trace), indent=2))

        return self._trace

    def get_trace(self) -> Optional[ExecutionTrace]:
        """Return the current ExecutionTrace (may be incomplete)."""
        return self._trace


__all__ = [
    "TelemetryCollector",
    "ExecutionTrace",
    "StepTrace",
]
