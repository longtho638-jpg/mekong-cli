from fastapi import APIRouter
from pydantic import BaseModel

from antigravity.core.swarm.bus import MessageBus
from antigravity.core.swarm.orchestrator import SwarmOrchestrator
from antigravity.core.swarm.patterns.dev_swarm import (
    ArchitectAgent,
    CoderAgent,
    ReviewerAgent,
)

router = APIRouter(prefix="/swarm", tags=["swarm"])

# Singleton Swarm (for demo purposes)
swarm = SwarmOrchestrator()
bus = swarm.bus

# Register Dev Swarm Agents
swarm.register_agent(ArchitectAgent("architect", "Architect", bus))
swarm.register_agent(CoderAgent("coder", "Coder", bus))
swarm.register_agent(ReviewerAgent("reviewer", "Reviewer", bus))


class TaskRequest(BaseModel):
    content: str
    swarm_type: str = "dev"  # dev or growth


@router.post("/dispatch")
async def dispatch_task(request: TaskRequest):
    """Dispatch a task to the swarm."""
    if request.swarm_type == "dev":
        swarm.dispatch("architect", request.content)
        return {"status": "dispatched", "target": "architect"}
    else:
        # Load growth swarm on demand or error
        return {"status": "error", "message": "Unknown swarm type"}


@router.get("/history")
async def get_history():
    """Get message bus history."""
    return [msg.to_dict() for msg in bus.get_history()]
