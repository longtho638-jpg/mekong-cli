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
        self.base_url = hostname
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.client = httpx.AsyncClient(base_url=self.base_url, headers=self.headers)

    async def list_tasks(self) -> List[TaskModel]:
        try:
            resp = await self.client.get("/api/tasks")
            return [TaskModel(**t) for t in resp.json()]
        except Exception: return []
