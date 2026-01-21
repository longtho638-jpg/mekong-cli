from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel

from antigravity.core.swarm.bus import MessageBus
from antigravity.core.swarm.orchestrator import SwarmOrchestrator
from antigravity.core.swarm.patterns.dev_swarm import (
    ArchitectAgent,
    CoderAgent,
    ReviewerAgent,
)
# Use the robust server implementation instead of the deleted manager
from backend.websocket.server import manager as ws_manager
from backend.api.security.rbac import require_operator, require_viewer

router = APIRouter(prefix="/swarm", tags=["swarm"])

# Singleton Swarm (for demo purposes)
# Inject WebSocket manager into MessageBus
swarm = SwarmOrchestrator(websocket_manager=ws_manager)
bus = swarm.bus

# Register Dev Swarm Agents
swarm.register_agent(ArchitectAgent("architect", "Architect", bus))
swarm.register_agent(CoderAgent("coder", "Coder", bus))
swarm.register_agent(ReviewerAgent("reviewer", "Reviewer", bus))


class TaskRequest(BaseModel):
    content: str
    swarm_type: str = "dev"  # dev or growth


@router.post("/dispatch", dependencies=[Depends(require_operator)])
async def dispatch_task(request: TaskRequest):
    """Dispatch a task to the swarm."""
    if request.swarm_type == "dev":
        swarm.dispatch("architect", request.content)
        return {"status": "dispatched", "target": "architect"}
    else:
        # Load growth swarm on demand or error
        return {"status": "error", "message": "Unknown swarm type"}


@router.get("/history", dependencies=[Depends(require_viewer)])
async def get_history():
    """Get message bus history."""
    return [msg.to_dict() for msg in bus.get_history()]


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "anonymous"):
    """
    WebSocket endpoint for real-time swarm updates.
    Requires token query param in production.
    """
    try:
        await ws_manager.connect(websocket, token)
        try:
            while True:
                # Keep connection alive and listen for client messages
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            # Client disconnected
            pass
    except Exception:
        pass
