"""
Sprint Agent - Sprint Planning & Velocity Tracking
Manages sprints, backlog, and team velocity.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime, date, timedelta
from enum import Enum
import random


class SprintStatus(Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"


class TaskStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


@dataclass
class Task:
    """Sprint task/story"""
    id: str
    title: str
    points: int
    status: TaskStatus = TaskStatus.TODO
    assignee: str = ""


@dataclass
class Sprint:
    """Sprint"""
    id: str
    name: str
    start_date: date
    end_date: date
    status: SprintStatus = SprintStatus.PLANNING
    tasks: List[Task] = field(default_factory=list)
    committed_points: int = 0
    completed_points: int = 0
    
    @property
    def days_remaining(self) -> int:
        if self.status == SprintStatus.COMPLETED:
            return 0
        return max(0, (self.end_date - date.today()).days)
    
    @property
    def velocity(self) -> float:
        if not self.tasks:
            return 0
        return self.completed_points


class SprintAgent:
    """
    Sprint Agent - Quản lý Sprint
    
    Responsibilities:
    - Sprint planning
    - Backlog management
    - Velocity tracking
    - Burndown charts
    """
    
    def __init__(self):
        self.name = "Sprint"
        self.status = "ready"
        self.sprints: Dict[str, Sprint] = {}
        
    def create_sprint(
        self,
        name: str,
        start_date: date,
        duration_days: int = 14
    ) -> Sprint:
        """Create sprint"""
        sprint_id = f"sprint_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        sprint = Sprint(
            id=sprint_id,
            name=name,
            start_date=start_date,
            end_date=start_date + timedelta(days=duration_days)
        )
        
        self.sprints[sprint_id] = sprint
        return sprint
    
    def add_task(
        self,
        sprint_id: str,
        title: str,
        points: int,
        assignee: str = ""
    ) -> Task:
        """Add task to sprint"""
        if sprint_id not in self.sprints:
            raise ValueError(f"Sprint not found: {sprint_id}")
            
        task_id = f"task_{random.randint(1000,9999)}"
        
        task = Task(
            id=task_id,
            title=title,
            points=points,
            assignee=assignee
        )
        
        sprint = self.sprints[sprint_id]
        sprint.tasks.append(task)
        sprint.committed_points += points
        
        return task
    
    def start_sprint(self, sprint_id: str) -> Sprint:
        """Start sprint"""
        if sprint_id not in self.sprints:
            raise ValueError(f"Sprint not found: {sprint_id}")
            
        sprint = self.sprints[sprint_id]
        sprint.status = SprintStatus.ACTIVE
        
        return sprint
    
    def update_task(self, sprint_id: str, task_id: str, status: TaskStatus) -> Sprint:
        """Update task status"""
        if sprint_id not in self.sprints:
            raise ValueError(f"Sprint not found: {sprint_id}")
            
        sprint = self.sprints[sprint_id]
        
        for task in sprint.tasks:
            if task.id == task_id:
                old_status = task.status
                task.status = status
                
                if status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    sprint.completed_points += task.points
                elif old_status == TaskStatus.DONE and status != TaskStatus.DONE:
                    sprint.completed_points -= task.points
        
        return sprint
    
    def complete_sprint(self, sprint_id: str) -> Sprint:
        """Complete sprint"""
        if sprint_id not in self.sprints:
            raise ValueError(f"Sprint not found: {sprint_id}")
            
        sprint = self.sprints[sprint_id]
        sprint.status = SprintStatus.COMPLETED
        
        return sprint
    
    def get_stats(self) -> Dict:
        """Get sprint statistics"""
        sprints = list(self.sprints.values())
        completed = [s for s in sprints if s.status == SprintStatus.COMPLETED]
        
        return {
            "total_sprints": len(sprints),
            "active": len([s for s in sprints if s.status == SprintStatus.ACTIVE]),
            "avg_velocity": sum(s.velocity for s in completed) / len(completed) if completed else 0,
            "total_points": sum(s.committed_points for s in sprints),
            "completed_points": sum(s.completed_points for s in sprints)
        }


# Demo
if __name__ == "__main__":
    agent = SprintAgent()
    
    print("📋 Sprint Agent Demo\n")
    
    # Create sprint
    s1 = agent.create_sprint("Sprint 24", date.today())
    
    print(f"🏃 Sprint: {s1.name}")
    print(f"   Duration: {s1.start_date} → {s1.end_date}")
    
    # Add tasks
    t1 = agent.add_task(s1.id, "Implement user auth", 5, "Nguyen A")
    t2 = agent.add_task(s1.id, "Build dashboard UI", 8, "Tran B")
    t3 = agent.add_task(s1.id, "API integration", 3, "Le C")
    
    print(f"\n📝 Tasks: {len(s1.tasks)}")
    print(f"   Committed: {s1.committed_points} pts")
    
    # Start and progress
    agent.start_sprint(s1.id)
    agent.update_task(s1.id, t1.id, TaskStatus.DONE)
    agent.update_task(s1.id, t2.id, TaskStatus.IN_PROGRESS)
    
    print(f"\n✅ Completed: {s1.completed_points} pts")
    print(f"   Days Remaining: {s1.days_remaining}")
