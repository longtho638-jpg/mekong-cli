from pydantic import BaseModel
from typing import Optional, Literal
from .enums import TaskStatus, TaskPriority

class Task(BaseModel):
    id: str
    project_id: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    order: float
    agent_assigned: Optional[str] = None
