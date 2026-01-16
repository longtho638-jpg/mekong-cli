"""
Recruitment Agent - Hiring Pipeline Management
Manages job postings, candidates, and offers.
"""

from dataclasses import dataclass
from typing import Dict
from datetime import datetime
from enum import Enum
import random


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
    """Job candidate"""
    id: str
    name: str
    email: str
    job_id: str
    stage: CandidateStage = CandidateStage.APPLIED
    rating: int = 0  # 1-5 stars
    resume_url: str = ""
    notes: str = ""
    applied_at: datetime = None
    
    def __post_init__(self):
        if self.applied_at is None:
            self.applied_at = datetime.now()


@dataclass
class Job:
    """Job posting"""
    id: str
    title: str
    department: str
    location: str
    salary_range: str
    status: JobStatus = JobStatus.DRAFT
    hiring_manager: str = ""
    candidates_count: int = 0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class RecruitmentAgent:
    """
    Recruitment Agent - Quản lý Tuyển dụng
    
    Responsibilities:
    - Post jobs
    - Track candidates
    - Schedule interviews
    - Manage offers
    """
    
    def __init__(self):
        self.name = "Recruitment"
        self.status = "ready"
        self.jobs: Dict[str, Job] = {}
        self.candidates: Dict[str, Candidate] = {}
        
    def create_job(
        self,
        title: str,
        department: str,
        location: str,
        salary_range: str,
        hiring_manager: str = ""
    ) -> Job:
        """Create job posting"""
        job_id = f"job_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        job = Job(
            id=job_id,
            title=title,
            department=department,
            location=location,
            salary_range=salary_range,
            status=JobStatus.OPEN,
            hiring_manager=hiring_manager
        )
        
        self.jobs[job_id] = job
        return job
    
    def add_candidate(
        self,
        name: str,
        email: str,
        job_id: str,
        rating: int = 0
    ) -> Candidate:
        """Add candidate to pipeline"""
        candidate_id = f"candidate_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        candidate = Candidate(
            id=candidate_id,
            name=name,
            email=email,
            job_id=job_id,
            rating=rating
        )
        
        self.candidates[candidate_id] = candidate
        
        # Update job candidate count
        if job_id in self.jobs:
            self.jobs[job_id].candidates_count += 1
        
        return candidate
    
    def advance_candidate(self, candidate_id: str, stage: CandidateStage) -> Candidate:
        """Move candidate to next stage"""
        if candidate_id not in self.candidates:
            raise ValueError(f"Candidate not found: {candidate_id}")
            
        candidate = self.candidates[candidate_id]
        candidate.stage = stage
        
        return candidate
    
    def hire(self, candidate_id: str) -> Candidate:
        """Hire candidate"""
        candidate = self.advance_candidate(candidate_id, CandidateStage.HIRED)
        
        # Close job
        if candidate.job_id in self.jobs:
            self.jobs[candidate.job_id].status = JobStatus.FILLED
        
        return candidate
    
    def get_pipeline(self, job_id: str = None) -> Dict[str, int]:
        """Get hiring pipeline"""
        candidates = list(self.candidates.values())
        if job_id:
            candidates = [c for c in candidates if c.job_id == job_id]
            
        return {
            stage.value: len([c for c in candidates if c.stage == stage])
            for stage in CandidateStage
        }
    
    def get_stats(self) -> Dict:
        """Get recruitment statistics"""
        jobs = list(self.jobs.values())
        candidates = list(self.candidates.values())
        
        return {
            "open_jobs": len([j for j in jobs if j.status == JobStatus.OPEN]),
            "total_candidates": len(candidates),
            "in_pipeline": len([c for c in candidates if c.stage not in [CandidateStage.HIRED, CandidateStage.REJECTED]]),
            "hired": len([c for c in candidates if c.stage == CandidateStage.HIRED]),
            "avg_rating": sum(c.rating for c in candidates) / len(candidates) if candidates else 0
        }


# Demo
if __name__ == "__main__":
    agent = RecruitmentAgent()
    
    print("📋 Recruitment Agent Demo\n")
    
    # Create jobs
    j1 = agent.create_job("Senior Engineer", "Engineering", "Ho Chi Minh", "$2000-3000", "Manager_001")
    j2 = agent.create_job("Product Manager", "Product", "Ha Noi", "$2500-3500", "Manager_002")
    
    print(f"📋 Job: {j1.title}")
    print(f"   Department: {j1.department}")
    print(f"   Salary: {j1.salary_range}")
    
    # Add candidates
    c1 = agent.add_candidate("Nguyen A", "a@email.com", j1.id, rating=5)
    c2 = agent.add_candidate("Tran B", "b@email.com", j1.id, rating=4)
    c3 = agent.add_candidate("Le C", "c@email.com", j1.id, rating=3)
    
    # Advance pipeline
    agent.advance_candidate(c1.id, CandidateStage.INTERVIEW)
    agent.advance_candidate(c1.id, CandidateStage.OFFER)
    agent.hire(c1.id)
    
    print(f"\n✅ Hired: {c1.name}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Open Jobs: {stats['open_jobs']}")
    print(f"   In Pipeline: {stats['in_pipeline']}")
    print(f"   Hired: {stats['hired']}")
