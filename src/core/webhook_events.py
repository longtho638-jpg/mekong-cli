"""Mekong CLI - Webhook Event Payloads.

Pydantic models for all webhook event payloads sent to AgencyOS.
These schemas define the contract between Mekong CLI (OSS engine)
and AgencyOS (Commercial SaaS layer) for real-time event streaming.

Reference: Sprint 3.3 - Unification Bridge (Task 3.3)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


# =============================================================================
# BASE TYPES
# =============================================================================

MissionStatus = Literal["pending", "planning", "running", "completed", "failed", "cancelled"]
StepStatus = Literal["pending", "running", "completed", "failed", "skipped"]
Priority = Literal["low", "normal", "high", "critical"]


# =============================================================================
# MISSION LIFECYCLE EVENTS
# =============================================================================

class PlanStep(BaseModel):
    """Individual step in a mission plan."""

    order: int = Field(..., description="Execution order (0-indexed)")
    title: str = Field(..., description="Human-readable step description")
    agent: str = Field(..., description="Agent assigned to this step")
    params: dict[str, Any] = Field(default_factory=dict, description="Step parameters")
    estimated_duration: int = Field(0, description="Estimated seconds to complete")
    dependencies: list[int] = Field(
        default_factory=list, description="Dependent step orders"
    )


class MissionCreatedPayload(BaseModel):
    """Payload for mission.created event.

    Sent when a new mission is created via POST /v1/missions.
    AgencyOS uses this to update dashboard and credit billing.
    """

    mission_id: str = Field(..., description="Unique mission identifier")
    goal: str = Field(..., description="Natural language goal")
    tenant_id: str = Field(..., description="AgencyOS tenant ID")
    priority: Priority = Field(default="normal", description="Mission priority level")
    webhook_url: str | None = Field(None, description="Callback URL for results")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_credits: int = Field(1, description="Estimated credit cost")

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "goal": "Deploy landing page to Vercel",
                "tenant_id": "tenant_xyz",
                "priority": "normal",
                "webhook_url": "https://agencyos.app/webhooks/mekong",
                "created_at": "2026-03-10T15:30:00Z",
                "estimated_credits": 3,
            }
        }
    }


class PlanPayload(BaseModel):
    """Payload for mission.planning event.

    Sent when RecipePlanner generates execution steps.
    AgencyOS displays these steps in real-time progress UI.
    """

    mission_id: str = Field(..., description="Parent mission ID")
    plan_id: str = Field(..., description="Unique plan identifier")
    steps: list[PlanStep] = Field(..., description="Execution steps")
    total_estimated_duration: int = Field(
        0, description="Estimated duration in seconds"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "plan_id": "plan_def456",
                "steps": [
                    {
                        "order": 0,
                        "title": "Install dependencies",
                        "agent": "shell",
                        "estimated_duration": 30,
                    }
                ],
                "total_estimated_duration": 120,
            }
        }
    }


# =============================================================================
# STEP EXECUTION EVENTS
# =============================================================================

class StepStartPayload(BaseModel):
    """Payload for mission.step.started event.

    Sent when RecipeExecutor begins a step.
    AgencyOS shows "running" indicator in UI.
    """

    mission_id: str = Field(..., description="Parent mission ID")
    step_order: int = Field(..., description="Step order in plan")
    step_title: str = Field(..., description="Human-readable title")
    agent: str = Field(..., description="Executing agent name")
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    retry_count: int = Field(0, description="Retry attempt (0 = first try)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "step_order": 2,
                "step_title": "Run pytest",
                "agent": "tester",
                "started_at": "2026-03-10T15:32:00Z",
                "retry_count": 0,
            }
        }
    }


class StepDonePayload(BaseModel):
    """Payload for mission.step.completed event.

    Sent when a step completes successfully.
    AgencyOS updates progress bar and credits used.
    """

    mission_id: str = Field(..., description="Parent mission ID")
    step_order: int = Field(..., description="Step order in plan")
    step_title: str = Field(..., description="Human-readable title")
    exit_code: int = Field(0, description="Process exit code (0 = success)")
    duration_seconds: float = Field(..., description="Actual execution time")
    stdout: str = Field("", description="Standard output (truncated)")
    stderr: str = Field("", description="Standard error (truncated)")
    artifacts: list[str] = Field(
        default_factory=list, description="Generated file paths"
    )
    credits_used: int = Field(1, description="Credits consumed by this step")
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "step_order": 2,
                "step_title": "Run pytest",
                "exit_code": 0,
                "duration_seconds": 45.2,
                "stdout": "10 passed in 42.1s",
                "stderr": "",
                "artifacts": ["coverage.xml"],
                "credits_used": 1,
            }
        }
    }


class StepFailPayload(BaseModel):
    """Payload for mission.step.failed event.

    Sent when a step fails.
    AgencyOS triggers retry logic or refund if max retries exceeded.
    """

    mission_id: str = Field(..., description="Parent mission ID")
    step_order: int = Field(..., description="Step order in plan")
    step_title: str = Field(..., description="Human-readable title")
    error_message: str = Field(..., description="Error description")
    error_type: str = Field(..., description="Exception class name")
    exit_code: int = Field(..., description="Process exit code (non-zero)")
    duration_seconds: float = Field(..., description="Time until failure")
    retry_count: int = Field(..., description="Retry attempt number")
    max_retries: int = Field(3, description="Maximum retry attempts")
    retry_after_seconds: int | None = Field(
        None, description="Suggested wait time before retry"
    )
    failed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "step_order": 2,
                "step_title": "Run pytest",
                "error_message": "ModuleNotFoundError: No module named 'pytest'",
                "error_type": "ModuleNotFoundError",
                "exit_code": 1,
                "duration_seconds": 2.5,
                "retry_count": 0,
                "max_retries": 3,
                "retry_after_seconds": 5,
            }
        }
    }


# =============================================================================
# MISSION COMPLETION EVENTS
# =============================================================================

class MissionDonePayload(BaseModel):
    """Payload for mission.completed event.

    Sent when all steps complete successfully.
    AgencyOS finalizes billing, updates tenant credits, and notifies user.
    """

    mission_id: str = Field(..., description="Unique mission ID")
    goal: str = Field(..., description="Original goal")
    status: Literal["completed"] = "completed"
    total_duration_seconds: float = Field(..., description="Total execution time")
    total_steps: int = Field(..., description="Number of steps executed")
    successful_steps: int = Field(..., description="Steps completed successfully")
    failed_steps: int = Field(0, description="Steps that failed then recovered")
    total_credits_used: int = Field(..., description="Final credit cost")
    artifacts: list[str] = Field(
        default_factory=list, description="All generated file paths"
    )
    metrics: MissionMetrics = Field(..., description="Performance metrics")
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "goal": "Deploy landing page to Vercel",
                "status": "completed",
                "total_duration_seconds": 180.5,
                "total_steps": 5,
                "successful_steps": 5,
                "failed_steps": 0,
                "total_credits_used": 5,
                "artifacts": ["dist/index.html", "dist/style.css"],
                "completed_at": "2026-03-10T15:35:00Z",
            }
        }
    }


class MissionMetrics(BaseModel):
    """Execution metrics for mission completion."""

    llm_calls: int = Field(0, description="Total LLM API calls")
    llm_tokens_in: int = Field(0, description="Input tokens consumed")
    llm_tokens_out: int = Field(0, description="Output tokens consumed")
    self_heal_count: int = Field(0, description="Auto-recovery attempts")
    retry_count: int = Field(0, description="Total retries across all steps")
    cache_hits: int = Field(0, description="LLM cache hits")
    cache_misses: int = Field(0, description="LLM cache misses")

    @property
    def cache_hit_rate(self) -> float:
        """Cache hit rate (0.0 - 1.0)."""
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return self.cache_hits / total


class MissionFailPayload(BaseModel):
    """Payload for mission.failed event.

    Sent when mission fails after all retries exhausted.
    AgencyOS triggers refund and notifies tenant.
    """

    mission_id: str = Field(..., description="Unique mission ID")
    goal: str = Field(..., description="Original goal")
    status: Literal["failed"] = "failed"
    error_message: str = Field(..., description="Final error description")
    error_type: str = Field(..., description="Exception class name")
    failed_step_order: int = Field(..., description="Step that caused failure")
    total_duration_seconds: float = Field(..., description="Time until failure")
    partial_steps_completed: int = Field(
        0, description="Steps completed before failure"
    )
    credits_refunded: int = Field(
        ..., description="Credits to refund to tenant"
    )
    retry_exhausted: bool = Field(
        True, description="Whether all retries were attempted"
    )
    failed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "mission_id": "msn_abc123",
                "goal": "Deploy landing page to Vercel",
                "status": "failed",
                "error_message": "Build failed: TypeScript errors in 3 files",
                "error_type": "BuildError",
                "failed_step_order": 3,
                "total_duration_seconds": 95.2,
                "partial_steps_completed": 3,
                "credits_refunded": 5,
                "retry_exhausted": True,
            }
        }
    }


# =============================================================================
# BILLING EVENTS
# =============================================================================

class CreditsLowPayload(BaseModel):
    """Payload for credits.low event.

    Sent when tenant credit balance drops below threshold (< 10).
    AgencyOS prompts user to purchase more credits.
    """

    tenant_id: str = Field(..., description="AgencyOS tenant ID")
    current_balance: int = Field(..., description="Remaining credits")
    threshold: int = Field(10, description="Low balance threshold")
    recommended_top_up: int = Field(100, description="Suggested purchase amount")
    last_mission_cost: int = Field(
        0, description="Credits used by last mission"
    )
    warned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "json_schema_extra": {
            "example": {
                "tenant_id": "tenant_xyz",
                "current_balance": 8,
                "threshold": 10,
                "recommended_top_up": 100,
                "last_mission_cost": 5,
                "warned_at": "2026-03-10T15:40:00Z",
            }
        }
    }


# =============================================================================
# EVENT TYPE MAPPING
# =============================================================================

# Central registry mapping event names to payload types
# Used for webhook validation and SDK type hints

WEBHOOK_EVENT_PAYLOADS: dict[str, type[BaseModel]] = {
    "mission.created": MissionCreatedPayload,
    "mission.planning": PlanPayload,
    "mission.step.started": StepStartPayload,
    "mission.step.completed": StepDonePayload,
    "mission.step.failed": StepFailPayload,
    "mission.completed": MissionDonePayload,
    "mission.failed": MissionFailPayload,
    "credits.low": CreditsLowPayload,
}


__all__ = [
    # Base types
    "MissionStatus",
    "StepStatus",
    "Priority",
    # Mission lifecycle payloads
    "MissionCreatedPayload",
    "PlanPayload",
    "PlanStep",
    # Step execution payloads
    "StepStartPayload",
    "StepDonePayload",
    "StepFailPayload",
    # Mission completion payloads
    "MissionDonePayload",
    "MissionMetrics",
    "MissionFailPayload",
    # Billing payloads
    "CreditsLowPayload",
    # Event registry
    "WEBHOOK_EVENT_PAYLOADS",
]
