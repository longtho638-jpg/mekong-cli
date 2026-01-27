from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .enums import TaskPriority, TaskStatus


class Task(BaseModel):
    id: str = Field(description="UUID")
    title: str = ""
    description: Optional[str] = None
    project_id: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    order: float = 0.0
    agent_assigned: Optional[str] = None

    # Extended fields
    assignee_id: Optional[str] = None
    tags: List[str] = []
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class KanbanCard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    assignee_id: Optional[str] = None
    tags: List[str] = []
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    order: float
    metadata: Dict[str, Any] = {}

class KanbanColumn(BaseModel):
    id: str
    title: str
    status: TaskStatus
    order: int
    cards: List[KanbanCard]

class KanbanBoard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    columns: List[KanbanColumn]
    created_at: datetime
    updated_at: datetime

class CreateCardRequest(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None

class UpdateCardRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    order: Optional[float] = None
