"""
ObservabilityFacade — singleton dual-write coordinator.

Bridges the legacy TelemetryCollector (JSON on disk) with Langfuse
so both backends are always attempted. Langfuse failure never blocks
the JSON write path.

Usage::

    from packages.observability import ObservabilityFacade

    facade = ObservabilityFacade.instance()
    facade.start_trace("deploy app", user_id="cto-agent")
    facade.record_step(1, "install deps", 2.5, 0)
    facade.record_llm_call("claude-opus-4-6", input_tokens=500, output_tokens=200)
    facade.finish_trace("success")
"""

import logging
from typing import Any, Dict, Optional

from .langfuse_provider import LangfuseProvider
from .trace_decorator import set_active_trace

logger = logging.getLogger(__name__)

class ObservabilityFacade:
    """
    Singleton that orchestrates dual-write to Langfuse and local JSON.

    Instantiate once and reuse across the process lifetime. The
    singleton is NOT thread-safe for concurrent trace sessions — one
    active trace per process is assumed (matches TelemetryCollector
    design).

    TelemetryCollector is lazily imported on first use to avoid circular
    imports (telemetry.py also imports this facade).
    """

    _instance: Optional["ObservabilityFacade"] = None

    def __init__(self, collector: Optional[Any] = None) -> None:
        self._langfuse = LangfuseProvider()
        self._collector: Optional[Any] = collector
        self._collector_loaded = collector is not None
        self._active_lf_trace: Optional[Any] = None
        self._active_lf_span: Optional[Any] = None

    def _ensure_collector(self) -> None:
        """Lazily create TelemetryCollector on first use (avoids circular import)."""
        if self._collector_loaded:
            return
        self._collector_loaded = True
        try:
            from src.core.telemetry import TelemetryCollector
            self._collector = TelemetryCollector()
        except ImportError:
            logger.debug("src.core.telemetry not importable — JSON write disabled")

    @classmethod
    def instance(cls) -> "ObservabilityFacade":
        """Return (or create) the process-level singleton."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Destroy the singleton — useful in tests."""
        cls._instance = None

    # ------------------------------------------------------------------
    # Public API (mirrors TelemetryCollector interface)
    # ------------------------------------------------------------------

    def start_trace(
        self,
        goal: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Begin a new observability trace.

        Args:
            goal: Human-readable description of the orchestration goal.
            user_id: Optional identifier for Langfuse filtering.
            metadata: Extra key-value pairs attached to the Langfuse trace.
        """
        # Langfuse path
        try:
            self._active_lf_trace = self._langfuse.start_trace(
                name=goal,
                user_id=user_id,
                metadata=metadata,
            )
            # Propagate into context so @traced decorators can pick it up
            set_active_trace(self._active_lf_trace)
        except Exception as exc:
            logger.warning("Langfuse start_trace error: %s", exc)

        # Legacy JSON path
        self._ensure_collector()
        if self._collector is not None:
            try:
                self._collector.start_trace(goal)
            except Exception as exc:
                logger.warning("TelemetryCollector.start_trace error: %s", exc)

    def record_step(
        self,
        step_order: int,
        title: str,
        duration: float,
        exit_code: int,
        self_healed: bool = False,
        agent: Optional[str] = None,
    ) -> None:
        """
        Record a completed orchestration step.

        Args:
            step_order: 1-based position in the recipe.
            title: Step label.
            duration: Wall-clock seconds.
            exit_code: 0 = success, non-zero = failure.
            self_healed: True if the step recovered via AI correction.
            agent: Name of the agent that executed the step (optional).
        """
        # Langfuse span per step
        try:
            if self._active_lf_trace is not None:
                span = self._langfuse.start_span(
                    self._active_lf_trace,
                    name=f"step-{step_order}: {title}",
                )
                if span is not None:
                    status = "success" if exit_code == 0 else "error"
                    span.end(
                        status=status,
                        metadata={
                            "step_order": step_order,
                            "duration_seconds": round(duration, 3),
                            "exit_code": exit_code,
                            "self_healed": self_healed,
                            "agent_used": agent,
                        },
                    )
        except Exception as exc:
            logger.warning("Langfuse record_step error: %s", exc)

        # Legacy JSON path
        self._ensure_collector()
        if self._collector is not None:
            try:
                self._collector.record_step(
                    step_order, title, duration, exit_code, self_healed, agent
                )
            except Exception as exc:
                logger.warning("TelemetryCollector.record_step error: %s", exc)

    def record_llm_call(
        self,
        model: str = "",
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost: float = 0.0,
    ) -> None:
        """
        Record an LLM API call.

        Args:
            model: Model identifier string.
            input_tokens: Prompt token count.
            output_tokens: Completion token count.
            cost: Estimated USD cost (optional, 0 if unknown).
        """
        # Langfuse generation on active span (if any) or trace-level span
        try:
            if self._active_lf_trace is not None:
                span = self._langfuse.start_span(self._active_lf_trace, name="llm-call")
                if span is not None:
                    self._langfuse.record_generation(
                        span=span,
                        model=model,
                        input_text="",
                        output_text="",
                        usage={"input": input_tokens, "output": output_tokens},
                    )
                    if cost:
                        span.end(metadata={"cost_usd": cost})
                    else:
                        span.end()
        except Exception as exc:
            logger.warning("Langfuse record_llm_call error: %s", exc)

        # Legacy JSON path
        self._ensure_collector()
        if self._collector is not None:
            try:
                self._collector.record_llm_call()
            except Exception as exc:
                logger.warning("TelemetryCollector.record_llm_call error: %s", exc)

    def record_error(self, error_msg: str) -> None:
        """
        Record an error message in both backends.

        Args:
            error_msg: Human-readable error description.
        """
        try:
            if self._active_lf_trace is not None:
                self._active_lf_trace.event(name="error", metadata={"message": error_msg})
        except Exception as exc:
            logger.warning("Langfuse record_error error: %s", exc)

        self._ensure_collector()
        if self._collector is not None:
            try:
                self._collector.record_error(error_msg)
            except Exception as exc:
                logger.warning("TelemetryCollector.record_error error: %s", exc)

    def finish_trace(self, status: str = "success") -> None:
        """
        Finalise both backends.

        Args:
            status: "success" | "error" | "cancelled"
        """
        # Langfuse flush
        try:
            self._langfuse.end_trace(self._active_lf_trace, status=status)
            set_active_trace(None)
            self._active_lf_trace = None
        except Exception as exc:
            logger.warning("Langfuse finish_trace error: %s", exc)

        # Legacy JSON write (always attempted regardless of Langfuse outcome)
        self._ensure_collector()
        if self._collector is not None:
            try:
                self._collector.finish_trace()
            except Exception as exc:
                logger.warning("TelemetryCollector.finish_trace error: %s", exc)
