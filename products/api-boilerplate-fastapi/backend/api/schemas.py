from pydantic import BaseModel
from typing import Optional

class CommandRequest(BaseModel):
    """Base request for command execution"""
    prompt: str
    vibe: Optional[str] = "neutral"
    override_provider: Optional[str] = None

class AgentTask(BaseModel):
    """Task for an agent"""
    agent_name: str
    task: str
    priority: str = "normal"

class VibeRequest(BaseModel):
    """Request to set vibe"""
    region: str
    location: Optional[str] = None
