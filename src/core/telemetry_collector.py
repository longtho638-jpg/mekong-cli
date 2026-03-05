"""
Mekong CLI - Telemetry Collector

Records execution traces for observability and debugging.
Writes structured traces to .mekong/telemetry/ directory.
"""

import json
import logging
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional

from .telemetry_models import ExecutionTrace, StepTrace

logger = logging.getLogger(__name__)

# Langfuse facade disabled to prevent recursion issues
_facade = None
_facade_loaded = False


def _get_facade() -> Optional[Any]:
    """Safely import and cache ObservabilityFacade without recursion risk."""
    global _facade, _facade_loaded

    if _facade_loaded:
        return _facade

    _facade_loaded = True
    _facade = None
    return _facade


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

    def __init__(self, output_dir: Optional[str] = None) -> None:
        """
        Initialize collector.

        Args:
            output_dir: Directory for trace files. Defaults to .mekong/telemetry/
        """
        self._trace: Optional[ExecutionTrace] = None
        self._start_time: float = 0.0
        self._output_dir = Path(output_dir) if output_dir else Path(".mekong/telemetry")
        self._lock = threading.Lock()

    def start_trace(self, goal: str, user_id: Optional[str] = None) -> None:
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
        """Record a completed step in the current trace (thread-safe)."""
        if self._trace is None:
            return

        with self._lock:
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

    def record_llm_call(
        self, model: str = "", input_tokens: int = 0, output_tokens: int = 0
    ) -> None:
        """Increment LLM call counter."""
        if self._trace is not None:
            self._trace.llm_calls += 1

    def record_error(self, error_msg: str) -> None:
        """Record an error message in the trace."""
        if self._trace is not None:
            self._trace.errors.append(error_msg)

    def finish_trace(self) -> Optional[ExecutionTrace]:
        """Finalize trace and write to disk."""
        if self._trace is None:
            return None

        self._trace.total_duration = round(time.time() - self._start_time, 3)

        self._output_dir.mkdir(parents=True, exist_ok=True)
        output_path = self._output_dir / "execution_trace.json"

        trace_dict = self._serialize_trace_safe(self._trace)
        output_path.write_text(json.dumps(trace_dict, indent=2))

        return self._trace

    def _serialize_trace_safe(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """Safely serialize ExecutionTrace to dict, avoiding circular references."""

        def _serialize_obj(obj: Any) -> Any:
            if isinstance(obj, (int, float, str, bool, type(None))):
                return obj
            elif isinstance(obj, (list, tuple)):
                return [_serialize_obj(item) for item in obj]
            elif isinstance(obj, dict):
                return {
                    key: _serialize_obj(value) for key, value in obj.items()
                }
            elif hasattr(obj, "__dataclass_fields__"):
                result = {}
                for field_name in obj.__dataclass_fields__:
                    field_value = getattr(obj, field_name)
                    if field_value is trace:
                        return {"__ref__": "circular_reference"}
                    result[field_name] = _serialize_obj(field_value)
                return result
            else:
                return str(obj)

        from dataclasses import asdict

        return _serialize_obj(asdict(trace))

    def get_trace(self) -> Optional[ExecutionTrace]:
        """Return the current ExecutionTrace (may be incomplete)."""
        return self._trace


__all__ = ["TelemetryCollector"]
