"""
Agent Service - Business logic for agent operations
"""

from datetime import datetime
from typing import Any, Dict

from backend.models.agent import AgentResponse, AgentTask
from core.agent_orchestrator import get_orchestrator


class AgentService:
    """Service for managing agent operations"""

    def __init__(self):
        self.orchestrator = get_orchestrator()

    async def list_agents(self) -> Dict[str, Any]:
        """List all available agents from the Orchestrator"""
        agents = self.orchestrator.registry.list_agents()

        # Simple classification based on name/path logic
        quad_agents = []
        mekong_agents = []

        for name in agents:
            agent_info = {"name": name, "status": "ready"}
            if "mekong" in name or "zalo" in name:
                mekong_agents.append(agent_info)
            else:
                quad_agents.append(agent_info)

        return {"quad_agents": quad_agents, "mekong_agents": mekong_agents, "total": len(agents)}

    async def execute_agent_task(self, task: AgentTask) -> AgentResponse:
        """Execute a task for a specific agent"""

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
