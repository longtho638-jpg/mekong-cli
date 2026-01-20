"""
Project management database operations.
"""
import json
import logging
from datetime import datetime
from typing import Dict

from .base import BaseRepository

try:
    from ...services.client_portal_service import Project, ProjectStatus, ProjectTask, TaskStatus
except ImportError:
    from services.client_portal_service import Project, ProjectStatus, ProjectTask, TaskStatus

logger = logging.getLogger(__name__)

class ProjectRepo(BaseRepository):
    def save_projects(self, projects: Dict[str, Project]) -> bool:
        """Lưu danh sách projects."""
        try:
            data = {}
            for project_id, project in projects.items():
                # Serialize tasks
                tasks_data = []
                for task in project.tasks:
                    tasks_data.append(
                        {
                            "id": task.id,
                            "name": task.name,
                            "description": task.description,
                            "status": task.status.value,
                            "due_date": task.due_date.isoformat() if task.due_date else None,
                            "completed_at": task.completed_at.isoformat()
                            if task.completed_at
                            else None,
                            "assignee": task.assignee,
                        }
                    )

                data[project_id] = {
                    "id": project.id,
                    "client_id": project.client_id,
                    "name": project.name,
                    "description": project.description,
                    "status": project.status.value,
                    "start_date": project.start_date.isoformat(),
                    "end_date": project.end_date.isoformat() if project.end_date else None,
                    "tasks": tasks_data,
                    "budget": project.budget,
                    "spent": project.spent,
                }

            with open(self.projects_file, "w") as f:
                json.dump(data, f, indent=2)

            logger.info(f"Saved {len(projects)} projects")
            return True
        except Exception as e:
            logger.error(f"Failed to save projects: {e}")
            return False

    def load_projects(self) -> Dict[str, Project]:
        """Tải danh sách projects."""
        try:
            if not self.projects_file.exists():
                return {}

            with open(self.projects_file, "r") as f:
                data = json.load(f)

            projects = {}
            for project_id, project_data in data.items():
                # Deserialize tasks
                tasks = []
                for task_data in project_data.get("tasks", []):
                    task = ProjectTask(
                        id=task_data["id"],
                        name=task_data["name"],
                        description=task_data["description"],
                        status=TaskStatus(task_data["status"]),
                        due_date=datetime.fromisoformat(task_data["due_date"])
                        if task_data.get("due_date")
                        else None,
                        completed_at=datetime.fromisoformat(task_data["completed_at"])
                        if task_data.get("completed_at")
                        else None,
                        assignee=task_data.get("assignee", "Team"),
                    )
                    tasks.append(task)

                project = Project(
                    id=project_data["id"],
                    client_id=project_data["client_id"],
                    name=project_data["name"],
                    description=project_data["description"],
                    status=ProjectStatus(project_data["status"]),
                    start_date=datetime.fromisoformat(project_data["start_date"]),
                    end_date=datetime.fromisoformat(project_data["end_date"])
                    if project_data.get("end_date")
                    else None,
                    tasks=tasks,
                    budget=project_data.get("budget", 0.0),
                    spent=project_data.get("spent", 0.0),
                )
                projects[project_id] = project

            logger.info(f"Loaded {len(projects)} projects")
            return projects
        except Exception as e:
            logger.error(f"Failed to load projects: {e}")
            return {}
