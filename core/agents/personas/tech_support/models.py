"""
Data models for Technical Support.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class IssuePriority(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IssueCategory(Enum):
    BUG = "bug"
    CONFIGURATION = "configuration"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    ACCESS = "access"
    OTHER = "other"

class IssueStatus(Enum):
    NEW = "new"
    INVESTIGATING = "investigating"
    IN_PROGRESS = "in_progress"
    AWAITING_INFO = "awaiting_info"
    RESOLVED = "resolved"
    CLOSED = "closed"

@dataclass
class TechIssue:
    id: str
    client: str
    title: str
    category: IssueCategory
    priority: IssuePriority
    status: IssueStatus = IssueStatus.NEW
    specialist: str = ""
    resolution: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None
