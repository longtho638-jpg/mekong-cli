"""
🧘 Wellness Coordinator - Team Wellbeing
==========================================

Manage employee wellness programs.
Happy team, great work!

Features:
- Wellness programs
- Mental health resources
- Work-life balance
- Team wellness score
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class WellnessCategory(Enum):
    """Wellness categories."""
    PHYSICAL = "physical"
    MENTAL = "mental"
    SOCIAL = "social"
    FINANCIAL = "financial"
    PROFESSIONAL = "professional"


class ActivityType(Enum):
    """Wellness activity types."""
    EXERCISE = "exercise"
    MEDITATION = "meditation"
    TEAM_BUILDING = "team_building"
    LEARNING = "learning"
    BREAK = "break"


@dataclass
class WellnessProgram:
    """A wellness program."""
    id: str
    name: str
    category: WellnessCategory
    description: str
    participants: int = 0
    active: bool = True


@dataclass
class WellnessActivity:
    """A wellness activity."""
    id: str
    name: str
    activity_type: ActivityType
    date: datetime
    participants: List[str] = field(default_factory=list)
    completed: bool = False


@dataclass
class EmployeeWellness:
    """Employee wellness profile."""
    id: str
    name: str
    wellness_score: int = 70  # 0-100
    stress_level: int = 30  # 0-100
    activities_completed: int = 0
    mental_health_days_used: int = 0


class WellnessCoordinator:
    """
    Wellness Coordinator.
    
    Team wellbeing manager.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.programs: Dict[str, WellnessProgram] = {}
        self.activities: List[WellnessActivity] = []
        self.employees: Dict[str, EmployeeWellness] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Programs
        programs = [
            ("Mindful Mondays", WellnessCategory.MENTAL, "Weekly meditation sessions"),
            ("Fitness Fridays", WellnessCategory.PHYSICAL, "Group exercise activities"),
            ("Learning Lunches", WellnessCategory.PROFESSIONAL, "Skill-sharing sessions"),
            ("Team Socials", WellnessCategory.SOCIAL, "Monthly team gatherings"),
        ]
        
        for name, cat, desc in programs:
            self.create_program(name, cat, desc)
        
        # Employees
        employees = [
            ("Alex Nguyen", 85, 20),
            ("Sarah Tran", 75, 35),
            ("Mike Chen", 70, 40),
            ("Lisa Pham", 90, 15),
        ]
        
        for name, score, stress in employees:
            self.add_employee(name, score, stress)
    
    def create_program(
        self,
        name: str,
        category: WellnessCategory,
        description: str
    ) -> WellnessProgram:
        """Create a wellness program."""
        program = WellnessProgram(
            id=f"WPR-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            category=category,
            description=description
        )
        self.programs[program.id] = program
        return program
    
    def add_employee(
        self,
        name: str,
        wellness_score: int = 70,
        stress_level: int = 30
    ) -> EmployeeWellness:
        """Add employee wellness profile."""
        employee = EmployeeWellness(
            id=f"EWL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            wellness_score=wellness_score,
            stress_level=stress_level
        )
        self.employees[employee.id] = employee
        return employee
    
    def schedule_activity(
        self,
        name: str,
        activity_type: ActivityType,
        days_from_now: int = 1
    ) -> WellnessActivity:
        """Schedule a wellness activity."""
        activity = WellnessActivity(
            id=f"WAC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            activity_type=activity_type,
            date=datetime.now() + timedelta(days=days_from_now)
        )
        self.activities.append(activity)
        return activity
    
    def complete_activity(self, activity: WellnessActivity, participants: List[str]):
        """Complete an activity."""
        activity.completed = True
        activity.participants = participants
        
        # Update employee stats
        for emp in self.employees.values():
            if emp.name in participants:
                emp.activities_completed += 1
                emp.wellness_score = min(100, emp.wellness_score + 2)
    
    def get_team_wellness_score(self) -> float:
        """Calculate team wellness score."""
        if not self.employees:
            return 0
        return sum(e.wellness_score for e in self.employees.values()) / len(self.employees)
    
    def get_avg_stress_level(self) -> float:
        """Calculate average stress level."""
        if not self.employees:
            return 0
        return sum(e.stress_level for e in self.employees.values()) / len(self.employees)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get wellness statistics."""
        return {
            "programs": len(self.programs),
            "employees": len(self.employees),
            "team_wellness": self.get_team_wellness_score(),
            "avg_stress": self.get_avg_stress_level(),
            "activities_scheduled": len(self.activities),
            "activities_completed": sum(1 for a in self.activities if a.completed)
        }
    
    def format_dashboard(self) -> str:
        """Format wellness coordinator dashboard."""
        stats = self.get_stats()
        
        wellness_icon = "🟢" if stats['team_wellness'] >= 75 else "🟡" if stats['team_wellness'] >= 50 else "🔴"
        stress_icon = "🟢" if stats['avg_stress'] <= 30 else "🟡" if stats['avg_stress'] <= 50 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧘 WELLNESS COORDINATOR                                  ║",
            f"║  {wellness_icon} Wellness: {stats['team_wellness']:.0f}% │ {stress_icon} Stress: {stats['avg_stress']:.0f}%  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 WELLNESS PROGRAMS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        cat_icons = {"physical": "💪", "mental": "🧠", "social": "👥",
                    "financial": "💰", "professional": "📚"}
        
        for program in list(self.programs.values())[:4]:
            icon = cat_icons.get(program.category.value, "❤️")
            status = "✅ Active" if program.active else "⏸️ Paused"
            lines.append(f"║    {icon} {program.name[:20]:<20} │ {status:<12}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  👥 TEAM WELLNESS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for emp in sorted(self.employees.values(), key=lambda x: x.wellness_score, reverse=True)[:4]:
            w_icon = "🟢" if emp.wellness_score >= 75 else "🟡" if emp.wellness_score >= 50 else "🔴"
            bar = "█" * (emp.wellness_score // 10) + "░" * (10 - emp.wellness_score // 10)
            lines.append(f"║    {w_icon} {emp.name[:14]:<14} │ {bar} │ {emp.wellness_score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🧠 MENTAL HEALTH                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📞 EAP Hotline: Available 24/7                        ║",
            "║    🧘 Meditation: Headspace subscription                 ║",
            "║    📅 Mental Health Days: 3/year per employee            ║",
            "║                                                           ║",
            "║  📊 WELLNESS METRICS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    ❤️ Team Wellness:      {stats['team_wellness']:>12.0f}%              ║",
            f"║    😰 Avg Stress Level:   {stats['avg_stress']:>12.0f}%              ║",
            f"║    📋 Active Programs:    {stats['programs']:>12}              ║",
            f"║    🎯 Activities Done:    {stats['activities_completed']:>12}              ║",
            "║                                                           ║",
            "║  [📋 Programs]  [👥 Team]  [🧘 Resources]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Happy team, great work!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    wc = WellnessCoordinator("Saigon Digital Hub")
    
    print("🧘 Wellness Coordinator")
    print("=" * 60)
    print()
    
    print(wc.format_dashboard())
