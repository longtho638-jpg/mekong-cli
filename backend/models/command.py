"""
Command-related Pydantic models
"""

from typing import Optional
from pydantic import BaseModel, Field


class CommandRequest(BaseModel):
    """Base request for command execution"""
    prompt: str = Field(..., description="Command prompt")
    vibe: Optional[str] = Field(default="neutral", description="Vibe setting")
    override_provider: Optional[str] = Field(default=None, description="Override AI provider")


class CommandResponse(BaseModel):
    """Response from command execution"""
    command: str = Field(..., description="Command identifier")
    section: str = Field(..., description="Command section")
    status: str = Field(..., description="Execution status")
    prompt: str = Field(..., description="Original prompt")
    output_format: str = Field(..., description="Output format type")