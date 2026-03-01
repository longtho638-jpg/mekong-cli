"""
Mekong CLI - Telemetry Collector

Records execution traces for observability and debugging.
Writes structured traces to .mekong/telemetry/ directory.

Tiered storage (Netdata DBENGINE-inspired):
  Tier 0: Per-step full traces (14 days retention)
  Tier 1: Per-phase summaries (90 days retention)
  Tier 2: Per-project archives (365 days retention)

Dual-write: also forwards events to ObservabilityFacade (Langfuse)
when the mekong-observability package is installed. If Langfuse is
unavailable the JSON write path continues unaffected.
"""

import json
import logging
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Langfuse facade is lazily loaded on first use to avoid circular imports
_facade = None
_facade_loaded = False


def _get_facade():
    """Lazily import and cache ObservabilityFacade (breaks circular import)."""
    global _facade, _facade_loaded
    if _facade_loaded:
        return _facade
    _facade_loaded = True
    try:
        from packages.observability.observability_facade import ObservabilityFacade
        _facade = ObservabilityFacade.instance()
    except ImportError:
        logger.debug("mekong-observability not installed — Langfuse disabled")
    return _facade


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

    def __init__(self, output_dir: Optional[str] = None) -> None:
        """
        Initialize collector.

        Args:
            output_dir: Directory for trace files. Defaults to .mekong/telemetry/
        """
        self._trace: Optional[ExecutionTrace] = None
        self._start_time: float = 0.0
        self._output_dir = Path(output_dir) if output_dir else Path(".mekong/telemetry")

    def start_trace(self, goal: str, user_id: Optional[str] = None) -> None:
        """
        Begin a new execution trace.

        Args:
            goal: Human-readable orchestration goal.
            user_id: Optional identifier forwarded to Langfuse.
        """
        self._trace = ExecutionTrace(goal=goal)
        self._start_time = time.time()

        if _get_facade() is not None:
            try:
                _get_facade().start_trace(goal, user_id=user_id)
            except Exception as exc:
                logger.warning("facade.start_trace error: %s", exc)

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

        if _get_facade() is not None:
            try:
                _get_facade().record_step(step_order, title, duration, exit_code, self_healed, agent)
            except Exception as exc:
                logger.warning("facade.record_step error: %s", exc)

    def record_llm_call(self, model: str = "", input_tokens: int = 0, output_tokens: int = 0) -> None:
        """
        Increment LLM call counter and forward event to Langfuse.

        Args:
            model: Model identifier (optional, for Langfuse).
            input_tokens: Prompt token count (optional).
            output_tokens: Completion token count (optional).
        """
        if self._trace is not None:
            self._trace.llm_calls += 1

        if _get_facade() is not None:
            try:
                _get_facade().record_llm_call(model=model, input_tokens=input_tokens, output_tokens=output_tokens)
            except Exception as exc:
                logger.warning("facade.record_llm_call error: %s", exc)

    def record_error(self, error_msg: str) -> None:
        """Record an error message in both backends."""
        if self._trace is not None:
            self._trace.errors.append(error_msg)

        if _get_facade() is not None:
            try:
                _get_facade().record_error(error_msg)
            except Exception as exc:
                logger.warning("facade.record_error error: %s", exc)

    def finish_trace(self) -> Optional[ExecutionTrace]:
        """
        Finalize trace and write to disk.

        Returns:
            The completed ExecutionTrace, or None if no trace was started.
        """
        if self._trace is None:
            return None

        self._trace.total_duration = round(time.time() - self._start_time, 3)

        # Determine overall status for Langfuse
        status = "error" if self._trace.errors else "success"
        if _get_facade() is not None:
            try:
                _get_facade().finish_trace(status=status)
            except Exception as exc:
                logger.warning("facade.finish_trace error: %s", exc)

        # Write to disk (always — primary fallback path)
        self._output_dir.mkdir(parents=True, exist_ok=True)
        output_path = self._output_dir / "execution_trace.json"
        output_path.write_text(json.dumps(asdict(self._trace), indent=2))

        return self._trace

    def get_trace(self) -> Optional[ExecutionTrace]:
        """Return the current ExecutionTrace (may be incomplete)."""
        return self._trace


class TieredTelemetryStore:
    """
    Tiered telemetry storage inspired by Netdata's DBENGINE.

    Tier 0: Full step-level traces (retention: 14 days)
    Tier 1: Phase summaries (retention: 90 days)
    Tier 2: Project archives (retention: 365 days)
    """

    TIER_RETENTION_DAYS = {0: 14, 1: 90, 2: 365}

    def __init__(self, base_dir: Optional[str] = None) -> None:
        """Initialize tiered store with base directory."""
        self._base = Path(base_dir) if base_dir else Path(".mekong/telemetry")

    def _tier_dir(self, tier: int) -> Path:
        """Get directory for a specific tier."""
        return self._base / f"tier{tier}"

    def store_trace(self, trace: ExecutionTrace) -> Path:
        """Store a full trace in Tier 0 (per-step detail)."""
        tier_dir = self._tier_dir(0)
        tier_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        path = tier_dir / f"trace-{timestamp}.json"
        path.write_text(json.dumps(asdict(trace), indent=2))
        return path

    def summarize_to_tier1(self, trace: ExecutionTrace) -> Dict[str, object]:
        """Compress trace to Tier 1 phase summary (strip step details)."""
        summary: Dict[str, object] = {
            "goal": trace.goal,
            "total_duration": trace.total_duration,
            "step_count": len(trace.steps),
            "success_count": sum(1 for s in trace.steps if s.exit_code == 0),
            "llm_calls": trace.llm_calls,
            "error_count": len(trace.errors),
            "self_healed": sum(1 for s in trace.steps if s.self_healed),
            "timestamp": datetime.now().isoformat(),
        }
        tier_dir = self._tier_dir(1)
        tier_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d")
        path = tier_dir / f"summary-{date_str}.jsonl"
        with open(path, "a") as f:
            f.write(json.dumps(summary) + "\n")
        return summary

    def compact_to_tier2(self) -> int:
        """
        Compact Tier 1 summaries into Tier 2 monthly archives.

        Returns:
            Number of summaries compacted.
        """
        tier1_dir = self._tier_dir(1)
        tier2_dir = self._tier_dir(2)
        tier2_dir.mkdir(parents=True, exist_ok=True)

        if not tier1_dir.exists():
            return 0

        compacted = 0
        cutoff = datetime.now() - timedelta(days=self.TIER_RETENTION_DAYS[1])

        for summary_file in sorted(tier1_dir.glob("summary-*.jsonl")):
            # Extract date from filename
            try:
                date_part = summary_file.stem.split("-", 1)[1]
                file_date = datetime.strptime(date_part, "%Y%m%d")
            except (ValueError, IndexError):
                continue

            if file_date < cutoff:
                # Move to tier 2 monthly archive
                month_key = file_date.strftime("%Y%m")
                archive_path = tier2_dir / f"archive-{month_key}.jsonl"
                content = summary_file.read_text()
                with open(archive_path, "a") as f:
                    f.write(content)
                summary_file.unlink()
                compacted += 1

        return compacted

    def cleanup_expired(self) -> int:
        """Remove traces that exceed their tier retention period."""
        removed = 0
        for tier, days in self.TIER_RETENTION_DAYS.items():
            tier_dir = self._tier_dir(tier)
            if not tier_dir.exists():
                continue
            cutoff = time.time() - (days * 86400)
            for f in tier_dir.iterdir():
                if f.is_file() and f.stat().st_mtime < cutoff:
                    f.unlink()
                    removed += 1
        return removed

    def get_recent_summaries(self, limit: int = 20) -> List[Dict[str, object]]:
        """Read recent Tier 1 summaries."""
        tier1_dir = self._tier_dir(1)
        if not tier1_dir.exists():
            return []

        entries: List[Dict[str, object]] = []
        for f in sorted(tier1_dir.glob("summary-*.jsonl"), reverse=True):
            for line in reversed(f.read_text().strip().splitlines()):
                if line.strip():
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
                    if len(entries) >= limit:
                        return entries
        return entries


__all__ = [
    "TelemetryCollector",
    "TieredTelemetryStore",
    "ExecutionTrace",
    "StepTrace",
]
