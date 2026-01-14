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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProjectStatus(Enum):
    """Lifecycle status of a client project."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(Enum):
    """Execution status of an individual task."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


@dataclass
class Task:
    """An individual project task entity."""
    id: str
    name: str
    status: TaskStatus = TaskStatus.TODO
    assignee: str = ""
    due_date: Optional[datetime] = None


@dataclass
class Milestone:
    """A project milestone grouping multiple tasks."""
    id: str
    name: str
    due_date: datetime
    completed: bool = False
    tasks: List[Task] = field(default_factory=list)
    
    @property
    def progress_pct(self) -> float:
        """Calculate weighted progress based on completed tasks."""
        if not self.tasks:
            return 100.0 if self.completed else 0.0
        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        return (done / len(self.tasks)) * 100.0


@dataclass
class Project:
    """A comprehensive client project record entity."""
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
    
    def __post_init__(self):
        if self.budget < 0:
            raise ValueError("Budget cannot be negative")

    @property
    def overall_progress(self) -> float:
        """Average progress across all project milestones."""
        if not self.milestones: return 0.0
        return sum(m.progress_pct for m in self.milestones) / len(self.milestones)
    
    @property
    def days_left(self) -> int:
        """Calculate remaining time in days."""
        delta = self.end_date - datetime.now()
        return max(0, delta.days)


class ProjectTracker:
    """
    Project Tracking System.
    
    Orchestrates the delivery lifecycle of agency projects through milestones and granular task tracking.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, Project] = {}
        logger.info(f"Project Tracker initialized for {agency_name}")
    
    def create_project(
        self,
        name: str,
        client: str,
        company: str,
        days: int = 30,
        budget: float = 0.0
    ) -> Project:
        """Register a new project into the tracking system."""
        if not name or not company:
            raise ValueError("Project name and client company are mandatory")

        p = Project(
            id=f"PRJ-{uuid.uuid4().hex[:6].upper()}",
            name=name, client_name=client, client_company=company,
            status=ProjectStatus.IN_PROGRESS,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days),
            budget=float(budget)
        )
        self.projects[p.id] = p
        logger.info(f"Project created: {name} for {company}")
        return p
    
    def format_dashboard(self) -> str:
        """Render the Project Portfolio Dashboard."""
        active = [p for p in self.projects.values() if p.status == ProjectStatus.IN_PROGRESS]
        total_val = sum(p.budget for p in self.projects.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 PROJECT TRACKER DASHBOARD{' ' * 32}║",
            f"║  {len(self.projects)} total │ {len(active)} active projects │ ${total_val:,.0f} total budget{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏗️ ACTIVE PROJECTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for p in active[:5]:
            bar = "█" * int(p.overall_progress / 10) + "░" * (10 - int(p.overall_progress / 10))
            name_disp = (p.name[:18] + '..') if len(p.name) > 20 else p.name
            lines.append(f"║  🔄 {name_disp:<20} │ {bar} │ {p.overall_progress:>3.0f}% │ {p.days_left:>3}d left ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Project]  [🎯 Milestone]  [📋 Tasks]  [📊 Audit] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - On Track!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Project Tracker...")
    print("=" * 60)
    
    try:
        tracker = ProjectTracker("Saigon Digital Hub")
        # Seed
        p = tracker.create_project("SEO Audit", "Hoang", "Sunrise Realty", 14, 5000.0)
        
        print("\n" + tracker.format_dashboard())
        
    except Exception as e:
        logger.error(f"Tracker Error: {e}")
