"""
Vibe Kanban Bridge Facade.
"""
from .client import VibeBoardClient
from .models import TaskModel


class AgentOrchestrator:
    def __init__(self, client: VibeBoardClient):
        self.client = client

    async def get_agent_workload(self) -> dict:
        return {}

__all__ = ['TaskModel', 'VibeBoardClient', 'AgentOrchestrator']
