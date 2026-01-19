"""
Vibe Controller - HTTP handlers for vibe operations
"""

from typing import Any, Dict

from fastapi import HTTPException, Query

from backend.models.vibe import VibeRequest, VibeResponse
from backend.services.vibe_service import VibeService


class VibeController:
    """Controller for vibe operations"""

    def __init__(self, vibe_service: VibeService):
        self.vibe_service = vibe_service

    async def get_available_vibes(self) -> Dict[str, Any]:
        """Get list of available vibes"""
        try:
            return await self.vibe_service.get_available_vibes()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get vibes: {str(e)}")

    async def set_vibe(self, request: VibeRequest) -> VibeResponse:
        """Set vibe based on region or location"""
        try:
            return await self.vibe_service.set_vibe(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to set vibe: {str(e)}")

    async def get_vibe_prompt(self, context: str = Query("")) -> Dict[str, Any]:
        """Get system prompt for current vibe"""
        try:
            return await self.vibe_service.get_vibe_prompt(context)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get vibe prompt: {str(e)}")
