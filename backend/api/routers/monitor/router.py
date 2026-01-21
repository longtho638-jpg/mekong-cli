from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import subprocess
import json
import asyncio

router = APIRouter(prefix="/monitor", tags=["monitor"])

class SystemStatus(BaseModel):
    name: str
    status: str
    message: str
    last_check: str
    details: Dict[str, Any]

class Anomaly(BaseModel):
    system: str
    type: str
    message: str
    severity: str
    recovery_action: Optional[str] = None

class DashboardResponse(BaseModel):
    timestamp: str
    systems: Dict[str, SystemStatus]
    anomalies: List[Anomaly]
    summary: str

@router.get("/status", response_model=DashboardResponse)
async def get_status():
    """Get real-time system status from Commander Engine."""
    try:
        # Call the commander_engine.py script directly
        # In a real production environment, we might want to import the handler directly
        # or have a shared service, but calling the script ensures consistent behavior
        # with the CLI.
        # We use the shim script which imports the MCP handler.
        process = await asyncio.create_subprocess_exec(
            "python3", "scripts/vibeos/commander_engine.py", "--status",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        # The script prints to stdout in a human-readable format by default.
        # We need to adapt it or modify the script to output JSON.
        # For now, let's modify the script/handler to support --json output or
        # import the handler directly here if possible.

        # Better approach: Import the handler directly
        from antigravity.mcp_servers.commander_server.handlers import CommanderHandler
        handler = CommanderHandler()
        dashboard_data = await handler.get_dashboard()
        return dashboard_data

    except Exception as e:
        return {
            "timestamp": "",
            "systems": {},
            "anomalies": [],
            "summary": f"Error fetching status: {str(e)}"
        }
