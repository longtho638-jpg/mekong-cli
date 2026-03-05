"""
Mekong CLI - Telemetry Data Models

Dataclasses for execution trace telemetry.
"""

from dataclasses import dataclass, field
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


__all__ = ["StepTrace", "ExecutionTrace"]
