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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """A skill to track."""
    id: str
    name: str
    category: str
    level: SkillLevel = SkillLevel.BEGINNER
    target_level: SkillLevel = SkillLevel.INTERMEDIATE
    progress: int = 0  # 0-100


@dataclass
class CareerPath:
    """A career path for an employee."""
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
    """A training program."""
    id: str
    name: str
    training_type: TrainingType
    duration_hours: int
    cost: float = 0
    skills: List[str] = field(default_factory=list)
    completed_by: List[str] = field(default_factory=list)


class CareerDevelopment:
    """
    Career Development System.
    
    Grow team careers.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.career_paths: Dict[str, CareerPath] = {}
        self.trainings: Dict[str, Training] = {}
    
    def create_career_path(
        self,
        employee: str,
        current_role: str,
        current_level: CareerLevel,
        target_role: str,
        target_level: CareerLevel,
        months: int = 12
    ) -> CareerPath:
        """Create a career path."""
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
        return path
    
    def add_skill(
        self,
        path: CareerPath,
        skill_name: str,
        category: str,
        current: SkillLevel = SkillLevel.BEGINNER,
        target: SkillLevel = SkillLevel.INTERMEDIATE
    ) -> Skill:
        """Add a skill to track."""
        skill = Skill(
            id=f"SKL-{uuid.uuid4().hex[:6].upper()}",
            name=skill_name,
            category=category,
            level=current,
            target_level=target
        )
        path.skills.append(skill)
        return skill
    
    def update_skill_progress(self, skill: Skill, progress: int, level: SkillLevel = None):
        """Update skill progress."""
        skill.progress = min(100, progress)
        if level:
            skill.level = level
    
    def add_training(
        self,
        name: str,
        training_type: TrainingType,
        hours: int,
        cost: float = 0,
        skills: List[str] = None
    ) -> Training:
        """Add a training program."""
        training = Training(
            id=f"TRN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            training_type=training_type,
            duration_hours=hours,
            cost=cost,
            skills=skills or []
        )
        self.trainings[training.id] = training
        return training
    
    def complete_training(self, training: Training, employee: str):
        """Mark training as completed."""
        if employee not in training.completed_by:
            training.completed_by.append(employee)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get career development stats."""
        total_skills = sum(len(p.skills) for p in self.career_paths.values())
        avg_progress = sum(s.progress for p in self.career_paths.values() for s in p.skills) / total_skills if total_skills else 0
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
        """Format career development dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 CAREER DEVELOPMENT                                    ║",
            f"║  {stats['career_paths']} paths │ {stats['total_skills']} skills │ {stats['avg_progress']:.0f}% progress  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 CAREER PATHS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"junior": "🌱", "mid": "🌿", "senior": "🌳", 
                      "lead": "⭐", "manager": "👑", "director": "🏆"}
        
        for path in list(self.career_paths.values())[:4]:
            curr_icon = level_icons.get(path.current_level.value, "⚪")
            tgt_icon = level_icons.get(path.target_level.value, "⭐")
            skill_progress = sum(s.progress for s in path.skills) / len(path.skills) if path.skills else 0
            
            lines.append(f"║  {curr_icon}→{tgt_icon} {path.employee[:12]:<12} │ {path.current_role[:10]:<10} → {path.target_role[:10]:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📚 TRAINING PROGRAMS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"course": "📖", "workshop": "🔧", "certification": "🏅",
                     "mentorship": "👥", "conference": "🎤"}
        
        for training in list(self.trainings.values())[:4]:
            icon = type_icons.get(training.training_type.value, "📚")
            lines.append(f"║  {icon} {training.name[:22]:<22} │ {training.duration_hours:>3}h │ {len(training.completed_by):>2} done  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 SKILL DEVELOPMENT                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        skill_icons = {"beginner": "🔵", "intermediate": "🟢", "advanced": "🟡", "expert": "🔴"}
        all_skills = [s for p in self.career_paths.values() for s in p.skills][:4]
        
        for skill in all_skills:
            icon = skill_icons.get(skill.level.value, "⚪")
            bar = "█" * int(skill.progress / 20) + "░" * (5 - int(skill.progress / 20))
            lines.append(f"║  {icon} {skill.name[:18]:<18} │ {bar} │ {skill.progress:>3}%       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📈 Paths]  [📚 Training]  [💡 Skills]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Grow together!                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cd = CareerDevelopment("Saigon Digital Hub")
    
    print("📈 Career Development")
    print("=" * 60)
    print()
    
    p1 = cd.create_career_path("Alex Nguyen", "Developer", CareerLevel.MID, "Tech Lead", CareerLevel.LEAD, 18)
    p2 = cd.create_career_path("Sarah Tran", "Designer", CareerLevel.JUNIOR, "Senior Designer", CareerLevel.SENIOR, 12)
    
    s1 = cd.add_skill(p1, "System Design", "Technical", SkillLevel.BEGINNER, SkillLevel.ADVANCED)
    s2 = cd.add_skill(p1, "Leadership", "Soft Skills", SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED)
    s3 = cd.add_skill(p2, "UX Research", "Design", SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE)
    
    cd.update_skill_progress(s1, 45)
    cd.update_skill_progress(s2, 70, SkillLevel.ADVANCED)
    cd.update_skill_progress(s3, 30)
    
    t1 = cd.add_training("AWS Solutions Architect", TrainingType.CERTIFICATION, 40, 500, ["Cloud", "Architecture"])
    t2 = cd.add_training("Leadership Workshop", TrainingType.WORKSHOP, 16, 200, ["Leadership"])
    
    cd.complete_training(t1, "Alex Nguyen")
    cd.complete_training(t2, "Alex Nguyen")
    cd.complete_training(t2, "Sarah Tran")
    
    print(cd.format_dashboard())
