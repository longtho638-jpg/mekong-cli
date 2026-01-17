"""
Agent-related Pydantic models
"""

from typing import Optional
from pydantic import BaseModel, Field


class AgentTask(BaseModel):
    """Task for an agent"""
    agent_name: str = Field(..., description="Name of the agent to execute task")
    task: str = Field(..., description="Task description")
    priority: str = Field(default="normal", description="Task priority")


class AgentResponse(BaseModel):
    """Response from agent execution"""
    status: str = Field(..., description="Execution status")
    agent: str = Field(..., description="Agent name")
    task: str = Field(..., description="Original task")
    estimated_time: str = Field(..., description="Estimated completion time")
    job_id: str = Field(..., description="Unique job identifier")