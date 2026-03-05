"""Gateway request/response models"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

VERSION = "1.0.0"


class CommandRequest(BaseModel):
    """Incoming command from the cloud brain"""
    goal: str = Field(..., min_length=1, description="High-level goal to execute")
    token: str = Field(..., min_length=1, description="API authentication token")


class StepSummary(BaseModel):
    """Summary of a single execution step"""
    order: int
    status: str
    result: str


class HumanSummary(BaseModel):
    """Non-dev friendly summary in both languages"""
    en: str
    vi: str


class CommandResponse(BaseModel):
    """Response returned to the cloud caller"""
    status: str
    goal: str
    success: bool
    total_steps: int
    successful_steps: int
    failed_steps: int
    success_rate: float
    errors: List[str]
    warnings: List[str]
    steps: List[StepSummary]
    trace: Optional[Dict[str, Any]] = None
    human_summary: Optional[HumanSummary] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "ok"
    version: str = VERSION
    engine: str = "Plan-Execute-Verify"


class PresetAction(BaseModel):
    """A preset one-button action for the dashboard"""
    id: str
    label: str
    description: str
    goal: str
    icon: str
    color: str


class ProjectInfo(BaseModel):
    """A project discovered in the apps/ directory"""
    name: str
    path: str
    has_claude_md: bool


class SwarmNodeInfo(BaseModel):
    """Swarm node info returned by API"""
    id: str
    name: str
    host: str
    port: int
    token: str
    registered_at: str
    last_seen: str
    status: str


class SwarmRegisterRequest(BaseModel):
    """Request to register a new swarm node"""
    name: str = Field(..., min_length=1)
    host: str = Field(..., min_length=1)
    port: int = Field(8000, ge=1, le=65535)
    token: str = Field(..., min_length=1)


class SwarmDispatchRequest(BaseModel):
    """Request to dispatch a goal to a remote node"""
    node_id: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)


class ScheduleJobInfo(BaseModel):
    """Schedule job info returned by API"""
    id: str
    name: str
    goal: str
    schedule: str
    enabled: bool
    last_run: Optional[str] = None
    next_run: Optional[str] = None
