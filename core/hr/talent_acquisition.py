"""
🔍 Talent Acquisition - Recruiting & Hiring
=============================================

Manage the entire hiring pipeline.
Hire the best talent!

Features:
- Job posting management
- Candidate pipeline
- Interview scheduling
- Hiring metrics
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional


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


class TalentAcquisition:
    """
    Talent Acquisition System.

    Build your dream team.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.jobs: Dict[str, JobPosting] = {}
        self.candidates: Dict[str, Candidate] = {}
        self.interviews: List[Interview] = []

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

    def schedule_interview(
        self,
        candidate: Candidate,
        interviewer: str,
        hours_from_now: int = 24,
        interview_type: str = "video",
    ) -> Interview:
        """Schedule an interview."""
        interview = Interview(
            id=f"INT-{uuid.uuid4().hex[:6].upper()}",
            candidate_id=candidate.id,
            interviewer=interviewer,
            scheduled_at=datetime.now() + timedelta(hours=hours_from_now),
            interview_type=interview_type,
        )
        self.interviews.append(interview)
        return interview

    def complete_interview(self, interview: Interview, score: int, feedback: str = ""):
        """Complete an interview with feedback."""
        interview.completed = True
        interview.score = score
        interview.feedback = feedback

    def hire_candidate(self, candidate: Candidate, job: JobPosting):
        """Hire a candidate."""
        candidate.stage = CandidateStage.HIRED
        job.status = JobStatus.FILLED

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

    def format_dashboard(self) -> str:
        """Format talent acquisition dashboard."""
        stats = self.get_stats()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🔍 TALENT ACQUISITION                                    ║",
            f"║  {stats['open_jobs']} open │ {stats['in_pipeline']} pipeline │ {stats['hired']} hired  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 OPEN POSITIONS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]

        status_icons = {"draft": "📝", "open": "🟢", "on_hold": "⏸️", "closed": "🔴", "filled": "✅"}
        type_icons = {
            "full_time": "👔",
            "part_time": "⏰",
            "contract": "📄",
            "internship": "🎓",
            "freelance": "💼",
        }

        for job in list(self.jobs.values())[:4]:
            s_icon = status_icons.get(job.status.value, "⚪")
            t_icon = type_icons.get(job.job_type.value, "👔")
            lines.append(
                f"║  {s_icon} {t_icon} {job.title[:18]:<18} │ {job.applications:>3} apps │ {job.department[:8]:<8}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  👥 CANDIDATE PIPELINE                                    ║",
                "║  ─────────────────────────────────────────────────────── ║",
            ]
        )

        stage_counts = {}
        for stage in CandidateStage:
            stage_counts[stage.value] = sum(1 for c in self.candidates.values() if c.stage == stage)

        stage_icons = {
            "applied": "📥",
            "screening": "🔍",
            "interview": "🗣️",
            "technical": "💻",
            "offer": "📋",
            "hired": "✅",
            "rejected": "❌",
        }

        for stage in [
            CandidateStage.APPLIED,
            CandidateStage.SCREENING,
            CandidateStage.INTERVIEW,
            CandidateStage.OFFER,
        ]:
            count = stage_counts.get(stage.value, 0)
            icon = stage_icons.get(stage.value, "⚪")
            bar = "█" * min(10, count) + "░" * (10 - min(10, count))
            lines.append(f"║    {icon} {stage.value.title():<12} │ {bar} │ {count:>3}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  📅 UPCOMING INTERVIEWS                                   ║",
                "║  ─────────────────────────────────────────────────────── ║",
            ]
        )

        pending = [i for i in self.interviews if not i.completed][:3]
        for interview in pending:
            candidate = self.candidates.get(interview.candidate_id)
            name = candidate.name if candidate else "Unknown"
            time = interview.scheduled_at.strftime("%b %d %H:%M")
            lines.append(
                f"║    🗣️ {name[:15]:<15} │ {interview.interviewer[:10]:<10} │ {time:<10}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📊 HIRING METRICS                                        ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    ⏱️ Avg Days to Hire:    {stats['avg_days_to_hire']:>3}                          ║",
                f"║    📥 Total Candidates:    {stats['total_candidates']:>3}                          ║",
                f"║    ✅ Total Hired:         {stats['hired']:>3}                          ║",
                "║                                                           ║",
                "║  [📋 Jobs]  [👥 Candidates]  [📅 Interviews]              ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name} - Hire the best!                   ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ta = TalentAcquisition("Saigon Digital Hub")

    print("🔍 Talent Acquisition")
    print("=" * 60)
    print()

    j1 = ta.create_job("Senior Developer", "Engineering", JobType.FULL_TIME, 2000, 4000)
    j2 = ta.create_job("UI/UX Designer", "Design", JobType.FULL_TIME, 1500, 3000)
    j3 = ta.create_job("Marketing Manager", "Marketing", JobType.FULL_TIME, 1800, 3500)

    ta.post_job(j1)
    ta.post_job(j2)
    ta.post_job(j3)

    c1 = ta.add_candidate("Alex Nguyen", "alex@email.com", j1, "linkedin")
    c2 = ta.add_candidate("Sarah Tran", "sarah@email.com", j1, "referral")
    c3 = ta.add_candidate("Mike Chen", "mike@email.com", j2, "website")
    c4 = ta.add_candidate("Lisa Pham", "lisa@email.com", j1, "linkedin")

    ta.move_candidate(c1, CandidateStage.INTERVIEW)
    ta.move_candidate(c2, CandidateStage.SCREENING)
    ta.move_candidate(c3, CandidateStage.OFFER)

    i1 = ta.schedule_interview(c1, "Khoa (CTO)", 24)
    i2 = ta.schedule_interview(c3, "Sarah (Design Lead)", 48)

    print(ta.format_dashboard())
