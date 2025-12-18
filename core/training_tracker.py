"""
🎯 Training Tracker - Learning Paths
======================================

Track team training and certifications.
Develop your people!

Features:
- Training plans
- Learning paths
- Skill assessments
- Certification tracking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TrainingStatus(Enum):
    """Training status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class SkillLevel(Enum):
    """Skill levels."""
    NOVICE = "novice"
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CertificationType(Enum):
    """Certification types."""
    INTERNAL = "internal"
    VENDOR = "vendor"
    INDUSTRY = "industry"


@dataclass
class Skill:
    """A trackable skill."""
    id: str
    name: str
    category: str
    current_level: SkillLevel = SkillLevel.NOVICE
    target_level: SkillLevel = SkillLevel.INTERMEDIATE


@dataclass
class LearningPath:
    """A learning path."""
    id: str
    name: str
    description: str
    skills: List[str] = field(default_factory=list)
    courses: List[str] = field(default_factory=list)
    duration_weeks: int = 4


@dataclass
class Certification:
    """A certification."""
    id: str
    name: str
    cert_type: CertificationType
    issued_to: str
    issued_date: datetime
    expiry_date: Optional[datetime] = None
    active: bool = True


@dataclass
class TrainingPlan:
    """An employee training plan."""
    id: str
    employee_name: str
    path_id: str
    status: TrainingStatus = TrainingStatus.NOT_STARTED
    progress: int = 0
    started_at: Optional[datetime] = None
    target_date: Optional[datetime] = None


class TrainingTracker:
    """
    Training Tracker.
    
    Develop your team systematically.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.skills: Dict[str, Skill] = {}
        self.paths: Dict[str, LearningPath] = {}
        self.plans: List[TrainingPlan] = []
        self.certifications: List[Certification] = []
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Create learning paths
        paths = [
            ("Frontend Developer", "Master frontend development", ["React", "CSS", "TypeScript"], 8),
            ("SEO Specialist", "Become SEO expert", ["SEO", "Analytics", "Content"], 6),
            ("Project Manager", "Lead projects effectively", ["Scrum", "Communication", "Tools"], 4),
        ]
        
        for name, desc, skills, weeks in paths:
            self.create_learning_path(name, desc, skills, weeks)
        
        # Add some certifications
        self.add_certification("Google Analytics", CertificationType.VENDOR, "Alex Nguyen")
        self.add_certification("AWS Cloud Practitioner", CertificationType.VENDOR, "Mike Chen")
        self.add_certification("Scrum Master", CertificationType.INDUSTRY, "Sarah Tran")
    
    def create_skill(
        self,
        name: str,
        category: str,
        target_level: SkillLevel = SkillLevel.INTERMEDIATE
    ) -> Skill:
        """Create a trackable skill."""
        skill = Skill(
            id=f"SKL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            category=category,
            target_level=target_level
        )
        self.skills[skill.id] = skill
        return skill
    
    def create_learning_path(
        self,
        name: str,
        description: str,
        skills: List[str],
        duration_weeks: int
    ) -> LearningPath:
        """Create a learning path."""
        path = LearningPath(
            id=f"PTH-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            skills=skills,
            duration_weeks=duration_weeks
        )
        self.paths[path.id] = path
        return path
    
    def assign_training(
        self,
        employee_name: str,
        path: LearningPath,
        weeks: int = None
    ) -> TrainingPlan:
        """Assign training to an employee."""
        plan = TrainingPlan(
            id=f"TRN-{uuid.uuid4().hex[:6].upper()}",
            employee_name=employee_name,
            path_id=path.id,
            started_at=datetime.now(),
            target_date=datetime.now() + timedelta(weeks=weeks or path.duration_weeks)
        )
        plan.status = TrainingStatus.IN_PROGRESS
        self.plans.append(plan)
        return plan
    
    def update_progress(self, plan: TrainingPlan, progress: int):
        """Update training progress."""
        plan.progress = min(100, progress)
        if progress >= 100:
            plan.status = TrainingStatus.COMPLETED
    
    def add_certification(
        self,
        name: str,
        cert_type: CertificationType,
        employee_name: str,
        valid_years: int = 2
    ) -> Certification:
        """Add a certification."""
        cert = Certification(
            id=f"CRT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            cert_type=cert_type,
            issued_to=employee_name,
            issued_date=datetime.now(),
            expiry_date=datetime.now() + timedelta(days=365 * valid_years)
        )
        self.certifications.append(cert)
        return cert
    
    def get_stats(self) -> Dict[str, Any]:
        """Get training statistics."""
        in_progress = sum(1 for p in self.plans if p.status == TrainingStatus.IN_PROGRESS)
        completed = sum(1 for p in self.plans if p.status == TrainingStatus.COMPLETED)
        active_certs = sum(1 for c in self.certifications if c.active)
        avg_progress = sum(p.progress for p in self.plans) / len(self.plans) if self.plans else 0
        
        return {
            "paths": len(self.paths),
            "training_plans": len(self.plans),
            "in_progress": in_progress,
            "completed": completed,
            "certifications": len(self.certifications),
            "active_certs": active_certs,
            "avg_progress": avg_progress
        }
    
    def format_dashboard(self) -> str:
        """Format training tracker dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 TRAINING TRACKER                                      ║",
            f"║  {stats['paths']} paths │ {stats['in_progress']} active │ {stats['certifications']} certs  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📚 LEARNING PATHS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for path in list(self.paths.values())[:4]:
            enrolled = sum(1 for p in self.plans if p.path_id == path.id)
            lines.append(f"║    📖 {path.name[:22]:<22} │ {path.duration_weeks}w │ {enrolled:>2} enrolled  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  👥 TEAM TRAINING                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"not_started": "⚪", "in_progress": "🔄",
                       "completed": "✅", "expired": "❌"}
        
        for plan in self.plans[:4]:
            path = self.paths.get(plan.path_id)
            path_name = path.name if path else "Unknown"
            s_icon = status_icons.get(plan.status.value, "⚪")
            bar = "█" * (plan.progress // 10) + "░" * (10 - plan.progress // 10)
            lines.append(f"║    {s_icon} {plan.employee_name[:12]:<12} │ {bar} │ {plan.progress:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 CERTIFICATIONS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"internal": "🏠", "vendor": "🏢", "industry": "🌐"}
        
        for cert in self.certifications[:3]:
            t_icon = type_icons.get(cert.cert_type.value, "📜")
            lines.append(f"║    {t_icon} {cert.name[:18]:<18} │ {cert.issued_to[:14]:<14}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 TRAINING METRICS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📚 Learning Paths:     {stats['paths']:>12}              ║",
            f"║    👥 Active Training:    {stats['in_progress']:>12}              ║",
            f"║    ✅ Completed:          {stats['completed']:>12}              ║",
            f"║    🏆 Certifications:     {stats['certifications']:>12}              ║",
            f"║    📈 Avg Progress:       {stats['avg_progress']:>12.0f}%              ║",
            "║                                                           ║",
            "║  [📚 Paths]  [👥 Team]  [🏆 Certs]                        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Develop your people!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tt = TrainingTracker("Saigon Digital Hub")
    
    print("🎯 Training Tracker")
    print("=" * 60)
    print()
    
    # Assign training
    frontend_path = list(tt.paths.values())[0]
    seo_path = list(tt.paths.values())[1]
    
    p1 = tt.assign_training("Alex Nguyen", frontend_path)
    p2 = tt.assign_training("Sarah Tran", seo_path)
    
    tt.update_progress(p1, 65)
    tt.update_progress(p2, 100)
    
    print(tt.format_dashboard())
