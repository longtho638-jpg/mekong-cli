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
    version="2.1.0",
    contact={
        "name": "Mekong HQ",
        "url": "https://agencyos.network",
    },
)


# CORS middleware with secure origins
def get_allowed_origins():
    """Get allowed origins from environment or use secure defaults."""
    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]

    # Default secure origins based on environment
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production":
        return ["https://agencyos.network", "https://www.agencyos.network"]
    elif env == "staging":
        return ["https://staging.agencyos.network"]
    else:
        return ["http://localhost:3000", "http://localhost:8000"]


# Add middleware in correct order
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
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
        "version": "2.1.0",
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
