"""
Agent Service - Business logic for agent operations
"""

import logging
from datetime import datetime
from typing import Dict, List

from typing_extensions import TypedDict

from backend.models.agent import AgentResponse, AgentTask
from core.agent_orchestrator import get_orchestrator

logger = logging.getLogger(__name__)


class AgentInfo(TypedDict):
    """Information about an available agent"""

    name: str
    status: str


class AgentListResponse(TypedDict):
    """Response structure for listing agents"""

    quad_agents: List[AgentInfo]
    mekong_agents: List[AgentInfo]
    total: int


class AgentService:
    """Service for managing agent operations"""

    def __init__(self):
        self.orchestrator = get_orchestrator()

    async def list_agents(self) -> AgentListResponse:
        """List all available agents from the Orchestrator"""
        agents = self.orchestrator.registry.list_agents()

        # Simple classification based on name/path logic
        quad_agents: List[AgentInfo] = []
        mekong_agents: List[AgentInfo] = []

        for name in agents:
            agent_info: AgentInfo = {"name": name, "status": "ready"}
            if "mekong" in name or "zalo" in name:
                mekong_agents.append(agent_info)
            else:
                quad_agents.append(agent_info)

        return {
            "quad_agents": quad_agents,
            "mekong_agents": mekong_agents,
            "total": len(agents),
        }

    async def execute_agent_task(self, task: AgentTask) -> AgentResponse:
        """Execute a task for a specific agent"""
        logger.info(f"Executing task for agent {task.agent_name}: {task.task}")

        # Use synchronous orchestrator in async context
        # In a real app, this should be run_in_executor
        result = self.orchestrator.execute_workflow(f"{task.agent_name}: {task.task}")

        return AgentResponse(
            status=result.get("status", "unknown"),
            agent=task.agent_name,
            task=task.task,
            estimated_time=f"{result.get('duration', 0):.2f}s",
            job_id=f"job_{datetime.now().timestamp()}",
        )
