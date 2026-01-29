"""
Ticket Manager Data Models.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class Ticket:
    id: str
    subject: str
    description: str
    customer_id: str
    customer_name: str
    channel: str
    priority: Priority = Priority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    assignee: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    resolution_time: Optional[timedelta] = None
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.sla_deadline is None:
            sla_h = {Priority.URGENT: 2, Priority.HIGH: 8, Priority.MEDIUM: 24, Priority.LOW: 72}
            self.sla_deadline = self.created_at + timedelta(hours=sla_h[self.priority])
