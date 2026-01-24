"""
Command Controller - HTTP handlers for Mekong command operations
"""

from typing import Any, Dict

from fastapi import HTTPException

from backend.models.command import CommandRequest, CommandResponse
from backend.services.command_service import CommandListResponse, CommandService


class CommandController:
    """Controller for command operations"""

    def __init__(self, command_service: CommandService):
        self.command_service = command_service

    async def execute_command(self, command_name: str, request: CommandRequest) -> CommandResponse:
        """Execute a specific Mekong command"""
        try:
            return await self.command_service.execute_command(command_name, request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to execute command: {str(e)}")

    async def get_commands_list(self) -> CommandListResponse:
        """Get list of all available commands"""
        try:
            return await self.command_service.get_commands_list()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get commands list: {str(e)}")
