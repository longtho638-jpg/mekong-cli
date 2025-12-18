"""
Task Manager Agent - Project & Task Tracking
Manages tasks, projects, and team assignments.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


@dataclass
class Task:
    """Task item"""
    id: str
    title: str
    description: str
    project_id: Optional[str] = None
    assignee: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None
    created_at: datetime = None
    completed_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def is_overdue(self) -> bool:
        if self.due_date and self.status != TaskStatus.DONE:
            return datetime.now() > self.due_date
        return False


@dataclass
class Project:
    """Project container"""
    id: str
    name: str
    description: str
    status: str = "active"
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class TaskManagerAgent:
    """
    Task Manager Agent - Quản lý Công việc
    
    Responsibilities:
    - Create and assign tasks
    - Track due dates
    - Manage priorities
    - Update statuses
    """
    
    def __init__(self):
        self.name = "Task Manager"
        self.status = "ready"
        self.tasks: Dict[str, Task] = {}
        self.projects: Dict[str, Project] = {}
        
    def create_project(self, name: str, description: str) -> Project:
        """Create new project"""
        project_id = f"proj_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        project = Project(
            id=project_id,
            name=name,
            description=description
        )
        
        self.projects[project_id] = project
        return project
    
    def create_task(
        self,
        title: str,
        description: str,
        project_id: Optional[str] = None,
        assignee: Optional[str] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_days: int = 7
    ) -> Task:
        """Create new task"""
        task_id = f"task_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        task = Task(
            id=task_id,
            title=title,
            description=description,
            project_id=project_id,
            assignee=assignee,
            priority=priority,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        
        self.tasks[task_id] = task
        return task
    
    def update_status(self, task_id: str, status: TaskStatus) -> Task:
        """Update task status"""
        if task_id not in self.tasks:
            raise ValueError(f"Task not found: {task_id}")
            
        task = self.tasks[task_id]
        task.status = status
        
        if status == TaskStatus.DONE:
            task.completed_at = datetime.now()
            
        return task
    
    def assign(self, task_id: str, assignee: str) -> Task:
        """Assign task to someone"""
        if task_id not in self.tasks:
            raise ValueError(f"Task not found: {task_id}")
            
        task = self.tasks[task_id]
        task.assignee = assignee
        
        return task
    
    def get_by_status(self, status: TaskStatus) -> List[Task]:
        """Get tasks by status"""
        return [t for t in self.tasks.values() if t.status == status]
    
    def get_by_assignee(self, assignee: str) -> List[Task]:
        """Get tasks by assignee"""
        return [t for t in self.tasks.values() if t.assignee == assignee]
    
    def get_overdue(self) -> List[Task]:
        """Get overdue tasks"""
        return [t for t in self.tasks.values() if t.is_overdue]
    
    def get_stats(self) -> Dict:
        """Get task statistics"""
        tasks = list(self.tasks.values())
        
        return {
            "total_tasks": len(tasks),
            "total_projects": len(self.projects),
            "by_status": {
                s.value: len([t for t in tasks if t.status == s])
                for s in TaskStatus
            },
            "overdue": len(self.get_overdue()),
            "completed_today": len([
                t for t in tasks 
                if t.completed_at and t.completed_at.date() == datetime.now().date()
            ])
        }


# Demo
if __name__ == "__main__":
    agent = TaskManagerAgent()
    
    print("📋 Task Manager Agent Demo\n")
    
    # Create project
    project = agent.create_project(
        name="Mekong CLI v1.0",
        description="First release of CLI"
    )
    print(f"📁 Project: {project.name}")
    
    # Create tasks
    task1 = agent.create_task(
        title="Implement Hybrid Router",
        description="Build the AI model router",
        project_id=project.id,
        assignee="dev_001",
        priority=TaskPriority.HIGH,
        due_days=3
    )
    
    task2 = agent.create_task(
        title="Write documentation",
        description="Create user docs",
        project_id=project.id,
        priority=TaskPriority.MEDIUM,
        due_days=7
    )
    
    print(f"\n✅ Task: {task1.title}")
    print(f"   Priority: {task1.priority.value}")
    print(f"   Due: {task1.due_date.strftime('%Y-%m-%d')}")
    
    # Update status
    agent.update_status(task1.id, TaskStatus.IN_PROGRESS)
    agent.update_status(task1.id, TaskStatus.DONE)
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total Tasks: {stats['total_tasks']}")
    print(f"   Done: {stats['by_status']['done']}")
    print(f"   Overdue: {stats['overdue']}")
