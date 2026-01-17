"""
Mekong-CLI Backend - Refactored FastAPI Server
Clean Architecture with Service Layer and Controller Pattern

Endpoints:
- /api/agents - Agent operations via AgentController
- /api/commands/* - Mekong commands via CommandController  
- /api/router - Hybrid routing via RouterController
- /api/vibes - Vibe operations via VibeController
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings

# Import existing routes
from backend.routes.campaigns import router as campaigns_router
from backend.routes.agentops import router as agentops_router

# Import services
from backend.services.agent_service import AgentService
from backend.services.command_service import CommandService
from backend.services.vibe_service import VibeService
from backend.services.router_service import RouterService

# Import controllers
from backend.controllers.agent_controller import AgentController
from backend.controllers.command_controller import CommandController
from backend.controllers.vibe_controller import VibeController
from backend.controllers.router_controller import RouterController

# Import models
from backend.models.agent import AgentTask
from backend.models.command import CommandRequest
from backend.models.vibe import VibeRequest


# Initialize FastAPI
app = FastAPI(
    title="Mekong-CLI API - Refactored",
    description="🌊 Deploy Your Agency in 15 Minutes - Backend API with Clean Architecture",
    version=settings.VERSION,
)

# Mount existing routes
app.include_router(campaigns_router)
app.include_router(agentops_router)

# CORS middleware - Environment-based configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Initialize services
agent_service = AgentService()
command_service = CommandService()
vibe_service = VibeService()
router_service = RouterService()

# Initialize controllers
agent_controller = AgentController(agent_service)
command_controller = CommandController(command_service)
vibe_controller = VibeController(vibe_service)
router_controller = RouterController(router_service)


# ============ Health ============

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "mekong-cli-api",
        "version": "2.0.0",
        "architecture": "clean_architecture",
        "tagline": "Deploy Your Agency in 15 Minutes"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "agent_service": "active",
            "command_service": "active", 
            "vibe_service": "active",
            "router_service": "active",
            "controllers": "active"
        }
    }


# ============ Agents ============

@app.get("/api/agents")
async def get_agents():
    """List all available agents via AgentController"""
    return await agent_controller.list_agents()


@app.post("/api/agents/run")
async def run_agent(task: AgentTask):
    """Run a specific agent with a task via AgentController"""
    return await agent_controller.execute_agent_task(task)


# ============ Hybrid Router ============

@app.get("/api/router/stats")
async def get_router_stats():
    """Get Hybrid Router statistics via RouterController"""
    return await router_controller.get_routing_stats()


@app.post("/api/router/route")
async def route_task(request: CommandRequest):
    """Route a task to optimal AI provider via RouterController"""
    return await router_controller.route_task(request)


# ============ Vibe Tuner ============

@app.get("/api/vibes")
async def get_vibes():
    """List all available vibes via VibeController"""
    return await vibe_controller.get_available_vibes()


@app.post("/api/vibes/set")
async def set_vibe(request: VibeRequest):
    """Set active vibe by region or location via VibeController"""
    return await vibe_controller.set_vibe(request)


@app.get("/api/vibes/prompt")
async def get_vibe_prompt(context: str = ""):
    """Get system prompt for current vibe via VibeController"""
    return await vibe_controller.get_vibe_prompt(context)


# ============ Commands (14 Mekong Commands) ============

@app.post("/api/commands/khach-hang")
async def cmd_khach_hang(request: CommandRequest):
    """§1 Customer Profile via CommandController"""
    return await command_controller.execute_command("khach-hang", request)


@app.post("/api/commands/ke-hoach-kinh-doanh")
async def cmd_ke_hoach_kinh_doanh(request: CommandRequest):
    """§2 Business Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-kinh-doanh", request)


@app.post("/api/commands/nghien-cuu-thi-truong")
async def cmd_nghien_cuu_thi_truong(request: CommandRequest):
    """§3 Market Research via CommandController"""
    return await command_controller.execute_command("nghien-cuu-thi-truong", request)


@app.post("/api/commands/nhan-dien-thuong-hieu")
async def cmd_nhan_dien_thuong_hieu(request: CommandRequest):
    """§4 Brand Identity via CommandController"""
    return await command_controller.execute_command("nhan-dien-thuong-hieu", request)


@app.post("/api/commands/thong-diep-tiep-thi")
async def cmd_thong_diep_tiep_thi(request: CommandRequest):
    """§5 Marketing Message via CommandController"""
    return await command_controller.execute_command("thong-diep-tiep-thi", request)


@app.post("/api/commands/ke-hoach-tiep-thi")
async def cmd_ke_hoach_tiep_thi(request: CommandRequest):
    """§6 Marketing Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-tiep-thi", request)


@app.post("/api/commands/noi-dung-tiep-thi")
async def cmd_noi_dung_tiep_thi(request: CommandRequest):
    """§7 Marketing Content via CommandController"""
    return await command_controller.execute_command("noi-dung-tiep-thi", request)


@app.post("/api/commands/y-tuong-social-media")
async def cmd_y_tuong_social_media(request: CommandRequest):
    """§8 Social Media Content via CommandController"""
    return await command_controller.execute_command("y-tuong-social-media", request)


@app.post("/api/commands/chien-luoc-ban-hang")
async def cmd_chien_luoc_ban_hang(request: CommandRequest):
    """§9 Sales Strategy via CommandController"""
    return await command_controller.execute_command("chien-luoc-ban-hang", request)


@app.post("/api/commands/ke-hoach-pr")
async def cmd_ke_hoach_pr(request: CommandRequest):
    """§10 PR Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-pr", request)


@app.post("/api/commands/ke-hoach-tang-truong")
async def cmd_ke_hoach_tang_truong(request: CommandRequest):
    """§11 Growth Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-tang-truong", request)


@app.post("/api/commands/nong-san")
async def cmd_nong_san(request: CommandRequest):
    """Local Market via CommandController"""
    return await command_controller.execute_command("nong-san", request)


@app.post("/api/commands/ban-hang")
async def cmd_ban_hang(request: CommandRequest):
    """Sales Ops via CommandController"""
    return await command_controller.execute_command("ban-hang", request)


@app.post("/api/commands/tiep-thi")
async def cmd_tiep_thi(request: CommandRequest):
    """Marketing Ops via CommandController"""
    return await command_controller.execute_command("tiep-thi", request)


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)