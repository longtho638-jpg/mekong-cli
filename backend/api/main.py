"""
🏯 AGENCY OS - Unified Backend API
==================================

The central nervous system for Mekong-CLI and Agency OS.

"Không đánh mà thắng" - Win Without Fighting
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure parent is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import Routers
from backend.api.routers import (
    i18n,
    vietnam,
    crm,
    scheduler,
    franchise,
    agents,
    router as hybrid_router,
    vibes,
    commands
)
from backend.routes import antigravity
from backend.websocket.routes import router as websocket_router
from backend.websocket import manager as ws_manager

# Initialize FastAPI
app = FastAPI(
    title="🏯 Agency OS API",
    description="The One-Person Unicorn Operating System API",
    version="2.0.0",
    contact={
        "name": "Mekong HQ",
        "url": "https://agencyos.network",
    }
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(i18n.router)
app.include_router(vietnam.router)
app.include_router(crm.router)
app.include_router(scheduler.router)
app.include_router(franchise.router)
app.include_router(agents.router)
app.include_router(hybrid_router.router)
app.include_router(vibes.router)
app.include_router(commands.router)
app.include_router(antigravity.router)  # 🚀 AntigravityKit API
app.include_router(websocket_router)  # 🔄 WebSocket Real-time

# Root Endpoints
@app.get("/")
def root():
    """API root - Agency OS info."""
    return {
        "name": "Agency OS Unified API",
        "tagline": "The One-Person Unicorn Operating System",
        "version": "2.0.0",
        "binh_phap": "Không đánh mà thắng",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "modules": {
            "i18n": "loaded",
            "vietnam": "loaded",
            "crm": "loaded",
            "hybrid_router": "loaded",
            "agents": "loaded",
            "antigravity": "loaded",
            "websocket": "loaded"
        },
        "websocket": {
            "connections": ws_manager.connection_count,
            "endpoint": "/ws"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
