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
    title: str
    passed: bool
    exit_code: int
    summary: str


class HumanSummary(BaseModel):
    """Non-dev friendly summary in both languages"""
    en: str
    vi: str


class CommandResponse(BaseModel):
    """Response returned to the cloud caller"""
    status: str
    goal: str
    total_steps: int
    completed_steps: int
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
    has_git: bool


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
    job_type: str = Field("interval", pattern="^(interval|daily)$")
    interval_seconds: int = Field(300, ge=10)
    daily_time: str = Field("09:00")
    enabled: bool
    last_run: Optional[float] = None
    next_run: Optional[float] = None
    run_count: int = 0


class ScheduleAddRequest(BaseModel):
    """Request to add a new scheduled job"""
    name: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)
    job_type: str = Field("interval", pattern="^(interval|daily)$")
    interval_seconds: int = Field(300, ge=10)
    daily_time: str = Field("09:00")


class MemoryEntryInfo(BaseModel):
    """Memory entry returned by API"""
    goal: str
    status: str
    timestamp: float
    duration_ms: float
    error_summary: str
    recipe_used: str


class MemoryStatsResponse(BaseModel):
    """Memory aggregate statistics"""
    total: int
    success_rate: float
    top_goals: List[str]
    recent_failures: int


class NLUParseRequest(BaseModel):
    """NLU parse request"""
    goal: str = Field(..., min_length=1)


class NLUParseResponse(BaseModel):
    """NLU parse response"""
    intent: str
    confidence: float
    entities: Dict[str, str]
    suggested_recipe: str


class RecipeGenerateRequest(BaseModel):
    """Recipe generation request"""
    goal: str = Field(..., min_length=1)
    steps: List[str] = Field(default_factory=list)


class RecipeGenerateResponse(BaseModel):
    """Recipe generation response"""
    name: str
    content: str
    source: str
    valid: bool
    path: str


class RecipeValidateRequest(BaseModel):
    """Recipe validation request"""
    content: str = Field(..., min_length=1)


class RecipeValidateResponse(BaseModel):
    """Recipe validation response"""
    valid: bool
    errors: List[str]


class AutoRecipeInfo(BaseModel):
    """Auto-generated recipe info"""
    name: str
    path: str


class GovernanceCheckRequest(BaseModel):
    """Request to check governance classification."""
    goal: str = Field(..., min_length=1)


class HaltRequest(BaseModel):
    """Request to halt autonomous operations."""
    token: str = Field(..., min_length=1)
