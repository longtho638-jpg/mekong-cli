"""
🏯 AGENCY OS - Unified Backend API - Refactored
Clean Architecture with Service Layer and Controller Pattern

The central nervous system for Mekong-CLI and Agency OS.
"Không đánh mà thắng" - Win Without Fighting
"""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure parent is in path
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from backend.api.config import settings

# Import routers (only those not refactored yet)
from backend.api.middleware.metrics import setup_metrics

# Import middleware for multi-tenant, rate limiting, and metrics
from backend.api.middleware.multitenant import (
    MultiTenantMiddleware,
    setup_tenant_routes,
)
from backend.api.middleware.rate_limiting import (
    setup_rate_limit_routes,
    setup_rate_limiting,
)
from backend.api.routers import code as code_router
from backend.api.routers import (
    crm,
    franchise,
    i18n,
    scheduler,
    vietnam,
)
from backend.api.routers import dashboard as dashboard_router
from backend.api.routers import webhooks as webhooks_router
from backend.api.routers.router import router as hybrid_router

# Import unified main router (refactored backend)
from backend.main import app as backend_app
from backend.routes import antigravity
from backend.websocket.routes import router as websocket_router

# Initialize FastAPI
app = FastAPI(
    title="🏯 Agency OS Unified API - Refactored",
    description="The One-Person Unicorn Operating System API with Clean Architecture",
    version=settings.VERSION,
    contact={
        "name": "Mekong HQ",
        "url": "https://agencyos.network",
    },
)

# Add middleware in correct order
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Add multi-tenant middleware
app.middleware("http")(MultiTenantMiddleware().dispatch)

# Setup rate limiting and metrics
setup_rate_limiting(app)
setup_metrics(app)

# Include Routers
app.include_router(i18n.router)
app.include_router(vietnam.router)
app.include_router(crm.router)
app.include_router(scheduler.router)
app.include_router(franchise.router)
app.include_router(hybrid_router)
app.include_router(antigravity.router)  # 🚀 AntigravityKit API
app.include_router(code_router.router)  # 🔌 OpenCode Integration
app.include_router(webhooks_router.router)  # 🔗 Gumroad Webhooks
app.include_router(dashboard_router.router)  # 📊 Dashboard API
app.include_router(websocket_router)  # 🔄 WebSocket Real-time

# Setup additional routes
setup_tenant_routes(app)
setup_rate_limit_routes(app)

# Mount the refactored backend app under /backend prefix to avoid conflicts
app.mount("/backend", backend_app)


# Root Endpoints
@app.get("/")
def root():
    """API root - Agency OS info with refactored architecture."""
    return {
        "name": "Agency OS Unified API - Refactored",
        "tagline": "The One-Person Unicorn Operating System with Clean Architecture",
        "version": settings.VERSION,
        "binh_phap": "Không đánh mà thắng",
        "docs": "/docs",
        "status": "operational",
        "architecture": {
            "backend": "/backend/* (refactored with clean arch)",
            "legacy": "/api/* (being migrated)",
            "websocket": "/ws (real-time)",
        },
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
            "antigravity": "loaded",
            "websocket": "loaded",
            "backend_refactored": "active",
        },
        "architecture": "clean_architecture_with_service_layer",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
