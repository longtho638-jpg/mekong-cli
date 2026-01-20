"""
Talent Acquisition Facade.
"""
from typing import Any, Dict, List

from .models import Candidate, CandidateStage, Interview, JobPosting, JobStatus, JobType
from .pipeline import PipelineManager
from .reporting import ReportingManager
from .scheduling import SchedulingManager


class TalentAcquisition(PipelineManager, SchedulingManager, ReportingManager):
    """
    Talent Acquisition System.
    Build your dream team.
    """

    def __init__(self, agency_name: str):
        # Multiple inheritance init
        PipelineManager.__init__(self)
        SchedulingManager.__init__(self)
        ReportingManager.__init__(self)
        self.agency_name = agency_name

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
            time_str = interview.scheduled_at.strftime("%b %d %H:%M")
            lines.append(
                f"║    🗣️ {name[:15]:<15} │ {interview.interviewer[:10]:<10} │ {time_str:<10}  ║"
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
                f"║  Castle {self.agency_name} - Hire the best!                   ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)
