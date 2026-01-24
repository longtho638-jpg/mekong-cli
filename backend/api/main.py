"""
🏯 AGENCY OS - Unified Backend API
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

# Import middleware
from backend.api.middleware.multitenant import MultiTenantMiddleware, setup_tenant_routes
from backend.api.middleware.rate_limiting import setup_rate_limit_routes, setup_rate_limiting
from backend.api.middleware.security import SecurityMiddleware
from backend.api.middleware.validation import ValidationMiddleware
from backend.api.middleware.metrics import setup_metrics

# Import Routers
from backend.api.routers import (
    code as code_router,
    crm,
    franchise,
    i18n,
    kanban,
    scheduler,
    vietnam,
    webhooks as webhooks_router,
    dashboard as dashboard_router,
    swarm as swarm_router,  # Refactored
    ops as ops_router,      # Refactored
    revenue as revenue_router, # New
)
from backend.api.routers.router import router as hybrid_router
from backend.websocket.routes import router as websocket_router

# Initialize FastAPI
app = FastAPI(
    title="🏯 Agency OS Unified API",
    description="The One-Person Unicorn Operating System API",
    version=settings.api_version,
    debug=settings.debug,
    contact={
        "name": "Mekong HQ",
        "url": "https://agencyos.network",
    },
)

# --- Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Enterprise Security (Phase 19)
app.add_middleware(SecurityMiddleware)

if settings.enable_validation:
    app.add_middleware(ValidationMiddleware)

if settings.enable_multitenant:
    app.add_middleware(MultiTenantMiddleware)

if settings.enable_rate_limiting:
    setup_rate_limiting(app)

if settings.enable_metrics:
    setup_metrics(app)

# --- Routers ---

# Core Business Domains
app.include_router(swarm_router.router)
app.include_router(revenue_router.router)
app.include_router(ops_router.router)
app.include_router(crm.router)
app.include_router(kanban.router)
app.include_router(dashboard_router.router)

# Utility & Integration
app.include_router(i18n.router)
app.include_router(vietnam.router)
app.include_router(scheduler.router)
app.include_router(franchise.router)
app.include_router(code_router.router)
app.include_router(webhooks_router.router)
app.include_router(hybrid_router)
app.include_router(websocket_router)

# Legacy / Setup Routes
setup_tenant_routes(app)
setup_rate_limit_routes(app)


# --- Root Endpoints ---

@app.get("/")
def root():
    """API root - Agency OS info."""
    return {
        "name": "Agency OS Unified API",
        "tagline": "The One-Person Unicorn Operating System",
        "version": settings.api_version,
        "binh_phap": "Không đánh mà thắng",
        "docs": "/docs",
        "status": "operational",
        "environment": settings.environment,
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "modules": {
            "swarm": "active",
            "revenue": "active",
            "ops": "active",
            "crm": "loaded",
        },
        "architecture": "modular_v2",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
