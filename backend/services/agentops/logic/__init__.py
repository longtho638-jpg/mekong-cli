"""
AgentOps Service Facade.
"""
from typing import Any, Dict

from backend.models.agentops import OpsExecuteRequest, OpsExecuteResponse

from .engine import AgentOpsEngine


class AgentOpsService(AgentOpsEngine):
    """Refactored AgentOps Service."""
    def __init__(self):
        super().__init__()

    async def list_all_ops(self) -> Dict[str, Any]:
        return {"total_ops": len(self.ops_registry), "status": "all_ready"}

    async def get_health_check(self) -> Dict[str, Any]:
        return {"status": "healthy", "total_ops": len(self.ops_registry)}
