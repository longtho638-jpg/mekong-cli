from antigravity.core.agent_swarm.enums import TaskPriority

# Import Swarm v2 components
from antigravity.core.agent_swarm.shortcuts import get_swarm
from antigravity.core.agent_swarm.shortcuts import submit_task as submit_v2_task
from antigravity.core.swarm.bus import MessageBus
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing_extensions import TypedDict

from backend.api.security.rbac import require_operator, require_viewer
from backend.websocket.server import emit_swarm_update

# Use the robust server implementation instead of the deleted manager
from backend.websocket.server import manager as ws_manager

router = APIRouter(prefix="/swarm", tags=["swarm"])


class SwarmAgentStatusDict(TypedDict):
    id: str
    name: str
    role: str
    is_busy: bool
    tasks_completed: int
    tasks_failed: int
    specialties: List[str]


class SwarmMetricsDict(TypedDict):
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    busy_agents: int
    idle_agents: int
    pending_tasks: int


class SwarmStatusResponse(TypedDict):
    running: bool
    agents: List[SwarmAgentStatusDict]
    metrics: SwarmMetricsDict


class SwarmTaskDict(TypedDict):
    id: str
    name: str
    status: str
    priority: str
    assigned_agent: Optional[str]
    created_at: float
    completed_at: Optional[float]


class TaskRequest(BaseModel):
    content: str
    swarm_type: str = "dev"  # dev or growth

class V2TaskRequest(BaseModel):
    name: str
    payload: Dict[str, Any]
    priority: str = "NORMAL"

@router.post("/dispatch", dependencies=[Depends(require_operator)])
async def dispatch_task(request: TaskRequest):
    """Dispatch a task to the legacy swarm."""
    # ... legacy implementation ...
    return {"status": "deprecated", "message": "Use /swarm/v2/dispatch"}

# --- Swarm V2 Endpoints ---

@router.get("/v2/status", response_model=SwarmStatusResponse, dependencies=[Depends(require_viewer)])
async def get_swarm_status() -> SwarmStatusResponse:
    """Get current status of Swarm v2 (Agents, Metrics)."""
    swarm = get_swarm()

    # Collect Agent Status
    agents: List[SwarmAgentStatusDict] = []
    for agent_id, agent in swarm.registry.agents.items():
        agents.append({
            "id": agent.id,
            "name": agent.name,
            "role": agent.role.value,
            "is_busy": agent.is_busy,
            "tasks_completed": agent.tasks_completed,
            "tasks_failed": agent.tasks_failed,
            "specialties": agent.specialties
        })

    # Metrics
    metrics: SwarmMetricsDict = {
        "total_tasks": swarm.metrics.total_tasks,
        "completed_tasks": swarm.metrics.completed_tasks,
        "failed_tasks": swarm.metrics.failed_tasks,
        "busy_agents": swarm.metrics.busy_agents,
        "idle_agents": swarm.metrics.idle_agents,
        "pending_tasks": swarm.task_manager.get_pending_count()
    }

    return {
        "running": swarm.state.running,
        "agents": agents,
        "metrics": metrics
    }

@router.post("/v2/dispatch", dependencies=[Depends(require_operator)])
async def dispatch_v2_task(request: V2TaskRequest):
    """Submit a task to Swarm v2."""
    try:
        priority = TaskPriority[request.priority.upper()]
    except KeyError:
        priority = TaskPriority.NORMAL

    task_id = submit_v2_task(
        name=request.name,
        payload=request.payload,
        priority=priority
    )
    return {"status": "submitted", "task_id": task_id}

@router.get("/v2/tasks", response_model=List[SwarmTaskDict], dependencies=[Depends(require_viewer)])
async def list_v2_tasks() -> List[SwarmTaskDict]:
    """List active tasks in Swarm v2."""
    swarm = get_swarm()
    tasks: List[SwarmTaskDict] = []
    # In a real app, we might filter or paginate.
    # Accessing .tasks directly for MVP.
    with swarm.task_manager._lock:
        for t in swarm.task_manager.tasks.values():
            tasks.append({
                "id": t.id,
                "name": t.name,
                "status": t.status.value,
                "priority": t.priority.value,
                "assigned_agent": t.assigned_agent,
                "created_at": t.created_at,
                "completed_at": t.completed_at
            })
    return tasks

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "anonymous"):
    """
    WebSocket endpoint for real-time swarm updates.
    """
    try:
        await ws_manager.connect(websocket, token)
        try:
            while True:
                # Keep connection alive and listen for client messages
                await websocket.receive_text()
        except WebSocketDisconnect:
            # Client disconnected
            pass
    except Exception:
        pass
