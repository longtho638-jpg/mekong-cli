"""
AgentOps Controller - HTTP handlers for AgentOps operations
"""

from fastapi import HTTPException
from typing import Dict, Any
from backend.models.agentops import OpsExecuteRequest, OpsExecuteResponse
from backend.services.agentops_service import AgentOpsService


class AgentOpsController:
    """Controller for AgentOps operations"""
    
    def __init__(self, agentops_service: AgentOpsService):
        self.agentops_service = agentops_service
    
    async def list_all_ops(self) -> Dict[str, Any]:
        """List all AgentOps modules"""
        try:
            return await self.agentops_service.list_all_ops()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to list ops: {str(e)}")
    
    async def get_health_check(self) -> Dict[str, Any]:
        """Get health check for AgentOps system"""
        try:
            return await self.agentops_service.get_health_check()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get health check: {str(e)}")
    
    async def get_ops_status(self, category: str) -> Dict[str, Any]:
        """Get status of specific AgentOps category"""
        try:
            return await self.agentops_service.get_ops_status(category)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get ops status: {str(e)}")
    
    async def execute_ops(self, request: OpsExecuteRequest) -> OpsExecuteResponse:
        """Execute an AgentOps action"""
        try:
            return await self.agentops_service.execute_ops(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to execute ops: {str(e)}")
    
    async def get_categories_summary(self) -> Dict[str, Any]:
        """Get summary by department category"""
        try:
            return await self.agentops_service.get_categories_summary()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get categories summary: {str(e)}")
    
    async def get_binh_phap_chapters(self) -> Dict[str, Any]:
        """Get Binh Pháp 13 Chapters integrated with AgentOps"""
        try:
            return await self.agentops_service.get_binh_phap_chapters()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get binh phap chapters: {str(e)}")