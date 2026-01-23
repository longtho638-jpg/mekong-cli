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
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# REFACTORED: Use new centralized config
from backend.api.config.settings import settings

# Import routers (only those not refactored yet)
from backend.api.middleware.metrics import setup_metrics

# Import middleware for multi-tenant, rate limiting, metrics, validation, and security
from backend.api.middleware.multitenant import (
    MultiTenantMiddleware,
    setup_tenant_routes,
)
from backend.api.middleware.rate_limiting import (
    setup_rate_limit_routes,
    setup_rate_limiting,
)
from backend.api.middleware.validation import ValidationMiddleware
from backend.api.middleware.security import SecurityMiddleware
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
    version=settings.api_version,  # Use config
    debug=settings.debug,  # Use config
    contact={
        "name": "Mekong HQ",
        "url": "https://agencyos.network",
    },
)

# Add middleware in correct order
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # Use config
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Add Security Middleware (Phase 19: Enterprise Security)
app.add_middleware(SecurityMiddleware)

# Add validation middleware (REFACTORED: New security layer)
if settings.enable_validation:
    app.add_middleware(ValidationMiddleware)

# Add multi-tenant middleware
if settings.enable_multitenant:
    app.add_middleware(MultiTenantMiddleware)

# Setup rate limiting and metrics
if settings.enable_rate_limiting:
    setup_rate_limiting(app)

if settings.enable_metrics:
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
        "version": settings.api_version,  # Use config
        "binh_phap": "Không đánh mà thắng",
        "docs": "/docs",
        "status": "operational",
        "environment": settings.environment,  # Use config
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
