"""
Mekong-CLI Backend - Refactored FastAPI Server
Clean Architecture with Service Layer and Controller Pattern
"""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.config import settings
from backend.api.routers import (
    agents,
    campaigns,
    mekong_commands,
    vibes,
    monitor,
    workflow,
    agents_creator,
    swarm,
    audit,
)
from backend.api.routers import (
    router as hybrid_router,
)
from backend.routes.agentops import router as agentops_router
from backend.api.auth.router import router as auth_router

# Initialize FastAPI
app = FastAPI(
    title="Mekong-CLI API - Refactored",
    description="🌊 Deploy Your Agency in 15 Minutes - Backend API with Clean Architecture",
    version=settings.api_version,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(campaigns.router)
app.include_router(agentops_router)
app.include_router(agents.router)
app.include_router(hybrid_router.router)
app.include_router(vibes.router)
app.include_router(mekong_commands.router)
app.include_router(monitor.router.router)
app.include_router(workflow.router.router)
app.include_router(agents_creator.router.router)
app.include_router(audit.router)
app.include_router(auth_router)

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "mekong-cli-api",
        "version": "2.0.0",
        "architecture": "clean_architecture",
        "tagline": "Deploy Your Agency in 15 Minutes",
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
            "controllers": "active",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
