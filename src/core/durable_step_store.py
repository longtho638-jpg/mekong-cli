"""
Mekong CLI - Durable Step Store

QStash-inspired context.run() pattern: persist step results to survive
CLI crash/restart. On resume, skip completed steps and continue from
the last failure point.

Storage: .mekong/step-results/{recipe_id}/{step_index}.json
"""

import json
import logging
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

STORE_DIR = Path(".mekong/step-results")


@dataclass
class StepResult:
    """Persisted result of a single execution step."""

    step_index: int
    exit_code: int
    stdout: str
    stderr: str
    metadata: Dict[str, Any]
    completed_at: float


class DurableStepStore:
    """Persist and resume step execution results across CLI restarts."""

    def __init__(self, store_dir: Path = STORE_DIR) -> None:
        self.store_dir = store_dir

    def _recipe_dir(self, recipe_id: str) -> Path:
        """Get directory for a specific recipe's step results."""
        return self.store_dir / recipe_id

    def save(self, recipe_id: str, step_index: int, result: Any) -> None:
        """Save a completed step result to disk."""
        recipe_dir = self._recipe_dir(recipe_id)
        recipe_dir.mkdir(parents=True, exist_ok=True)

        step_result = StepResult(
            step_index=step_index,
            exit_code=getattr(result, "exit_code", 0),
            stdout=getattr(result, "stdout", ""),
            stderr=getattr(result, "stderr", ""),
            metadata=getattr(result, "metadata", {}),
            completed_at=time.time(),
        )

        filepath = recipe_dir / f"{step_index}.json"
        filepath.write_text(
            json.dumps(asdict(step_result), indent=2, default=str),
            encoding="utf-8",
        )
        logger.debug(f"Saved step {step_index} for recipe {recipe_id}")

    def load(self, recipe_id: str) -> List[StepResult]:
        """Load all completed step results for a recipe."""
        recipe_dir = self._recipe_dir(recipe_id)
        if not recipe_dir.exists():
            return []

        results = []
        for filepath in sorted(recipe_dir.glob("*.json")):
            try:
                data = json.loads(filepath.read_text(encoding="utf-8"))
                results.append(StepResult(**data))
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Corrupt step file {filepath}: {e}")

        return sorted(results, key=lambda r: r.step_index)

    def get_resume_index(self, recipe_id: str) -> int:
        """Get the index to resume from (next step after last completed)."""
        results = self.load(recipe_id)
        if not results:
            return 0
        return results[-1].step_index + 1

    def is_step_completed(self, recipe_id: str, step_index: int) -> bool:
        """Check if a specific step was already completed successfully."""
        recipe_dir = self._recipe_dir(recipe_id)
        filepath = recipe_dir / f"{step_index}.json"
        if not filepath.exists():
            return False

        try:
            data = json.loads(filepath.read_text(encoding="utf-8"))
            return data.get("exit_code", 1) == 0
        except (json.JSONDecodeError, KeyError):
            return False

    def clear(self, recipe_id: str) -> None:
        """Clear all step results for a recipe (after full completion)."""
        recipe_dir = self._recipe_dir(recipe_id)
        if recipe_dir.exists():
            for filepath in recipe_dir.glob("*.json"):
                filepath.unlink()
            recipe_dir.rmdir()
            logger.info(f"Cleared step results for recipe {recipe_id}")

    def list_incomplete(self) -> List[str]:
        """List all recipe IDs with incomplete step results."""
        if not self.store_dir.exists():
            return []
        return [
            d.name
            for d in self.store_dir.iterdir()
            if d.is_dir() and list(d.glob("*.json"))
        ]
