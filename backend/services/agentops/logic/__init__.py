"""
AgentOps Service Facade.
"""
from typing import Any, Dict

from typing_extensions import TypedDict

from backend.models.agentops import OpsExecuteRequest, OpsExecuteResponse

from .engine import AgentOpsEngine


class OpsListResponse(TypedDict):
    total_ops: int
    status: str


class OpsHealthResponse(TypedDict):
    status: str
    total_ops: int


class AgentOpsService(AgentOpsEngine):
    """Refactored AgentOps Service."""
    def __init__(self):
        super().__init__()

    async def list_all_ops(self) -> OpsListResponse:
        return {"total_ops": len(self.ops_registry), "status": "all_ready"}

    async def get_health_check(self) -> OpsHealthResponse:
        return {"status": "healthy", "total_ops": len(self.ops_registry)}
