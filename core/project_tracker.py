"""
📋 Project Tracker - Manage Client Projects
=============================================

Track project progress with milestones and tasks.
Keep clients informed and projects on track!

Features:
- Project creation
- Milestone tracking
- Task management
- Progress visualization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProjectStatus(Enum):
    """Project status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(Enum):
    """Task status."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


@dataclass
class Task:
    """A project task."""
    id: str
    name: str
    status: TaskStatus
    assignee: str = ""
    due_date: Optional[datetime] = None


@dataclass
class Milestone:
    """A project milestone."""
    id: str
    name: str
    due_date: datetime
    completed: bool = False
    tasks: List[Task] = field(default_factory=list)
    
    @property
    def progress(self) -> float:
        if not self.tasks:
            return 100 if self.completed else 0
        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        return (done / len(self.tasks)) * 100


@dataclass
class Project:
    """A client project."""
    id: str
    name: str
    client_name: str
    client_company: str
    status: ProjectStatus
    start_date: datetime
    end_date: datetime
    budget: float
    milestones: List[Milestone] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def progress(self) -> float:
        if not self.milestones:
            return 0
        total_progress = sum(m.progress for m in self.milestones)
        return total_progress / len(self.milestones)
    
    @property
    def days_remaining(self) -> int:
        return (self.end_date - datetime.now()).days


class ProjectTracker:
    """
    Project Tracker.
    
    Manage client projects with milestones and tasks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, Project] = {}
    
    def create_project(
        self,
        name: str,
        client_name: str,
        client_company: str,
        duration_days: int,
        budget: float
    ) -> Project:
        """Create a new project."""
        project = Project(
            id=f"PRJ-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            client_name=client_name,
            client_company=client_company,
            status=ProjectStatus.NOT_STARTED,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days),
            budget=budget
        )
        
        self.projects[project.id] = project
        return project
    
    def add_milestone(
        self,
        project_id: str,
        name: str,
        due_days: int
    ) -> Milestone:
        """Add milestone to project."""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        milestone = Milestone(
            id=f"MS-{uuid.uuid4().hex[:4].upper()}",
            name=name,
            due_date=project.start_date + timedelta(days=due_days)
        )
        
        project.milestones.append(milestone)
        return milestone
    
    def add_task(
        self,
        project_id: str,
        milestone_id: str,
        name: str,
        assignee: str = ""
    ) -> Task:
        """Add task to milestone."""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        milestone = next((m for m in project.milestones if m.id == milestone_id), None)
        if not milestone:
            raise ValueError(f"Milestone {milestone_id} not found")
        
        task = Task(
            id=f"T-{uuid.uuid4().hex[:4].upper()}",
            name=name,
            status=TaskStatus.TODO,
            assignee=assignee
        )
        
        milestone.tasks.append(task)
        return task
    
    def format_project(self, project: Project) -> str:
        """Format project overview."""
        status_icons = {
            ProjectStatus.NOT_STARTED: "⬜",
            ProjectStatus.IN_PROGRESS: "🔄",
            ProjectStatus.ON_HOLD: "⏸️",
            ProjectStatus.COMPLETED: "✅",
            ProjectStatus.CANCELLED: "❌"
        }
        
        # Progress bar
        filled = int(40 * project.progress / 100)
        bar = "█" * filled + "░" * (40 - filled)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 PROJECT: {project.name.upper()[:40]:<40}  ║",
            f"║  ID: {project.id:<48}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {project.client_name} ({project.client_company[:25]})        ║",
            f"║  Status: {status_icons[project.status]} {project.status.value.replace('_', ' ').title():<40}  ║",
            f"║  Budget: ${project.budget:>12,.0f}                              ║",
            "║                                                           ║",
            f"║  📅 {project.start_date.strftime('%b %d')} → {project.end_date.strftime('%b %d, %Y')} ({project.days_remaining} days left)        ║",
            "║                                                           ║",
            "║  📊 PROGRESS                                              ║",
            f"║  [{bar}] {project.progress:>3.0f}%  ║",
        ]
        
        # Milestones
        if project.milestones:
            lines.append("║                                                           ║")
            lines.append("║  🎯 MILESTONES                                            ║")
            lines.append("║  ─────────────────────────────────────────────────────── ║")
            
            for m in project.milestones:
                icon = "✅" if m.completed or m.progress >= 100 else "🔄" if m.progress > 0 else "⬜"
                lines.append(f"║    {icon} {m.name[:30]:<30} {m.progress:>3.0f}%      ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_summary(self) -> str:
        """Format all projects summary."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 PROJECT PORTFOLIO                                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Project           │ Client      │ Progress │ Status     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        total_value = 0
        for project in self.projects.values():
            name = project.name[:18]
            client = project.client_company[:11]
            prog = f"{project.progress:.0f}%"
            status = project.status.value[:10]
            total_value += project.budget
            
            lines.append(f"║  {name:<18} │ {client:<11} │ {prog:>8} │ {status:<10} ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  📊 Total Projects: {len(self.projects):<5} Total Value: ${total_value:>12,.0f}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = ProjectTracker("Saigon Digital Hub")
    
    print("📋 Project Tracker")
    print("=" * 60)
    print()
    
    # Create project
    project = tracker.create_project(
        name="Website Redesign",
        client_name="Mr. Hoang",
        client_company="Sunrise Realty",
        duration_days=60,
        budget=15000
    )
    project.status = ProjectStatus.IN_PROGRESS
    
    # Add milestones
    m1 = tracker.add_milestone(project.id, "Discovery & Research", 7)
    m2 = tracker.add_milestone(project.id, "Design Phase", 21)
    m3 = tracker.add_milestone(project.id, "Development", 45)
    m4 = tracker.add_milestone(project.id, "Testing & Launch", 60)
    
    # Add tasks
    t1 = tracker.add_task(project.id, m1.id, "Client interview", "Mai")
    t2 = tracker.add_task(project.id, m1.id, "Competitor analysis", "Tuan")
    t1.status = TaskStatus.DONE
    t2.status = TaskStatus.DONE
    m1.completed = True
    
    t3 = tracker.add_task(project.id, m2.id, "Wireframes", "Linh")
    t4 = tracker.add_task(project.id, m2.id, "UI Design", "Linh")
    t3.status = TaskStatus.DONE
    t4.status = TaskStatus.IN_PROGRESS
    
    print(tracker.format_project(project))
    print()
    print(tracker.format_summary())
