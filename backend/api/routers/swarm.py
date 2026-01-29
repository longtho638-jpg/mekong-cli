from antigravity.core.swarm.engine import AgentSwarm
from antigravity.core.swarm.enums import TaskPriority
from antigravity.core.swarm.shortcuts import get_swarm
from antigravity.core.swarm.shortcuts import submit_task as submit_v2_task
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from backend.api.security.rbac import require_operator, require_viewer
from backend.websocket.server import manager as ws_manager

router = APIRouter(prefix="/swarm", tags=["swarm"])


# --- Schemas ---


class SwarmAgentStatus(BaseModel):
    id: str
    name: str
    role: str
    is_busy: bool
    tasks_completed: int
    tasks_failed: int
    specialties: Optional[List[str]] = None


class SwarmMetrics(BaseModel):
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    busy_agents: int
    idle_agents: int
    pending_tasks: int


class SwarmStatusResponse(BaseModel):
    running: bool
    agents: List[SwarmAgentStatus]
    metrics: SwarmMetrics


class SwarmTaskResponse(BaseModel):
    id: str
    name: str
    status: str
    priority: int
    assigned_agent: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None


class TaskSubmitRequest(BaseModel):
    name: str
    payload: Dict[str, Any]
    priority: str = Field(default="NORMAL", description="CRITICAL, HIGH, NORMAL, LOW, BACKGROUND")


class TaskSubmitResponse(BaseModel):
    status: str
    task_id: str


# --- Dependency ---


def get_swarm_instance() -> AgentSwarm:
    return get_swarm()


# --- Endpoints ---


@router.get("/status", response_model=SwarmStatusResponse, dependencies=[Depends(require_viewer)])
async def get_swarm_status(swarm: AgentSwarm = Depends(get_swarm_instance)) -> SwarmStatusResponse:
    """
    Get current status of Swarm (Agents, Metrics).
    """
    # Helper to convert dict to Pydantic model if needed,
    # but swarm.get_status() returns a dict that matches the schema structure mostly.
    # We might need to map it explicitly to ensure type safety.

    status_dict = swarm.get_status()

    # Map agents dict to list
    agents_list = []
    for agent_id, agent_data in status_dict["agents"].items():
        # Agent data from get_status is a dict
        agents_list.append(
            SwarmAgentStatus(
                id=agent_id,
                name=agent_data["name"],
                role=agent_data["role"],
                is_busy=agent_data["busy"],
                tasks_completed=agent_data["completed"],
                tasks_failed=agent_data["failed"],
                # specialties might not be in the simple get_status dict,
                # let's check registry if needed, but for now we use what's available
                specialties=None,
            )
        )

    metrics = SwarmMetrics(
        total_tasks=status_dict["metrics"]["total_tasks"],
        completed_tasks=status_dict["metrics"]["completed_tasks"],
        failed_tasks=status_dict["metrics"]["failed_tasks"],
        busy_agents=status_dict["metrics"]["busy_agents"],
        idle_agents=status_dict["metrics"]["total_agents"]
        - status_dict["metrics"]["busy_agents"],  # Approximate
        pending_tasks=status_dict["pending_tasks"],
    )

    return SwarmStatusResponse(running=status_dict["running"], agents=agents_list, metrics=metrics)


@router.post(
    "/dispatch", response_model=TaskSubmitResponse, dependencies=[Depends(require_operator)]
)
async def dispatch_task(request: TaskSubmitRequest) -> TaskSubmitResponse:
    """
    Submit a task to the Swarm.
    """
    try:
        priority_enum = TaskPriority[request.priority.upper()]
    except KeyError:
        priority_enum = TaskPriority.NORMAL

    task_id = submit_v2_task(name=request.name, payload=request.payload, priority=priority_enum)

    return TaskSubmitResponse(status="submitted", task_id=task_id)


@router.get(
    "/tasks", response_model=List[SwarmTaskResponse], dependencies=[Depends(require_viewer)]
)
async def list_tasks(swarm: AgentSwarm = Depends(get_swarm_instance)) -> List[SwarmTaskResponse]:
    """
    List active tasks in the Swarm.
    """
    # Accessing internal task manager safely
    tasks_data = swarm.task_manager.get_all_tasks()

    response_list = []
    for t in tasks_data.values():
        response_list.append(
            SwarmTaskResponse(
                id=t.id,
                name=t.name,
                status=t.status.value,
                priority=t.priority.value,
                assigned_agent=t.assigned_agent,
                created_at=t.created_at,
                completed_at=t.completed_at,
            )
        )

    # Sort by created_at desc
    response_list.sort(key=lambda x: x.created_at, reverse=True)
    return response_list


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
