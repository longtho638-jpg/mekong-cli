"""
Recruitment Agent Facade.
"""

from typing import Dict

from .engine import RecruitmentEngine
from .models import Candidate, CandidateStage, Job, JobStatus


class RecruitmentAgent(RecruitmentEngine):
    """Refactored Recruitment Agent."""

    def __init__(self):
        super().__init__()
        self.name = "Recruitment"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {
            "open_jobs": len([j for j in self.jobs.values() if j.status == JobStatus.OPEN]),
            "total_candidates": len(self.candidates),
        }


__all__ = ["RecruitmentAgent", "CandidateStage", "JobStatus", "Candidate", "Job"]
