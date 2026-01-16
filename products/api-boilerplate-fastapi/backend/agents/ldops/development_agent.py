"""
Development Agent - Skills & Career Development
Manages skills assessment, career paths, and development plans.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CareerTrack(Enum):
    INDIVIDUAL_CONTRIBUTOR = "ic"
    MANAGEMENT = "management"
    SPECIALIST = "specialist"


@dataclass
class Skill:
    """Employee skill"""
    id: str
    name: str
    category: str
    current_level: SkillLevel
    target_level: SkillLevel
    gap: int = 0  # levels to target


@dataclass
class DevelopmentPlan:
    """Employee development plan"""
    id: str
    employee_id: str
    employee_name: str
    career_track: CareerTrack
    current_role: str
    target_role: str
    skills: List[Skill] = field(default_factory=list)
    progress: int = 0  # 0-100
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    def calculate_progress(self):
        if not self.skills:
            return 0
        completed = sum(1 for s in self.skills if s.gap == 0)
        return int((completed / len(self.skills)) * 100)


class DevelopmentAgent:
    """
    Development Agent - Phát triển Nghề nghiệp
    
    Responsibilities:
    - Assess skills
    - Plan career paths
    - Identify gaps
    - Track development
    """
    
    LEVEL_ORDER = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT]
    
    def __init__(self):
        self.name = "Development"
        self.status = "ready"
        self.plans: Dict[str, DevelopmentPlan] = {}
        
    def create_plan(
        self,
        employee_id: str,
        employee_name: str,
        career_track: CareerTrack,
        current_role: str,
        target_role: str
    ) -> DevelopmentPlan:
        """Create development plan"""
        plan_id = f"plan_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        plan = DevelopmentPlan(
            id=plan_id,
            employee_id=employee_id,
            employee_name=employee_name,
            career_track=career_track,
            current_role=current_role,
            target_role=target_role
        )
        
        self.plans[plan_id] = plan
        return plan
    
    def add_skill(
        self,
        plan_id: str,
        name: str,
        category: str,
        current_level: SkillLevel,
        target_level: SkillLevel
    ) -> Skill:
        """Add skill to development plan"""
        if plan_id not in self.plans:
            raise ValueError(f"Plan not found: {plan_id}")
            
        skill_id = f"skill_{random.randint(100,999)}"
        
        # Calculate gap
        current_idx = self.LEVEL_ORDER.index(current_level)
        target_idx = self.LEVEL_ORDER.index(target_level)
        gap = max(0, target_idx - current_idx)
        
        skill = Skill(
            id=skill_id,
            name=name,
            category=category,
            current_level=current_level,
            target_level=target_level,
            gap=gap
        )
        
        plan = self.plans[plan_id]
        plan.skills.append(skill)
        plan.progress = plan.calculate_progress()
        
        return skill
    
    def improve_skill(self, plan_id: str, skill_name: str) -> DevelopmentPlan:
        """Improve a skill by one level"""
        if plan_id not in self.plans:
            raise ValueError(f"Plan not found: {plan_id}")
            
        plan = self.plans[plan_id]
        
        for skill in plan.skills:
            if skill.name == skill_name:
                current_idx = self.LEVEL_ORDER.index(skill.current_level)
                target_idx = self.LEVEL_ORDER.index(skill.target_level)
                
                if current_idx < target_idx:
                    skill.current_level = self.LEVEL_ORDER[current_idx + 1]
                    skill.gap = max(0, skill.gap - 1)
        
        plan.progress = plan.calculate_progress()
        return plan
    
    def get_skill_gaps(self) -> List[Dict]:
        """Get all skill gaps across plans"""
        gaps = []
        for plan in self.plans.values():
            for skill in plan.skills:
                if skill.gap > 0:
                    gaps.append({
                        "employee": plan.employee_name,
                        "skill": skill.name,
                        "current": skill.current_level.value,
                        "target": skill.target_level.value,
                        "gap": skill.gap
                    })
        return sorted(gaps, key=lambda x: x["gap"], reverse=True)
    
    def get_stats(self) -> Dict:
        """Get development statistics"""
        plans = list(self.plans.values())
        all_skills = [s for p in plans for s in p.skills]
        gaps = [s for s in all_skills if s.gap > 0]
        
        return {
            "total_plans": len(plans),
            "total_skills": len(all_skills),
            "skill_gaps": len(gaps),
            "avg_progress": sum(p.progress for p in plans) / len(plans) if plans else 0,
            "completed_plans": len([p for p in plans if p.progress >= 100])
        }


# Demo
if __name__ == "__main__":
    agent = DevelopmentAgent()
    
    print("🚀 Development Agent Demo\n")
    
    # Create plan
    p1 = agent.create_plan("EMP001", "Nguyen A", CareerTrack.INDIVIDUAL_CONTRIBUTOR, "Mid Engineer", "Senior Engineer")
    
    print(f"📋 Plan: {p1.employee_name}")
    print(f"   Track: {p1.career_track.value}")
    print(f"   Path: {p1.current_role} → {p1.target_role}")
    
    # Add skills
    agent.add_skill(p1.id, "Python", "Technical", SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED)
    agent.add_skill(p1.id, "System Design", "Technical", SkillLevel.BEGINNER, SkillLevel.ADVANCED)
    agent.add_skill(p1.id, "Leadership", "Soft Skills", SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE)
    
    print(f"\n📊 Skills Added: {len(p1.skills)}")
    print(f"   Progress: {p1.progress}%")
    
    # Improve skill
    agent.improve_skill(p1.id, "Leadership")
    
    print(f"   Updated Progress: {p1.progress}%")
    
    # Gaps
    print("\n⚠️ Skill Gaps:")
    for gap in agent.get_skill_gaps()[:3]:
        print(f"   {gap['skill']}: {gap['current']} → {gap['target']}")
