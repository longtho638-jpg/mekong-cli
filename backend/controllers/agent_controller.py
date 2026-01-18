"""
Agent Controller - HTTP handlers for agent operations
"""

from typing import Any, Dict

from fastapi import HTTPException

from backend.models.agent import AgentResponse, AgentTask
from backend.services.agent_service import AgentService


class AgentController:
    """Controller for agent operations"""

    def __init__(self, agent_service: AgentService):
        self.agent_service = agent_service

    async def list_agents(self) -> Dict[str, Any]:
        """List all available agents"""
        try:
            return await self.agent_service.list_agents()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")

    async def execute_agent_task(self, task: AgentTask) -> AgentResponse:
        """Execute task for a specific agent"""
        try:
            return await self.agent_service.execute_agent_task(task)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to execute agent task: {str(e)}")
