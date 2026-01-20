"""
Vibe Kanban Bridge Client.
"""

import logging
import os
from typing import Dict, List, Optional

import httpx

from .models import TaskModel

logger = logging.getLogger(__name__)


class VibeBoardClient:
    def __init__(self, hostname: str = "http://localhost:3000", token: Optional[str] = None):
        # Token validation - required for security
        if not token:
            raise ValueError("VIBE_KANBAN_TOKEN environment variable is required")
        self.base_url = hostname
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.client = httpx.AsyncClient(base_url=self.base_url, headers=self.headers)

    async def list_tasks(self) -> List[TaskModel]:
        try:
            resp = await self.client.get("/api/tasks")
            return [TaskModel(**t) for t in resp.json()]
        except Exception:
            return []

    async def create_task(
        self,
        title: str,
        description: str = "",
        agent_assigned: str = "planner",
        priority: str = "P1",
    ) -> TaskModel:
        """Create a new task on the Vibe Kanban board."""
        try:
            payload = {
                "title": title,
                "description": description,
                "agent_assigned": agent_assigned,
                "priority": priority,
                "status": "todo",
            }
            resp = await self.client.post("/api/tasks", json=payload)
            resp.raise_for_status()
            return TaskModel(**resp.json())
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise
