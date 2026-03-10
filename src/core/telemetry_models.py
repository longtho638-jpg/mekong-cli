"""Mekong CLI - Telemetry Data Models.

Dataclasses for execution trace telemetry.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class StepTrace:
    """Trace data for a single execution step."""

    step_order: int
    title: str
    duration_seconds: float
    exit_code: int
    self_healed: bool = False
    agent_used: str | None = None


@dataclass
class ExecutionTrace:
    """Complete trace for one orchestration run."""

    goal: str
    steps: list[StepTrace] = field(default_factory=list)
    total_duration: float = 0.0
    llm_calls: int = 0
    errors: list[str] = field(default_factory=list)


__all__ = ["ExecutionTrace", "StepTrace"]
