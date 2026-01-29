"""
Task Manager engine logic.
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import Project, Task, TaskPriority, TaskStatus


class TaskEngine:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.projects: Dict[str, Project] = {}

    def create_project(self, name: str, description: str) -> Project:
        pid = f"proj_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        project = Project(id=pid, name=name, description=description)
        self.projects[pid] = project
        return project

    def create_task(
        self,
        title: str,
        description: str,
        project_id: Optional[str] = None,
        assignee: Optional[str] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_days: int = 7,
    ) -> Task:
        tid = f"task_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        task = Task(
            id=tid,
            title=title,
            description=description,
            project_id=project_id,
            assignee=assignee,
            priority=priority,
            due_date=datetime.now() + timedelta(days=due_days),
        )
        self.tasks[tid] = task
        return task
