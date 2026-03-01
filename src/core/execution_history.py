"""
Mekong CLI - Execution History (Event Sourcing)

Temporal-inspired append-only event log for durable execution.
Enables replay, audit trail, and crash recovery.

Pattern: Every state change is an immutable event appended to history.
"""

import json
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class EventKind(str, Enum):
    """Types of execution events (mirrors Temporal event types)."""

    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_COMPLETED = "workflow_completed"
    WORKFLOW_FAILED = "workflow_failed"
    STEP_SCHEDULED = "step_scheduled"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    STEP_RETRIED = "step_retried"
    STEP_HEARTBEAT = "step_heartbeat"
    ROLLBACK_STARTED = "rollback_started"
    ROLLBACK_COMPLETED = "rollback_completed"
    SELF_HEAL_ATTEMPTED = "self_heal_attempted"
    SELF_HEAL_SUCCEEDED = "self_heal_succeeded"
    CHECKPOINT_SAVED = "checkpoint_saved"


@dataclass
class ExecutionEvent:
    """Single immutable event in the execution history."""

    event_id: str
    kind: EventKind
    timestamp: float
    workflow_id: str
    step_order: Optional[int] = None
    data: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def create(
        kind: EventKind,
        workflow_id: str,
        step_order: Optional[int] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> "ExecutionEvent":
        """Factory method to create a new event with auto-generated ID and timestamp."""
        return ExecutionEvent(
            event_id=uuid.uuid4().hex[:12],
            kind=kind,
            timestamp=time.time(),
            workflow_id=workflow_id,
            step_order=step_order,
            data=data or {},
        )


class ExecutionHistory:
    """
    Append-only event log for workflow execution.

    Inspired by Temporal's event sourcing: every state mutation
    is recorded as an immutable event. Supports replay and recovery.
    """

    def __init__(self, storage_dir: Optional[str] = None) -> None:
        """Initialize history store.

        Args:
            storage_dir: Directory for history files. Defaults to .mekong/history/
        """
        self._storage_dir = Path(storage_dir) if storage_dir else Path(".mekong/history")
        self._events: Dict[str, List[ExecutionEvent]] = {}

    def append(self, event: ExecutionEvent) -> None:
        """Append an event to the workflow's history (immutable, never modified)."""
        wf_id = event.workflow_id
        if wf_id not in self._events:
            self._events[wf_id] = []
        self._events[wf_id].append(event)

    def get_history(self, workflow_id: str) -> List[ExecutionEvent]:
        """Get all events for a workflow, ordered by timestamp."""
        return sorted(
            self._events.get(workflow_id, []),
            key=lambda e: e.timestamp,
        )

    def get_last_checkpoint(self, workflow_id: str) -> Optional[int]:
        """Find the last successfully completed step order for crash recovery."""
        history = self.get_history(workflow_id)
        last_completed = 0
        for event in history:
            if event.kind == EventKind.STEP_COMPLETED and event.step_order:
                last_completed = max(last_completed, event.step_order)
        return last_completed if last_completed > 0 else None

    def get_step_events(
        self, workflow_id: str, step_order: int
    ) -> List[ExecutionEvent]:
        """Get all events for a specific step."""
        return [
            e for e in self.get_history(workflow_id)
            if e.step_order == step_order
        ]

    def get_retry_count(self, workflow_id: str, step_order: int) -> int:
        """Count how many times a step has been retried."""
        return sum(
            1 for e in self.get_step_events(workflow_id, step_order)
            if e.kind == EventKind.STEP_RETRIED
        )

    def persist(self, workflow_id: str) -> Path:
        """Write workflow history to disk as append-only JSON lines."""
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        filepath = self._storage_dir / f"{workflow_id}.jsonl"
        with open(filepath, "a", encoding="utf-8") as f:
            for event in self._events.get(workflow_id, []):
                line = json.dumps(asdict(event), default=str)
                f.write(line + "\n")
        return filepath

    def load(self, workflow_id: str) -> List[ExecutionEvent]:
        """Load workflow history from disk."""
        filepath = self._storage_dir / f"{workflow_id}.jsonl"
        if not filepath.exists():
            return []
        events: List[ExecutionEvent] = []
        for line in filepath.read_text(encoding="utf-8").strip().split("\n"):
            if not line:
                continue
            raw = json.loads(line)
            raw["kind"] = EventKind(raw["kind"])
            events.append(ExecutionEvent(**raw))
        self._events[workflow_id] = events
        return events

    def workflow_ids(self) -> List[str]:
        """List all workflow IDs with persisted history."""
        if not self._storage_dir.exists():
            return []
        return [p.stem for p in self._storage_dir.glob("*.jsonl")]

    def clear(self, workflow_id: str) -> None:
        """Remove all events for a workflow (for testing only)."""
        self._events.pop(workflow_id, None)
        filepath = self._storage_dir / f"{workflow_id}.jsonl"
        if filepath.exists():
            filepath.unlink()


__all__ = [
    "EventKind",
    "ExecutionEvent",
    "ExecutionHistory",
]
