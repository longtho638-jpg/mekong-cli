"""
🏯 AgentOps API Routes - Refactored
Using Service Layer and Controller Pattern for Clean Architecture
"""

from fastapi import APIRouter

from backend.controllers.agentops_controller import AgentOpsController
from backend.models.agentops import OpsExecuteRequest
from backend.services.agentops_service import AgentOpsService

router = APIRouter(prefix="/api/agentops", tags=["AgentOps"])

# Initialize service and controller
agentops_service = AgentOpsService()
agentops_controller = AgentOpsController(agentops_service)


@router.get("/")
async def list_all_ops():
    """
    📊 List all AgentOps modules via AgentOpsController
    Returns status of all 50 ops aligned with agencyos.network
    """
    return await agentops_controller.list_all_ops()


@router.get("/health")
async def health_check():
    """
    🏥 Health check for AgentOps system via AgentOpsController
    """
    return await agentops_controller.get_health_check()


@router.get("/{category}")
async def get_ops_status(category: str):
    """
    📈 Get status of specific AgentOps category via AgentOpsController
    """
    return await agentops_controller.get_ops_status(category)


@router.post("/execute")
async def execute_ops(request: OpsExecuteRequest):
    """
    ⚡ Execute an AgentOps action via AgentOpsController
    """
    return await agentops_controller.execute_ops(request)


@router.get("/categories/summary")
async def get_categories_summary():
    """
    📊 Summary by department category via AgentOpsController
    """
    return await agentops_controller.get_categories_summary()


# ============ Binh Phap Integration ============


@router.get("/binh-phap/chapters")
async def get_binh_phap_chapters():
    """
    🏯 Binh Pháp 13 Chapters - Strategic Layer via AgentOpsController
    Integrated within AgentOps DNA
    """
    return await agentops_controller.get_binh_phap_chapters()
