"""
Router Controller - HTTP handlers for hybrid routing operations
"""

from fastapi import HTTPException
from typing import Dict, Any
from backend.models.router import RouterRequest, RouterResponse
from backend.models.command import CommandRequest
from backend.services.router_service import RouterService


class RouterController:
    """Controller for routing operations"""
    
    def __init__(self, router_service: RouterService):
        self.router_service = router_service
    
    async def route_task(self, request: CommandRequest) -> RouterResponse:
        """Route a task to optimal AI provider"""
        try:
            router_request = RouterRequest(
                task=request.prompt,
                tokens=len(request.prompt.split()) * 2
            )
            return await self.router_service.route_task(router_request)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to route task: {str(e)}")
    
    async def get_routing_stats(self) -> Dict[str, Any]:
        """Get routing statistics"""
        try:
            return await self.router_service.get_routing_stats()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get routing stats: {str(e)}")