"""
Data models and Enums for Client Portal Service.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ClientStatus(Enum):
    """Trạng thái lifecycle của client."""
    LEAD = "lead"
    PROSPECT = "prospect"
    ACTIVE = "active"
    PAUSED = "paused"
    CHURNED = "churned"

class ProjectStatus(Enum):
    """Trạng thái project."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class TaskStatus(Enum):
    """Trạng thái task."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class InvoiceStatus(Enum):
    """Trạng thái invoice."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"

@dataclass
class Client:
    """Client entity."""
    id: str
    name: str
    email: str
    company: str
    status: ClientStatus
    created_at: datetime
    portal_code: str
    notes: str = ""
    monthly_retainer: float = 0.0
    total_spent: float = 0.0

@dataclass
class ProjectTask:
    """Task trong project."""
    id: str
    name: str
    description: str
    status: TaskStatus
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assignee: str = "Team"

@dataclass
class Project:
    """Project entity."""
    id: str
    client_id: str
    name: str
    description: str
    status: ProjectStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    tasks: List[ProjectTask] = field(default_factory=list)
    budget: float = 0.0
    spent: float = 0.0

    @property
    def progress(self) -> float:
        if not self.tasks:
            return 0.0
        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        return (done / len(self.tasks)) * 100.0

    @property
    def is_on_budget(self) -> bool:
        return self.spent <= self.budget

@dataclass
class Invoice:
    """Invoice entity."""
    id: str
    client_id: str
    project_id: Optional[str]
    amount: float
    status: InvoiceStatus
    due_date: datetime
    paid_date: Optional[datetime] = None
    items: List[Dict[str, Any]] = field(default_factory=list)
    notes: str = ""

    @property
    def is_overdue(self) -> bool:
        if self.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > self.due_date

@dataclass
class Message:
    """Message entity."""
    id: str
    client_id: str
    sender: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    read: bool = False
