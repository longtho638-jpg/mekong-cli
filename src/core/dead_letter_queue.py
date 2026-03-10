"""Mekong CLI - Dead Letter Queue.

QStash-inspired DLQ: failed missions move here after max retries exhausted.
Provides traceable failure history and manual retry capability.

Storage: .mekong/dlq/{timestamp}_{recipe_id}.json
CLI: mekong dlq list | mekong dlq retry <id>
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DLQ_DIR = Path(".mekong/dlq")


@dataclass
class DeadLetter:
    """A failed mission entry in the dead letter queue."""

    id: str
    recipe_id: str
    goal: str
    error: str
    attempts: int
    last_step_index: int
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    retried: bool = False


class DeadLetterQueue:
    """Manages failed missions for inspection and retry."""

    def __init__(self, dlq_dir: Path = DLQ_DIR) -> None:
        self.dlq_dir = dlq_dir

    def push(
        self,
        recipe_id: str,
        goal: str,
        error: str,
        attempts: int,
        last_step_index: int = 0,
        metadata: dict[str, Any] | None = None,
    ) -> DeadLetter:
        """Add a failed mission to the DLQ."""
        self.dlq_dir.mkdir(parents=True, exist_ok=True)

        ts = int(time.time())
        dlq_id = f"{ts}_{recipe_id}"

        letter = DeadLetter(
            id=dlq_id,
            recipe_id=recipe_id,
            goal=goal,
            error=error,
            attempts=attempts,
            last_step_index=last_step_index,
            metadata=metadata or {},
        )

        filepath = self.dlq_dir / f"{dlq_id}.json"
        filepath.write_text(
            json.dumps(asdict(letter), indent=2, default=str),
            encoding="utf-8",
        )
        logger.warning(f"Mission {recipe_id} moved to DLQ after {attempts} attempts")
        return letter

    def list_all(self) -> list[DeadLetter]:
        """List all entries in the dead letter queue."""
        if not self.dlq_dir.exists():
            return []

        entries = []
        for filepath in sorted(self.dlq_dir.glob("*.json"), reverse=True):
            try:
                data = json.loads(filepath.read_text(encoding="utf-8"))
                entries.append(DeadLetter(**data))
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Corrupt DLQ entry {filepath}: {e}")

        return entries

    def get(self, dlq_id: str) -> DeadLetter | None:
        """Get a specific DLQ entry by ID."""
        filepath = self.dlq_dir / f"{dlq_id}.json"
        if not filepath.exists():
            return None

        try:
            data = json.loads(filepath.read_text(encoding="utf-8"))
            return DeadLetter(**data)
        except (json.JSONDecodeError, TypeError):
            return None

    def mark_retried(self, dlq_id: str) -> bool:
        """Mark a DLQ entry as retried."""
        filepath = self.dlq_dir / f"{dlq_id}.json"
        if not filepath.exists():
            return False

        try:
            data = json.loads(filepath.read_text(encoding="utf-8"))
            data["retried"] = True
            filepath.write_text(
                json.dumps(data, indent=2, default=str), encoding="utf-8",
            )
            return True
        except (json.JSONDecodeError, TypeError):
            return False

    def remove(self, dlq_id: str) -> bool:
        """Remove a DLQ entry permanently."""
        filepath = self.dlq_dir / f"{dlq_id}.json"
        if filepath.exists():
            filepath.unlink()
            return True
        return False

    def count(self) -> int:
        """Count entries in the DLQ."""
        if not self.dlq_dir.exists():
            return 0
        return len(list(self.dlq_dir.glob("*.json")))

    def clear(self) -> int:
        """Clear all DLQ entries. Returns count of removed entries."""
        if not self.dlq_dir.exists():
            return 0

        count = 0
        for filepath in self.dlq_dir.glob("*.json"):
            filepath.unlink()
            count += 1
        return count
