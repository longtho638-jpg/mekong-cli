"""
Task Manager Agent Facade.
"""
from typing import Dict

from .engine import TaskEngine
from .models import Project, Task, TaskPriority, TaskStatus


class TaskManagerAgent(TaskEngine):
    """Refactored Task Manager Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Task Manager"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_tasks": len(self.tasks), "total_projects": len(self.projects), "overdue": 0}

__all__ = ['TaskManagerAgent', 'TaskPriority', 'TaskStatus', 'Task', 'Project']
