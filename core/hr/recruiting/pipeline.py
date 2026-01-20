"""
Job and Candidate pipeline management logic.
"""
import uuid
from datetime import datetime
from typing import Dict

from .models import Candidate, CandidateStage, JobPosting, JobStatus, JobType


class PipelineManager:
    def __init__(self):
        self.jobs: Dict[str, JobPosting] = {}
        self.candidates: Dict[str, Candidate] = {}

    def create_job(
        self,
        title: str,
        department: str,
        job_type: JobType = JobType.FULL_TIME,
        salary_min: float = 0,
        salary_max: float = 0,
    ) -> JobPosting:
        """Create a job posting."""
        job = JobPosting(
            id=f"JOB-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            department=department,
            job_type=job_type,
            salary_min=salary_min,
            salary_max=salary_max,
        )
        self.jobs[job.id] = job
        return job

    def post_job(self, job: JobPosting):
        """Post a job (make it open)."""
        job.status = JobStatus.OPEN
        job.posted_at = datetime.now()

    def add_candidate(
        self, name: str, email: str, job: JobPosting, source: str = "website"
    ) -> Candidate:
        """Add a new candidate."""
        candidate = Candidate(
            id=f"CAN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            email=email,
            job_id=job.id,
            source=source,
        )
        self.candidates[candidate.id] = candidate
        job.applications += 1
        return candidate

    def move_candidate(self, candidate: Candidate, stage: CandidateStage):
        """Move candidate to new stage."""
        candidate.stage = stage

    def hire_candidate(self, candidate: Candidate, job: JobPosting):
        """Hire a candidate."""
        candidate.stage = CandidateStage.HIRED
        job.status = JobStatus.FILLED
