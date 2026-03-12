"""Pipeline manager for chaining multiple PEV workflows.

Manages sequential and parallel execution of multiple goals/recipes,
aggregates results, and provides pipeline-level status tracking.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .progress_tracker import ProgressTracker
from .task_queue import PriorityTaskQueue


class PipelineStatus(Enum):
    """Overall pipeline status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class PipelineStage:
    """A single stage in the pipeline."""

    id: str
    goal: str
    order: int
    status: str = "pending"  # pending, running, completed, failed, skipped
    result: Any = None
    error: str = ""
    start_time: float | None = None
    end_time: float | None = None
    depends_on: list[str] = field(default_factory=list)

    @property
    def duration_ms(self) -> float:
        if self.start_time is None:
            return 0.0
        end = self.end_time or time.time()
        return (end - self.start_time) * 1000


@dataclass
class PipelineResult:
    """Aggregated result of an entire pipeline execution."""

    pipeline_id: str
    status: PipelineStatus
    stages: list[PipelineStage] = field(default_factory=list)
    total_stages: int = 0
    completed_stages: int = 0
    failed_stages: int = 0
    total_duration_ms: float = 0.0
    errors: list[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        if self.total_stages == 0:
            return 0.0
        return (self.completed_stages / self.total_stages) * 100


class PipelineManager:
    """Manages multi-stage PEV pipelines.

    Chains multiple goals/recipes into a pipeline with dependency
    management, progress tracking, and result aggregation.
    Uses PriorityTaskQueue for stage scheduling.
    """

    def __init__(self, stop_on_failure: bool = True) -> None:
        self._pipelines: dict[str, PipelineResult] = {}
        self._stop_on_failure = stop_on_failure
        self._queue = PriorityTaskQueue(max_size=0)
        self._tracker = ProgressTracker()

    @property
    def tracker(self) -> ProgressTracker:
        """Access the progress tracker for registering callbacks."""
        return self._tracker

    def create_pipeline(
        self,
        goals: list[str],
        dependencies: dict[str, list[str]] | None = None,
    ) -> str:
        """Create a new pipeline from a list of goals.

        Args:
            goals: List of goal descriptions (executed in order).
            dependencies: Optional stage ID → list of dependency stage IDs.

        Returns:
            Pipeline ID for tracking.
        """
        pipeline_id = uuid.uuid4().hex[:12]
        stages: list[PipelineStage] = []
        deps = dependencies or {}

        for i, goal in enumerate(goals):
            stage_id = f"stage-{i + 1}"
            stage = PipelineStage(
                id=stage_id,
                goal=goal,
                order=i + 1,
                depends_on=deps.get(stage_id, []),
            )
            stages.append(stage)

        result = PipelineResult(
            pipeline_id=pipeline_id,
            status=PipelineStatus.PENDING,
            stages=stages,
            total_stages=len(stages),
        )
        self._pipelines[pipeline_id] = result
        return pipeline_id

    def execute_pipeline(
        self,
        pipeline_id: str,
        executor_fn: Any,
    ) -> PipelineResult:
        """Execute a pipeline by running each stage through executor_fn.

        Args:
            pipeline_id: ID from create_pipeline().
            executor_fn: Callable(goal: str) → result (any truthy = success).

        Returns:
            PipelineResult with aggregated outcomes.
        """
        result = self._pipelines.get(pipeline_id)
        if result is None:
            raise ValueError(f"Pipeline not found: {pipeline_id}")

        result.status = PipelineStatus.RUNNING
        start_time = time.time()
        self._tracker.start_workflow(result.total_stages)

        completed_ids: set[str] = set()

        for stage in result.stages:
            # Check dependencies
            if not self._deps_met(stage, completed_ids):
                stage.status = "skipped"
                self._tracker.step_skipped(stage.order, stage.goal)
                continue

            stage.status = "running"
            stage.start_time = time.time()
            self._tracker.step_started(stage.order, stage.goal)

            try:
                stage_result = executor_fn(stage.goal)
                stage.result = stage_result
                stage.status = "completed"
                stage.end_time = time.time()
                result.completed_stages += 1
                completed_ids.add(stage.id)
                self._tracker.step_completed(stage.order)

            except Exception as e:
                stage.status = "failed"
                stage.error = str(e)
                stage.end_time = time.time()
                result.failed_stages += 1
                result.errors.append(f"{stage.id}: {e}")
                self._tracker.step_failed(stage.order, str(e))

                if self._stop_on_failure:
                    # Skip remaining stages
                    for remaining in result.stages:
                        if remaining.status == "pending":
                            remaining.status = "skipped"
                    break

        result.total_duration_ms = (time.time() - start_time) * 1000

        # Determine final status
        if result.failed_stages == 0 and result.completed_stages == result.total_stages:
            result.status = PipelineStatus.COMPLETED
            self._tracker.finish(success=True)
        elif result.completed_stages > 0:
            result.status = PipelineStatus.PARTIAL
            self._tracker.finish(success=False)
        else:
            result.status = PipelineStatus.FAILED
            self._tracker.finish(success=False)

        return result

    def get_pipeline(self, pipeline_id: str) -> PipelineResult | None:
        """Get pipeline result by ID."""
        return self._pipelines.get(pipeline_id)

    def cancel_pipeline(self, pipeline_id: str) -> bool:
        """Cancel a pending/running pipeline."""
        result = self._pipelines.get(pipeline_id)
        if result is None:
            return False
        if result.status in (PipelineStatus.COMPLETED, PipelineStatus.CANCELLED):
            return False
        result.status = PipelineStatus.CANCELLED
        for stage in result.stages:
            if stage.status in ("pending", "running"):
                stage.status = "skipped"
        return True

    def list_pipelines(self) -> list[PipelineResult]:
        """List all tracked pipelines."""
        return list(self._pipelines.values())

    def aggregate_results(self, pipeline_id: str) -> dict[str, Any]:
        """Aggregate results from all stages of a pipeline."""
        result = self._pipelines.get(pipeline_id)
        if result is None:
            return {}

        return {
            "pipeline_id": pipeline_id,
            "status": result.status.value,
            "total_stages": result.total_stages,
            "completed": result.completed_stages,
            "failed": result.failed_stages,
            "success_rate": result.success_rate,
            "duration_ms": result.total_duration_ms,
            "errors": result.errors,
            "stages": [
                {
                    "id": s.id,
                    "goal": s.goal,
                    "status": s.status,
                    "duration_ms": s.duration_ms,
                    "error": s.error,
                }
                for s in result.stages
            ],
        }

    def _deps_met(
        self,
        stage: PipelineStage,
        completed_ids: set[str],
    ) -> bool:
        """Check if all dependencies for a stage are met."""
        return all(dep in completed_ids for dep in stage.depends_on)


__all__ = [
    "PipelineManager",
    "PipelineResult",
    "PipelineStage",
    "PipelineStatus",
]
