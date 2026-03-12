"""Mekong CLI - Pipeline Checkpoint/Resume.

Enables long-running pipelines to save progress and resume from last
successful stage after crash/restart. Builds on DurableStepStore.

Storage: .mekong/checkpoints/{pipeline_id}/checkpoint.json
         .mekong/checkpoints/{pipeline_id}/stage_{N}.json

Usage:
    cp = PipelineCheckpoint("pipeline-123")
    cp.save_stage(0, {"result": "ok"})
    resume_idx = cp.get_resume_index()  # → 1
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

CHECKPOINT_DIR = Path(".mekong/checkpoints")


@dataclass
class StageCheckpoint:
    """Persisted state of a completed pipeline stage."""

    stage_index: int
    status: str  # "completed", "failed", "skipped"
    result: Any = None
    error: str | None = None
    started_at: float = 0.0
    completed_at: float = 0.0
    attempt_count: int = 1

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict."""
        return {
            "stage_index": self.stage_index,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "attempt_count": self.attempt_count,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StageCheckpoint:
        """Deserialize from dict."""
        return cls(
            stage_index=data["stage_index"],
            status=data["status"],
            result=data.get("result"),
            error=data.get("error"),
            started_at=data.get("started_at", 0.0),
            completed_at=data.get("completed_at", 0.0),
            attempt_count=data.get("attempt_count", 1),
        )


@dataclass
class CheckpointMetadata:
    """Pipeline-level checkpoint metadata."""

    pipeline_id: str
    total_stages: int
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    completed_stages: int = 0
    failed_stages: int = 0
    status: str = "in_progress"  # in_progress, completed, failed, abandoned


class PipelineCheckpoint:
    """Manage checkpoint state for a single pipeline.

    Saves stage results to disk so pipelines can resume after interruption.

    Args:
        pipeline_id: Unique identifier for the pipeline
        checkpoint_dir: Base directory for checkpoints
    """

    def __init__(
        self,
        pipeline_id: str,
        total_stages: int = 0,
        checkpoint_dir: Path = CHECKPOINT_DIR,
    ) -> None:
        self.pipeline_id = pipeline_id
        self._dir = checkpoint_dir / pipeline_id
        self._metadata: CheckpointMetadata | None = None
        self._stages: dict[int, StageCheckpoint] = {}

        # Load existing checkpoint if present
        self._load()

        # Initialize metadata if new
        if self._metadata is None:
            self._metadata = CheckpointMetadata(
                pipeline_id=pipeline_id,
                total_stages=total_stages,
            )

    def _load(self) -> None:
        """Load checkpoint from disk."""
        meta_path = self._dir / "checkpoint.json"
        if not meta_path.exists():
            return

        try:
            data = json.loads(meta_path.read_text(encoding="utf-8"))
            self._metadata = CheckpointMetadata(
                pipeline_id=data["pipeline_id"],
                total_stages=data["total_stages"],
                created_at=data.get("created_at", 0.0),
                updated_at=data.get("updated_at", 0.0),
                completed_stages=data.get("completed_stages", 0),
                failed_stages=data.get("failed_stages", 0),
                status=data.get("status", "in_progress"),
            )

            # Load stage files
            for stage_file in self._dir.glob("stage_*.json"):
                try:
                    stage_data = json.loads(stage_file.read_text(encoding="utf-8"))
                    sc = StageCheckpoint.from_dict(stage_data)
                    self._stages[sc.stage_index] = sc
                except (json.JSONDecodeError, KeyError) as e:
                    logger.warning("Corrupt stage file %s: %s", stage_file, e)

            logger.debug(
                "Loaded checkpoint for %s: %d stages",
                self.pipeline_id, len(self._stages),
            )
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Failed to load checkpoint for %s: %s", self.pipeline_id, e)

    def _save_metadata(self) -> None:
        """Persist metadata to disk."""
        self._dir.mkdir(parents=True, exist_ok=True)
        if self._metadata:
            self._metadata.updated_at = time.time()
            meta_path = self._dir / "checkpoint.json"
            meta_path.write_text(
                json.dumps({
                    "pipeline_id": self._metadata.pipeline_id,
                    "total_stages": self._metadata.total_stages,
                    "created_at": self._metadata.created_at,
                    "updated_at": self._metadata.updated_at,
                    "completed_stages": self._metadata.completed_stages,
                    "failed_stages": self._metadata.failed_stages,
                    "status": self._metadata.status,
                }, indent=2),
                encoding="utf-8",
            )

    def save_stage(
        self,
        stage_index: int,
        result: Any = None,
        error: str | None = None,
        attempt_count: int = 1,
    ) -> StageCheckpoint:
        """Save a completed/failed stage checkpoint.

        Args:
            stage_index: Zero-based stage index
            result: Stage result data (JSON-serializable)
            error: Error message if failed
            attempt_count: Number of attempts for this stage

        Returns:
            The saved StageCheckpoint
        """
        status = "failed" if error else "completed"
        checkpoint = StageCheckpoint(
            stage_index=stage_index,
            status=status,
            result=result,
            error=error,
            started_at=self._stages.get(stage_index, StageCheckpoint(stage_index, "")).started_at or time.time(),
            completed_at=time.time(),
            attempt_count=attempt_count,
        )

        self._stages[stage_index] = checkpoint

        # Write stage file
        self._dir.mkdir(parents=True, exist_ok=True)
        stage_path = self._dir / f"stage_{stage_index}.json"
        stage_path.write_text(
            json.dumps(checkpoint.to_dict(), indent=2, default=str),
            encoding="utf-8",
        )

        # Update metadata counts
        if self._metadata:
            self._metadata.completed_stages = sum(
                1 for s in self._stages.values() if s.status == "completed"
            )
            self._metadata.failed_stages = sum(
                1 for s in self._stages.values() if s.status == "failed"
            )
            self._save_metadata()

        logger.debug("Checkpoint saved: stage %d (%s)", stage_index, status)
        return checkpoint

    def mark_stage_started(self, stage_index: int) -> None:
        """Mark a stage as started (records start time)."""
        if stage_index not in self._stages:
            self._stages[stage_index] = StageCheckpoint(
                stage_index=stage_index,
                status="in_progress",
                started_at=time.time(),
            )

    def get_resume_index(self) -> int:
        """Get the stage index to resume from.

        Returns the index of the first non-completed stage.
        """
        if not self._stages:
            return 0

        for i in range(max(s.stage_index for s in self._stages.values()) + 1):
            stage = self._stages.get(i)
            if stage is None or stage.status != "completed":
                return i

        return max(s.stage_index for s in self._stages.values()) + 1

    def is_stage_completed(self, stage_index: int) -> bool:
        """Check if a stage was already completed successfully."""
        stage = self._stages.get(stage_index)
        return stage is not None and stage.status == "completed"

    def get_stage(self, stage_index: int) -> StageCheckpoint | None:
        """Get checkpoint for a specific stage."""
        return self._stages.get(stage_index)

    def mark_completed(self) -> None:
        """Mark entire pipeline as completed."""
        if self._metadata:
            self._metadata.status = "completed"
            self._save_metadata()

    def mark_failed(self) -> None:
        """Mark entire pipeline as failed."""
        if self._metadata:
            self._metadata.status = "failed"
            self._save_metadata()

    def clear(self) -> None:
        """Remove all checkpoint files for this pipeline."""
        if self._dir.exists():
            for f in self._dir.glob("*.json"):
                f.unlink()
            try:
                self._dir.rmdir()
            except OSError:
                pass
        self._stages.clear()
        logger.info("Cleared checkpoint for %s", self.pipeline_id)

    @property
    def has_checkpoint(self) -> bool:
        """Check if this pipeline has any saved checkpoints."""
        return len(self._stages) > 0

    @property
    def metadata(self) -> CheckpointMetadata | None:
        """Pipeline metadata."""
        return self._metadata


def list_incomplete_pipelines(checkpoint_dir: Path = CHECKPOINT_DIR) -> list[str]:
    """List all pipeline IDs with incomplete checkpoints."""
    if not checkpoint_dir.exists():
        return []
    result = []
    for d in checkpoint_dir.iterdir():
        if d.is_dir():
            meta_path = d / "checkpoint.json"
            if meta_path.exists():
                try:
                    data = json.loads(meta_path.read_text(encoding="utf-8"))
                    if data.get("status") == "in_progress":
                        result.append(d.name)
                except (json.JSONDecodeError, KeyError):
                    pass
    return result


__all__ = [
    "CheckpointMetadata",
    "PipelineCheckpoint",
    "StageCheckpoint",
    "list_incomplete_pipelines",
]
