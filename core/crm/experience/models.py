"""
Data models and Enums for Client Experience.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ProjectStatus(Enum):
    """Project lifecycle status."""
    DISCOVERY = "discovery"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"

class ServiceType(Enum):
    """Service categories offered by the agency."""
    SEO = "seo"
    PPC = "ppc"
    CONTENT = "content"
    SOCIAL = "social"
    BRANDING = "branding"
    WEBSITE = "website"

@dataclass
class Client:
    """An agency client entity."""
    id: str
    company: str
    contact_name: str
    contact_email: str
    phone: Optional[str] = None
    industry: str = "N/A"
    onboarded_at: datetime = field(default_factory=datetime.now)
    notes: str = ""

@dataclass
class Project:
    """A client project record."""
    id: str
    client_id: str
    name: str
    service: ServiceType
    status: ProjectStatus = ProjectStatus.DISCOVERY
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    budget: float = 0.0
    deliverables: List[str] = field(default_factory=list)
    progress: int = 0  # 0-100

    def __post_init__(self):
        if not 0 <= self.progress <= 100:
            raise ValueError("Progress must be between 0 and 100")

@dataclass
class Report:
    """A generated performance report for a client."""
    id: str
    client_id: str
    project_id: str
    period: str  # e.g., "2024-12"
    metrics: Dict[str, Any] = field(default_factory=dict)
    generated_at: datetime = field(default_factory=datetime.now)
