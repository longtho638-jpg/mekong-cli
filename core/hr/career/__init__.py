"""
Career Development Facade.
"""
import logging
from typing import Any, Dict

from .models import CareerLevel, CareerPath, Skill, SkillLevel, Training, TrainingType
from .pathways import PathwayManager
from .reviews import ReviewManager
from .skills import SkillManager

logger = logging.getLogger(__name__)

class CareerDevelopment(SkillManager, PathwayManager, ReviewManager):
    """
    Career Development System.
    Orchestrates employee growth, skill acquisition, and training programs.
    """

    def __init__(self, agency_name: str):
        # Multiple inheritance init
        SkillManager.__init__(self)
        PathwayManager.__init__(self)
        ReviewManager.__init__(self)
        self.agency_name = agency_name
        logger.info(f"Career Development initialized for {agency_name}")

    def get_stats(self) -> Dict[str, Any]:
        """Aggregate development statistics."""
        total_skills = sum(len(p.skills) for p in self.career_paths.values())
        all_skills = [s for p in self.career_paths.values() for s in p.skills]
        avg_progress = sum(s.progress for s in all_skills) / total_skills if total_skills else 0.0

        total_completions = sum(len(t.completed_by) for t in self.trainings.values())
        training_investment = sum(t.cost for t in self.trainings.values())

        return {
            "career_paths": len(self.career_paths),
            "total_skills": total_skills,
            "avg_progress": avg_progress,
            "trainings": len(self.trainings),
            "completions": total_completions,
            "investment": training_investment,
        }

    def format_dashboard(self) -> str:
        """Render Career Development Dashboard."""
        stats = self.get_stats()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 CAREER DEVELOPMENT{' ' * 39}║",
            f"║  {stats['career_paths']} paths │ {stats['total_skills']} skills │ {stats['avg_progress']:.0f}% avg progress{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 ACTIVE CAREER PATHS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        level_icons = {
            CareerLevel.JUNIOR: "🌱",
            CareerLevel.MID: "🌿",
            CareerLevel.SENIOR: "🌳",
            CareerLevel.LEAD: "⭐",
            CareerLevel.MANAGER: "👑",
            CareerLevel.DIRECTOR: "🏆",
        }

        for p in list(self.career_paths.values())[:4]:
            c_icon = level_icons.get(p.current_level, "⚪")
            t_icon = level_icons.get(p.target_level, "⭐")
            name_display = (p.employee[:12] + "..") if len(p.employee) > 14 else p.employee

            lines.append(
                f"║  {c_icon}→{t_icon} {name_display:<14} │ {p.current_role[:10]:<10} → {p.target_role[:10]:<10}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📚 TRAINING PROGRAMS                                     ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        type_icons = {
            TrainingType.COURSE: "📖",
            TrainingType.WORKSHOP: "🔧",
            TrainingType.CERTIFICATION: "🏅",
            TrainingType.MENTORSHIP: "👥",
            TrainingType.CONFERENCE: "🎤",
        }

        for t in list(self.trainings.values())[:4]:
            icon = type_icons.get(t.training_type, "📚")
            name_display = (t.name[:22] + "..") if len(t.name) > 24 else t.name
            lines.append(
                f"║  {icon} {name_display:<24} │ {t.duration_hours:>3}h │ {len(t.completed_by):>2} done  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  💡 SKILL PROGRESS                                        ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        skill_icons = {
            SkillLevel.BEGINNER: "🔵",
            SkillLevel.INTERMEDIATE: "🟢",
            SkillLevel.ADVANCED: "🟡",
            SkillLevel.EXPERT: "🔴",
        }

        all_skills = [s for p in self.career_paths.values() for s in p.skills]
        for s in all_skills[:4]:
            icon = skill_icons.get(s.level, "⚪")
            bar = "█" * int(s.progress / 20) + "░" * (5 - int(s.progress / 20))
            name_display = (s.name[:18] + "..") if len(s.name) > 20 else s.name
            lines.append(f"║  {icon} {name_display:<20} │ {bar} │ {s.progress:>3}%       ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [📈 Paths]  [📚 Training]  [💡 Skills]                   ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  Castle {self.agency_name[:40]:<40} - Growth!             ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)
