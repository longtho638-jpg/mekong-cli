"""
Project and Task operations for the portal.
"""
import logging
from typing import List, Optional

from .base import BasePortal
from .entities_proxy import Project, TaskStatus

logger = logging.getLogger(__name__)

class ProjectOps(BasePortal):
    def create_project(
        self, client_id: str, name: str, description: str, budget: float, duration_weeks: int = 4
    ) -> Project:
        """Tạo project mới."""
        if client_id not in self.clients:
            raise KeyError("Client not found")

        errors = self.presenter.validate_project_data(name, description, budget)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")

        project = self.service.create_project_entity(
            client_id=client_id,
            name=name,
            description=description,
            budget=budget,
            duration_weeks=duration_weeks,
        )

        self.projects[project.id] = project
        self.repository.save_projects(self.projects)

        self.service.update_project_stats(1, 1)
        self.repository.save_stats(self.service.stats)

        logger.info(f"Project created: {name}")
        return project

    def add_task(
        self,
        project_id: str,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO,
        due_date: Optional = None,
        assignee: str = "Team",
    ) -> Optional:
        """Thêm task vào project."""
        if project_id not in self.projects:
            return None

        task = self.service.create_task_entity(
            name=name, description=description, status=status, due_date=due_date, assignee=assignee
        )

        self.projects[project_id].tasks.append(task)
        self.repository.save_projects(self.projects)

        logger.debug(f"Task '{name}' added to {project_id}")
        return task

    def get_client_projects(self, client_id: str) -> List[Project]:
        """Lấy projects của client."""
        return [p for p in self.projects.values() if p.client_id == client_id]

    def get_all_projects(self) -> List[Project]:
        """Lấy tất cả projects."""
        return list(self.projects.values())
