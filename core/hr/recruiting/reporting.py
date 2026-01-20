"""
Hiring metrics and reporting logic.
"""
from typing import Any, Dict, List

from .models import Candidate, CandidateStage, Interview, JobPosting, JobStatus


class ReportingManager:
    def __init__(self):
        self.jobs: Dict[str, JobPosting] = {}
        self.candidates: Dict[str, Candidate] = {}
        self.interviews: List[Interview] = []

    def get_stats(self) -> Dict[str, Any]:
        """Get hiring statistics."""
        open_jobs = sum(1 for j in self.jobs.values() if j.status == JobStatus.OPEN)
        total_candidates = len(self.candidates)
        hired = sum(1 for c in self.candidates.values() if c.stage == CandidateStage.HIRED)
        in_pipeline = sum(
            1
            for c in self.candidates.values()
            if c.stage not in [CandidateStage.HIRED, CandidateStage.REJECTED]
        )
        pending_interviews = sum(1 for i in self.interviews if not i.completed)

        # Calculate average time to hire (simulated)
        avg_days = 14  # Would calculate from real data

        return {
            "open_jobs": open_jobs,
            "total_candidates": total_candidates,
            "hired": hired,
            "in_pipeline": in_pipeline,
            "pending_interviews": pending_interviews,
            "avg_days_to_hire": avg_days,
        }
