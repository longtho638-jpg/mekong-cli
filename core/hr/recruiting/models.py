"""
Data models for Talent Acquisition.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class JobStatus(Enum):
    """Job posting status."""
    DRAFT = "draft"
    OPEN = "open"
    ON_HOLD = "on_hold"
    CLOSED = "closed"
    FILLED = "filled"

class CandidateStage(Enum):
    """Candidate pipeline stages."""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    TECHNICAL = "technical"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"

class JobType(Enum):
    """Job types."""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"

@dataclass
class JobPosting:
    """A job posting."""
    id: str
    title: str
    department: str
    job_type: JobType
    status: JobStatus = JobStatus.DRAFT
    salary_min: float = 0
    salary_max: float = 0
    posted_at: Optional[datetime] = None
    applications: int = 0

@dataclass
class Candidate:
    """A job candidate."""
    id: str
    name: str
    email: str
    job_id: str
    stage: CandidateStage = CandidateStage.APPLIED
    source: str = ""
    rating: int = 0  # 1-5 stars
    applied_at: datetime = field(default_factory=datetime.now)
    notes: str = ""

@dataclass
class Interview:
    """An interview scheduled."""
    id: str
    candidate_id: str
    interviewer: str
    scheduled_at: datetime
    interview_type: str = "video"
    completed: bool = False
    feedback: str = ""
    score: int = 0  # 1-10
