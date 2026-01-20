"""
Recruitment Agent Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CandidateStage(Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    FINAL = "final"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"

class JobStatus(Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAUSED = "paused"
    FILLED = "filled"
    CLOSED = "closed"

@dataclass
class Candidate:
    id: str
    name: str
    email: str
    job_id: str
    stage: CandidateStage = CandidateStage.APPLIED
    rating: int = 0
    applied_at: datetime = field(default_factory=datetime.now)

@dataclass
class Job:
    id: str
    title: str
    department: str
    location: str
    salary_range: str
    status: JobStatus = JobStatus.DRAFT
    candidates_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
