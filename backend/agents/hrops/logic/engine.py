"""
Recruitment Agent engine logic.
"""
import random
from datetime import datetime
from typing import Dict, List

from .models import Candidate, CandidateStage, Job, JobStatus


class RecruitmentEngine:
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.candidates: Dict[str, Candidate] = {}

    def create_job(self, title: str, department: str, location: str, salary: str) -> Job:
        jid = f"job_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        job = Job(id=jid, title=title, department=department, location=location, salary_range=salary, status=JobStatus.OPEN)
        self.jobs[jid] = job
        return job

    def add_candidate(self, name: str, email: str, job_id: str, rating: int = 0) -> Candidate:
        cid = f"candidate_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        candidate = Candidate(id=cid, name=name, email=email, job_id=job_id, rating=rating)
        self.candidates[cid] = candidate
        if job_id in self.jobs: self.jobs[job_id].candidates_count += 1
        return candidate
精
