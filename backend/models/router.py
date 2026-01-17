"""
Router-related Pydantic models
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class RouterRequest(BaseModel):
    """Request for task routing"""
    task: str = Field(..., description="Task description")
    complexity: Optional[str] = Field(default=None, description="Task complexity")
    tokens: Optional[int] = Field(default=None, description="Token count")


class RouterResponse(BaseModel):
    """Response from task routing"""
    provider: str = Field(..., description="Recommended AI provider")
    model: str = Field(..., description="Recommended model")
    estimated_cost: float = Field(..., description="Estimated cost")
    reason: str = Field(..., description="Routing reason")
    task_analysis: Dict[str, str] = Field(..., description="Task analysis")