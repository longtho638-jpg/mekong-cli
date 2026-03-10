"""Mekong CLI - Workflow State Machine.

Temporal-inspired deterministic state machine for workflow lifecycle.
Tracks workflow status transitions with validation to prevent
invalid state changes.

States mirror Temporal: PENDING → RUNNING → COMPLETED/FAILED/CANCELLED.
"""

from dataclasses import dataclass, field
from enum import Enum


class WorkflowStatus(str, Enum):
    """Workflow lifecycle states (mirrors Temporal workflow states)."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"
    ROLLED_BACK = "rolled_back"
    SUSPENDED = "suspended"


class StepStatus(str, Enum):
    """Individual step states within a workflow."""

    SCHEDULED = "scheduled"
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    SKIPPED = "skipped"
    ROLLING_BACK = "rolling_back"


# Valid state transitions (from → set of valid destinations)
_WORKFLOW_TRANSITIONS: dict[WorkflowStatus, set[WorkflowStatus]] = {
    WorkflowStatus.PENDING: {WorkflowStatus.RUNNING, WorkflowStatus.CANCELLED},
    WorkflowStatus.RUNNING: {
        WorkflowStatus.COMPLETED,
        WorkflowStatus.FAILED,
        WorkflowStatus.CANCELLED,
        WorkflowStatus.TIMED_OUT,
        WorkflowStatus.ROLLED_BACK,
        WorkflowStatus.SUSPENDED,
    },
    WorkflowStatus.SUSPENDED: {WorkflowStatus.RUNNING, WorkflowStatus.CANCELLED},
    WorkflowStatus.FAILED: {WorkflowStatus.RUNNING, WorkflowStatus.ROLLED_BACK},
    WorkflowStatus.TIMED_OUT: {WorkflowStatus.RUNNING},
    WorkflowStatus.COMPLETED: set(),
    WorkflowStatus.CANCELLED: set(),
    WorkflowStatus.ROLLED_BACK: set(),
}

_STEP_TRANSITIONS: dict[StepStatus, set[StepStatus]] = {
    StepStatus.SCHEDULED: {StepStatus.STARTED, StepStatus.SKIPPED},
    StepStatus.STARTED: {
        StepStatus.COMPLETED,
        StepStatus.FAILED,
        StepStatus.RETRYING,
    },
    StepStatus.RETRYING: {StepStatus.STARTED},
    StepStatus.FAILED: {StepStatus.RETRYING, StepStatus.ROLLING_BACK},
    StepStatus.COMPLETED: {StepStatus.ROLLING_BACK},
    StepStatus.ROLLING_BACK: {StepStatus.SKIPPED},
    StepStatus.SKIPPED: set(),
}


class InvalidTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""


@dataclass
class StepState:
    """Tracks the current state of a single workflow step."""

    order: int
    status: StepStatus = StepStatus.SCHEDULED
    attempt: int = 0
    last_heartbeat: float = 0.0
    error: str = ""

    def transition(self, new_status: StepStatus) -> None:
        """Transition step to a new status with validation.

        Args:
            new_status: Target status

        Raises:
            InvalidTransitionError: If transition is not allowed

        """
        valid_targets = _STEP_TRANSITIONS.get(self.status, set())
        if new_status not in valid_targets:
            msg = f"Step {self.order}: {self.status.value} → {new_status.value} not allowed"
            raise InvalidTransitionError(
                msg,
            )
        self.status = new_status


@dataclass
class WorkflowState:
    """Deterministic state machine for a workflow execution.

    Enforces valid state transitions for both workflow-level
    and step-level status changes.
    """

    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    steps: dict[int, StepState] = field(default_factory=dict)
    current_step: int = 0

    def transition(self, new_status: WorkflowStatus) -> None:
        """Transition workflow to a new status with validation.

        Args:
            new_status: Target workflow status

        Raises:
            InvalidTransitionError: If transition is not allowed

        """
        valid_targets = _WORKFLOW_TRANSITIONS.get(self.status, set())
        if new_status not in valid_targets:
            msg = f"Workflow {self.workflow_id}: {self.status.value} → {new_status.value} not allowed"
            raise InvalidTransitionError(
                msg,
            )
        self.status = new_status

    def register_steps(self, step_count: int) -> None:
        """Register all steps as SCHEDULED at workflow start."""
        for i in range(1, step_count + 1):
            self.steps[i] = StepState(order=i)

    def step_transition(self, step_order: int, new_status: StepStatus) -> None:
        """Transition a specific step to a new status.

        Args:
            step_order: Step order number
            new_status: Target step status

        Raises:
            KeyError: If step not registered
            InvalidTransitionError: If transition not allowed

        """
        step = self.steps[step_order]
        step.transition(new_status)
        if new_status == StepStatus.STARTED:
            self.current_step = step_order
        elif new_status == StepStatus.RETRYING:
            step.attempt += 1

    def get_completed_steps(self) -> list[int]:
        """Return order numbers of all completed steps."""
        return [
            order for order, step in self.steps.items()
            if step.status == StepStatus.COMPLETED
        ]

    def get_failed_steps(self) -> list[int]:
        """Return order numbers of all failed steps."""
        return [
            order for order, step in self.steps.items()
            if step.status == StepStatus.FAILED
        ]

    @property
    def is_terminal(self) -> bool:
        """Check if workflow is in a terminal (final) state."""
        return self.status in {
            WorkflowStatus.COMPLETED,
            WorkflowStatus.CANCELLED,
            WorkflowStatus.ROLLED_BACK,
        }

    @property
    def progress(self) -> float:
        """Calculate workflow completion percentage (0.0-100.0)."""
        if not self.steps:
            return 0.0
        completed = len(self.get_completed_steps())
        return (completed / len(self.steps)) * 100.0


__all__ = [
    "InvalidTransitionError",
    "StepState",
    "StepStatus",
    "WorkflowState",
    "WorkflowStatus",
]
