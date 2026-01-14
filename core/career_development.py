"""
📈 Career Development - Team Growth
=====================================

Develop team careers and skills.
Grow together!

Roles:
- Career pathing
- Skills assessment
- Training plans
- Performance tracking
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SkillLevel(Enum):
    """Skill proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CareerLevel(Enum):
    """Career levels."""
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"


class TrainingType(Enum):
    """Training types."""
    COURSE = "course"
    WORKSHOP = "workshop"
    CERTIFICATION = "certification"
    MENTORSHIP = "mentorship"
    CONFERENCE = "conference"


@dataclass
class Skill:
    """A skill being tracked for an employee."""
    id: str
    name: str
    category: str
    level: SkillLevel = SkillLevel.BEGINNER
    target_level: SkillLevel = SkillLevel.INTERMEDIATE
    _progress: int = 0  # 0-100

    @property
    def progress(self) -> int:
        return self._progress

    @progress.setter
    def progress(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("Progress must be between 0 and 100")
        self._progress = value


@dataclass
class CareerPath:
    """A career trajectory definition."""
    id: str
    employee: str
    current_role: str
    current_level: CareerLevel
    target_role: str
    target_level: CareerLevel
    skills: List[Skill] = field(default_factory=list)
    target_date: Optional[datetime] = None


@dataclass
class Training:
    """A training program entity."""
    id: str
    name: str
    training_type: TrainingType
    duration_hours: int
    cost: float = 0.0
    skills: List[str] = field(default_factory=list)
    completed_by: List[str] = field(default_factory=list)

    def __post_init__(self):
        if self.duration_hours < 0:
            raise ValueError("Duration cannot be negative")
        if self.cost < 0:
            raise ValueError("Cost cannot be negative")


class CareerDevelopment:
    """
    Career Development System.
    
    Orchestrates employee growth, skill acquisition, and training programs.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.career_paths: Dict[str, CareerPath] = {}
        self.trainings: Dict[str, Training] = {}
        logger.info(f"Career Development initialized for {agency_name}")
    
    def create_career_path(
        self,
        employee: str,
        current_role: str,
        current_level: CareerLevel,
        target_role: str,
        target_level: CareerLevel,
        months: int = 12
    ) -> CareerPath:
        """Define a new growth path for an employee."""
        if not employee:
            raise ValueError("Employee name required")

        path = CareerPath(
            id=f"CAR-{uuid.uuid4().hex[:6].upper()}",
            employee=employee,
            current_role=current_role,
            current_level=current_level,
            target_role=target_role,
            target_level=target_level,
            target_date=datetime.now() + timedelta(days=months * 30)
        )
        self.career_paths[path.id] = path
        logger.info(f"Career path created for {employee}: {current_role} -> {target_role}")
        return path
    
    def add_skill(
        self,
        path_id: str,
        skill_name: str,
        category: str,
        current: SkillLevel = SkillLevel.BEGINNER,
        target: SkillLevel = SkillLevel.INTERMEDIATE
    ) -> Optional[Skill]:
        """Attach a skill to a career path."""
        if path_id not in self.career_paths:
            logger.error(f"Career path {path_id} not found")
            return None

        skill = Skill(
            id=f"SKL-{uuid.uuid4().hex[:6].upper()}",
            name=skill_name,
            category=category,
            level=current,
            target_level=target
        )
        self.career_paths[path_id].skills.append(skill)
        logger.info(f"Skill '{skill_name}' added to {self.career_paths[path_id].employee}'s path")
        return skill
    
    def update_skill_progress(self, skill: Skill, progress: int, level: Optional[SkillLevel] = None):
        """Update progress and proficiency for a skill."""
        try:
            skill.progress = progress
            if level:
                skill.level = level
            logger.debug(f"Skill {skill.name} updated: {progress}%")
        except ValueError as e:
            logger.error(f"Invalid progress update: {e}")
    
    def add_training(
        self,
        name: str,
        training_type: TrainingType,
        hours: int,
        cost: float = 0.0,
        skills: Optional[List[str]] = None
    ) -> Training:
        """Register a new training program."""
        training = Training(
            id=f"TRN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            training_type=training_type,
            duration_hours=hours,
            cost=cost,
            skills=skills or []
        )
        self.trainings[training.id] = training
        logger.info(f"Training registered: {name} ({training_type.value})")
        return training
    
    def complete_training(self, training_id: str, employee: str) -> bool:
        """Log training completion for an employee."""
        if training_id not in self.trainings:
            return False
            
        t = self.trainings[training_id]
        if employee not in t.completed_by:
            t.completed_by.append(employee)
            logger.info(f"{employee} completed {t.name}")
            return True
        return False
    
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
            "investment": training_investment
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
            CareerLevel.DIRECTOR: "🏆"
        }
        
        for p in list(self.career_paths.values())[:4]:
            c_icon = level_icons.get(p.current_level, "⚪")
            t_icon = level_icons.get(p.target_level, "⭐")
            name_display = (p.employee[:12] + '..') if len(p.employee) > 14 else p.employee
            
            lines.append(f"║  {c_icon}→{t_icon} {name_display:<14} │ {p.current_role[:10]:<10} → {p.target_role[:10]:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📚 TRAINING PROGRAMS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        type_icons = {
            TrainingType.COURSE: "📖", 
            TrainingType.WORKSHOP: "🔧", 
            TrainingType.CERTIFICATION: "🏅",
            TrainingType.MENTORSHIP: "👥", 
            TrainingType.CONFERENCE: "🎤"
        }
        
        for t in list(self.trainings.values())[:4]:
            icon = type_icons.get(t.training_type, "📚")
            name_display = (t.name[:22] + '..') if len(t.name) > 24 else t.name
            lines.append(f"║  {icon} {name_display:<24} │ {t.duration_hours:>3}h │ {len(t.completed_by):>2} done  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 SKILL PROGRESS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        skill_icons = {
            SkillLevel.BEGINNER: "🔵", 
            SkillLevel.INTERMEDIATE: "🟢", 
            SkillLevel.ADVANCED: "🟡", 
            SkillLevel.EXPERT: "🔴"
        }
        
        all_skills = [s for p in self.career_paths.values() for s in p.skills]
        for s in all_skills[:4]:
            icon = skill_icons.get(s.level, "⚪")
            bar = "█" * int(s.progress / 20) + "░" * (5 - int(s.progress / 20))
            name_display = (s.name[:18] + '..') if len(s.name) > 20 else s.name
            lines.append(f"║  {icon} {name_display:<20} │ {bar} │ {s.progress:>3}%       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📈 Paths]  [📚 Training]  [💡 Skills]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Growth!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📈 Initializing Career Development...")
    print("=" * 60)
    
    try:
        cd = CareerDevelopment("Saigon Digital Hub")
        
        p1 = cd.create_career_path("Alex Nguyen", "Developer", CareerLevel.MID, "Tech Lead", CareerLevel.LEAD, 18)
        p2 = cd.create_career_path("Sarah Tran", "Designer", CareerLevel.JUNIOR, "Senior Designer", CareerLevel.SENIOR, 12)
        
        s1 = cd.add_skill(p1.id, "System Design", "Technical", SkillLevel.BEGINNER, SkillLevel.ADVANCED)
        s2 = cd.add_skill(p1.id, "Leadership", "Soft Skills", SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED)
        s3 = cd.add_skill(p2.id, "UX Research", "Design", SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE)
        
        if s1: cd.update_skill_progress(s1, 45)
        if s2: cd.update_skill_progress(s2, 70, SkillLevel.ADVANCED)
        if s3: cd.update_skill_progress(s3, 30)
        
        t1 = cd.add_training("AWS Architect", TrainingType.CERTIFICATION, 40, 500.0, ["Cloud"])
        t2 = cd.add_training("Leadership", TrainingType.WORKSHOP, 16, 200.0, ["Soft"])
        
        cd.complete_training(t1.id, "Alex Nguyen")
        cd.complete_training(t2.id, "Alex Nguyen")
        cd.complete_training(t2.id, "Sarah Tran")
        
        print("\n" + cd.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
