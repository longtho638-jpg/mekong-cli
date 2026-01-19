"""
AgentOps-related Pydantic models
"""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class OpsStatus(BaseModel):
    """Status of an AgentOps module"""

    name: str = Field(..., description="Ops module name")
    category: str = Field(..., description="Ops category")
    status: str = Field(default="ready", description="Module status")
    agents_count: int = Field(default=0, description="Number of agents")
    last_run: Optional[str] = Field(default=None, description="Last run timestamp")


class OpsExecuteRequest(BaseModel):
    """Request to execute an AgentOps action"""

    category: str = Field(..., description="Target category")
    action: str = Field(..., description="Action to execute")
    params: Dict[str, Any] = Field(default_factory=dict, description="Action parameters")


class OpsExecuteResponse(BaseModel):
    """Response from AgentOps execution"""

    category: str = Field(..., description="Executed category")
    action: str = Field(..., description="Executed action")
    success: bool = Field(..., description="Success status")
    result: Optional[Any] = Field(default=None, description="Execution result")
    error: Optional[str] = Field(default=None, description="Error message if failed")
