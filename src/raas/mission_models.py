"""Enums, dataclasses, and Pydantic models for RaaS missions."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class MissionStatus(str, Enum):
    """Lifecycle states for a mission record."""

    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class MissionComplexity(str, Enum):
    """Complexity tier controlling credit consumption.

    Values map directly to keys in MISSION_COSTS (credits.py).

    Credits per tier:
        simple   → 1 credit
        standard → 3 credits
        complex  → 5 credits
    """

    simple = "simple"
    standard = "standard"
    complex = "complex"


@dataclass
class MissionRecord:
    """Mutable in-memory representation of a persisted mission row.

    Attributes:
        id: UUID4 string primary key.
        tenant_id: Owning tenant UUID4.
        goal: Raw goal text supplied by the caller.
        status: Current lifecycle state.
        complexity: Complexity tier chosen at creation time.
        credits_cost: Credits debited when the mission was created.
        created_at: ISO-8601 UTC timestamp of creation.
        started_at: ISO-8601 UTC timestamp when execution began (optional).
        completed_at: ISO-8601 UTC timestamp of final state (optional).
        error_message: Failure description when status == failed (optional).
    """

    id: str
    tenant_id: str
    goal: str
    status: MissionStatus
    complexity: MissionComplexity
    credits_cost: int
    created_at: str
    started_at: Optional[str] = field(default=None)
    completed_at: Optional[str] = field(default=None)
    error_message: Optional[str] = field(default=None)


class CreateMissionRequest(BaseModel):
    """Payload accepted by POST /missions.

    Attributes:
        goal: Natural-language description of the mission objective.
        complexity: Optional explicit complexity override.  When omitted the
            service auto-detects based on goal length.
    """

    goal: str = Field(..., min_length=3, description="Mission objective (min 3 chars)")
    complexity: Optional[MissionComplexity] = Field(
        default=None,
        description="Complexity tier override (auto-detected when omitted)",
    )


class MissionResponse(BaseModel):
    """Shape returned to callers for any mission-related endpoint.

    Attributes:
        id: Mission UUID4.
        status: Current lifecycle state.
        goal: Original goal text.
        complexity: Assigned complexity tier.
        credits_cost: Credits debited for this mission.
        created_at: ISO-8601 UTC creation timestamp.
        started_at: ISO-8601 UTC start timestamp (nullable).
        completed_at: ISO-8601 UTC completion timestamp (nullable).
        error_message: Failure detail (nullable).
        logs_url: Optional relative URL to fetch execution logs.
    """

    id: str
    status: MissionStatus
    goal: str
    complexity: MissionComplexity
    credits_cost: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    logs_url: Optional[str] = None

    @classmethod
    def from_record(
        cls,
        record: MissionRecord,
        *,
        logs_url: Optional[str] = None,
    ) -> "MissionResponse":
        """Construct a response from a :class:`MissionRecord`.

        Args:
            record: The mission dataclass instance.
            logs_url: Optional URL to prepend to the response.

        Returns:
            A fully populated :class:`MissionResponse`.
        """
        return cls(
            id=record.id,
            status=record.status,
            goal=record.goal,
            complexity=record.complexity,
            credits_cost=record.credits_cost,
            created_at=record.created_at,
            started_at=record.started_at,
            completed_at=record.completed_at,
            error_message=record.error_message,
            logs_url=logs_url,
        )
