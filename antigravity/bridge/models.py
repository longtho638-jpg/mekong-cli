"""
Vibe Kanban Bridge Models.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TaskModel(BaseModel):
    id: str = Field(..., description="Unique task ID")
    title: str
    description: str = ""
    agent_assigned: Literal["planner", "money-maker", "client-magnet", "fullstack-dev", "strategist", "jules", "unassigned"] = "unassigned"
    status: Literal["todo", "in_progress", "review", "done"] = "todo"
    priority: Literal["P1", "P2", "P3"] = "P2"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
