"""
RaaS API — Pydantic request/response models for task submission and polling.

Covers: TaskRequest, TaskResponse, TaskStatusResponse, AgentRunRequest,
AgentInfo so that raas_router.py stays thin and models are reusable.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """Lifecycle states of a submitted RaaS task."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    ROLLED_BACK = "rolled_back"


class TaskRequest(BaseModel):
    """Body for POST /v1/tasks — submit a goal for async execution."""

    goal: str = Field(..., min_length=1, description="High-level goal to execute")
    agent: Optional[str] = Field(None, description="Preferred agent name (e.g. 'git')")
    recipe: Optional[str] = Field(None, description="Path to recipe file to run directly")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Extra orchestrator options"
    )


class TaskResponse(BaseModel):
    """Immediate response to POST /v1/tasks."""

    task_id: str = Field(..., description="Unique task identifier")
    status: TaskStatus = Field(TaskStatus.PENDING, description="Current task status")
    tenant_id: str = Field(..., description="Resolved tenant from auth token")


class StepDetail(BaseModel):
    """Single step result within a completed task."""

    order: int
    title: str
    passed: bool
    exit_code: int
    summary: str


class TaskStatusResponse(BaseModel):
    """Full status + result for GET /v1/tasks/{id}."""

    task_id: str
    status: TaskStatus
    goal: str
    tenant_id: str
    total_steps: int = 0
    completed_steps: int = 0
    failed_steps: int = 0
    success_rate: float = 0.0
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    steps: List[StepDetail] = Field(default_factory=list)


class AgentInfo(BaseModel):
    """Metadata for a registered agent returned by GET /v1/agents."""

    name: str
    description: str


class AgentRunRequest(BaseModel):
    """Body for POST /v1/agents/{name}/run."""

    goal: str = Field(..., min_length=1, description="Goal to pass to the agent")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Extra options forwarded to the agent"
    )


class AgentRunResponse(BaseModel):
    """Result of POST /v1/agents/{name}/run."""

    agent: str
    status: str
    output: str
    errors: List[str] = Field(default_factory=list)


__all__ = [
    "TaskStatus",
    "TaskRequest",
    "TaskResponse",
    "StepDetail",
    "TaskStatusResponse",
    "AgentInfo",
    "AgentRunRequest",
    "AgentRunResponse",
]
