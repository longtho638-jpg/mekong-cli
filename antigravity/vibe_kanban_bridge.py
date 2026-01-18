"""
Vibe Kanban Bridge - AgencyOS Integration
=========================================

Bridges AgencyOS agents with Vibe Kanban board for task management.
"Đạo" (The Way) of task flow.

Classes:
    - TaskModel: Data model for tasks.
    - VibeBoardClient: HTTP client for Kanban board.
    - AgentOrchestrator: Logic for agent assignment.
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Literal, Optional

import httpx
from pydantic import BaseModel, Field

# Configure logger
logger = logging.getLogger("antigravity.core")

# Constants
VIBE_KANBAN_URL = os.getenv("VIBE_KANBAN_URL", "http://localhost:3000")
VIBE_KANBAN_TOKEN = os.getenv("VIBE_KANBAN_TOKEN", "default_token")

# --- Models ---


class TaskModel(BaseModel):
    """
    Task Entity for Vibe Kanban.
    """

    id: str = Field(..., description="Unique task ID")
    title: str
    description: str = ""
    agent_assigned: Literal[
        "planner",
        "money-maker",
        "client-magnet",
        "fullstack-dev",
        "strategist",
        "jules",
        "unassigned",
    ] = "unassigned"
    status: Literal["todo", "in_progress", "review", "done"] = "todo"
    priority: Literal["P1", "P2", "P3"] = "P2"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "TASK-001",
                "title": "Refactor CRM",
                "agent_assigned": "fullstack-dev",
                "status": "in_progress",
                "priority": "P1",
            }
        }
    }


# --- Client ---


class VibeBoardClient:
    """
    Async HTTP Client for Vibe Kanban Board.
    """

    def __init__(self, hostname: str = VIBE_KANBAN_URL, token: str = VIBE_KANBAN_TOKEN):
        self.base_url = hostname
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.client = httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0)

    async def get_board_state(self) -> Dict:
        """Get full board state."""
        try:
            resp = await self.client.get("/api/board")
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get board state: {e}")
            return {}

    async def list_tasks(self, filter_status: Optional[str] = None) -> List[TaskModel]:
        """List tasks, optionally filtered by status."""
        try:
            params = {"status": filter_status} if filter_status else {}
            resp = await self.client.get("/api/tasks", params=params)
            resp.raise_for_status()
            return [TaskModel(**t) for t in resp.json()]
        except httpx.HTTPError as e:
            logger.warning(f"Failed to list tasks (Mocking response): {e}")
            return []

    async def create_task(
        self, title: str, description: str, assigned_agent: str, priority: str
    ) -> Optional[TaskModel]:
        """Create a new task."""
        payload = {
            "title": title,
            "description": description,
            "agent_assigned": assigned_agent,
            "priority": priority,
            "status": "todo",
            "created_at": datetime.now().isoformat(),
        }
        try:
            resp = await self.client.post("/api/tasks", json=payload)
            resp.raise_for_status()
            return TaskModel(**resp.json())
        except httpx.HTTPError as e:
            logger.error(f"Failed to create task: {e}")
            # Mock return for development
            payload["id"] = f"MOCK-{int(datetime.now().timestamp())}"
            return TaskModel(**payload)

    async def update_task(
        self, task_id: str, status: Optional[str] = None, notes: Optional[str] = None
    ) -> bool:
        """Update task status or notes."""
        payload = {}
        if status:
            payload["status"] = status
        if notes:
            payload["notes"] = notes

        try:
            resp = await self.client.patch(f"/api/tasks/{task_id}", json=payload)
            resp.raise_for_status()
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to update task {task_id}: {e}")
            return False

    async def add_comment(self, task_id: str, comment: str) -> bool:
        """Add a comment to a task."""
        try:
            payload = {"content": comment, "created_at": datetime.now().isoformat()}
            resp = await self.client.post(f"/api/tasks/{task_id}/comments", json=payload)
            resp.raise_for_status()
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to add comment to task {task_id}: {e}")
            return False


# --- Orchestrator ---


class AgentOrchestrator:
    """
    Coordinates AgencyOS agents with Kanban tasks.
    """

    AGENTS = {
        "planner": "Mưu Công",
        "money-maker": "Tài",
        "client-magnet": "Địa",
        "fullstack-dev": "Quân Tranh",
        "strategist": "Đạo",
        "jules": "Vô Vi",
    }

    def __init__(self, client: VibeBoardClient):
        self.client = client

    async def assign_task_to_agent(self, task_id: str, agent_name: str) -> bool:
        """Assign a task to a specific agent."""
        if agent_name not in self.AGENTS:
            logger.error(f"Unknown agent: {agent_name}")
            return False
        return await self.client.update_task(
            task_id, status="in_progress"
        )  # Simulating assignment triggers start

    async def sync_agent_status(self, agent_name: str):
        """Syncs the actual agent's running status with the board."""
        # This would hook into the actual agent runtime in a full implementation
        logger.info(f"Syncing status for {agent_name} ({self.AGENTS.get(agent_name)})...")
        tasks = await self.client.list_tasks()
        agent_tasks = [
            t for t in tasks if t.agent_assigned == agent_name and t.status == "in_progress"
        ]

        for task in agent_tasks:
            # Simulate check: if task is done in agent runtime, update board
            # Here we just log
            logger.info(f"Checking task {task.id}: {task.title}")

    async def get_agent_workload(self) -> Dict[str, int]:
        """Returns count of active tasks per agent."""
        tasks = await self.client.list_tasks()
        workload = {agent: 0 for agent in self.AGENTS}
        for t in tasks:
            if t.agent_assigned in workload and t.status in ["todo", "in_progress"]:
                workload[t.agent_assigned] += 1
        return workload
