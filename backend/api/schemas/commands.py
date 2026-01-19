"""
Command and Agent Schemas
==========================

Schemas for command execution and agent tasks.
"""

from typing import Optional

from pydantic import BaseModel, Field


class CommandRequest(BaseModel):
    """Base request for command execution."""

    prompt: str = Field(..., min_length=1, max_length=10000, description="Command prompt")
    vibe: Optional[str] = Field(default="neutral", description="Vibe setting")
    override_provider: Optional[str] = Field(default=None, description="Override AI provider")


class AgentTask(BaseModel):
    """Task for an agent."""

    agent_name: str = Field(..., min_length=1, max_length=100, description="Agent name")
    task: str = Field(..., min_length=1, max_length=10000, description="Task description")
    priority: str = Field(default="normal", description="Task priority")
