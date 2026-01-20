"""
Vibe Kanban Bridge Facade.
"""

from collections import defaultdict

from .client import VibeBoardClient
from .models import TaskModel


class AgentOrchestrator:
    def __init__(self, client: VibeBoardClient):
        self.client = client

    async def get_agent_workload(self) -> dict:
        """Get task count per agent, excluding completed tasks."""
        tasks = await self.client.list_tasks()
        workload = defaultdict(int)
        for task in tasks:
            # Count only non-done tasks as workload
            if task.status != "done":
                workload[task.agent_assigned] += 1
        return dict(workload)


__all__ = ["TaskModel", "VibeBoardClient", "AgentOrchestrator"]
