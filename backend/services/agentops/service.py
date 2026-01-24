"""
AgentOps Service - Business logic for AgentOps operations (Facade)
"""

from typing import Any, Dict, List, TypedDict

from backend.models.agentops import OpsExecuteRequest, OpsExecuteResponse

from .executor import OpsExecutor
from .registry import OpsRegistry
from .reporting import BinhPhapChaptersResponse, DepartmentSummary, OpsReporting


class OpsStatusResponse(TypedDict):
    ops: Dict[str, Any]
    available_actions: List[str]


class HealthCheckResponse(TypedDict):
    status: str
    total_ops: int
    healthy_ops: int
    message: str


class AgentOpsService:
    """Service for managing AgentOps operations"""

    def __init__(self):
        self.registry = OpsRegistry()
        self.executor = OpsExecutor(self.registry)
        self.reporting = OpsReporting(self.registry)

    @property
    def ops_registry(self):
        return self.registry.get_registry()

    async def list_all_ops(self) -> Dict[str, Any]:
        """List all AgentOps modules organized by category"""
        return await self.reporting.list_all_ops()

    async def get_ops_status(self, category: str) -> OpsStatusResponse:
        """Get status of specific AgentOps category"""
        ops_registry = self.registry.get_registry()
        if category not in ops_registry:
            raise ValueError(f"Unknown ops: {category}")

        ops = ops_registry[category]
        return {
            "ops": ops.model_dump(),
            "available_actions": ["status", "execute", "reset"],
        }

    async def execute_ops(self, request: OpsExecuteRequest) -> OpsExecuteResponse:
        """Execute an AgentOps action"""
        return await self.executor.execute_ops(request)

    async def get_health_check(self) -> HealthCheckResponse:
        """Get health check for AgentOps system"""
        ops_registry = self.registry.get_registry()
        healthy_count = sum(
            1 for ops in ops_registry.values() if ops.status == "ready"
        )

        return {
            "status": "healthy" if healthy_count == len(ops_registry) else "degraded",
            "total_ops": len(ops_registry),
            "healthy_ops": healthy_count,
            "message": f"AgentOps: {healthy_count}/{len(ops_registry)} ready",
        }

    async def get_categories_summary(self) -> DepartmentSummary:
        """Get summary by department category"""
        return await self.reporting.get_categories_summary()

    async def get_binh_phap_chapters(self) -> BinhPhapChaptersResponse:
        """Get Binh Pháp 13 Chapters integrated with AgentOps"""
        return await self.reporting.get_binh_phap_chapters()
