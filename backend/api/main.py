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
from backend.api.middleware.metrics import setup_metrics

# Import middleware
from backend.api.middleware.multitenant import MultiTenantMiddleware, setup_tenant_routes
from backend.api.routers import (
    admin as admin_router,
)

# Import Routers
from backend.api.routers import (
    agents as agent_router,
)
from backend.api.routers import (
    analytics as analytics_router,
)
from backend.api.routers import (
    analytics_realtime as analytics_realtime_router,
)
from backend.api.routers import (
    backup as backup_router,  # Backup & DR
)
from backend.api.routers import (
    binh_phap as binh_phap_router,
)
from backend.api.routers import (
    chatbot as chatbot_router,  # Added
)
from backend.api.routers import (
    cdn as cdn_router,  # CDN Integration
)
from backend.api.routers import (
    code as code_router,
)
from backend.api.routers import (
    crm,
    franchise,
    i18n,
    inventory,
    kanban,
    paypal_checkout,  # PayPal payment integration
    scheduler,
    stripe_production,  # Production Stripe Integration
    vietnam,
)
from backend.api.routers import (
    dashboard as dashboard_router,
)
from backend.api.routers import (
    dlq as dlq_router,
)
from backend.api.routers import (
    executive as executive_router,
)
from backend.api.routers import (
    health as health_router,  # Health check & monitoring
)
from backend.api.routers import (
    landing_pages as landing_pages_router,
)
from backend.api.routers import (
    license as license_router,  # License verification
)
from backend.api.routers import (
    llm as llm_router,  # AI/LLM Integration
)
from backend.api.routers import (
    notification_preferences as notification_preferences_router,
)
from backend.api.routers import (
    notification_templates as notification_templates_router,
)
from backend.api.routers import (
    notifications as notifications_router,
)
from backend.api.routers import (
    ops as ops_router,  # Refactored
)
from backend.api.routers import (
    push_subscriptions as push_subscriptions_router,
)
from backend.api.routers import (
    prompts as prompts_router, # Added
)
from backend.api.routers import (
    rate_limits as rate_limits_router,
)
from backend.api.routers import (
    revenue as revenue_router,  # New
)
from backend.api.routers import (
    search as search_router,
)
from backend.api.routers import (
    swarm as swarm_router,  # Refactored
)
from backend.api.routers import (
    team as team_router,  # Team management
)
from backend.api.routers import (
    webhook_health as webhook_health_router,
)
from backend.api.routers import (
    webhooks as webhooks_router,
)
from backend.api.routers.router import router as hybrid_router
from backend.middleware.cache_middleware import CacheControlMiddleware
from backend.middleware.jwt_rotation import JWTRotationMiddleware

# from backend.api.middleware.rate_limiting import setup_rate_limit_routes, setup_rate_limiting # DEPRECATED
from backend.middleware.rate_limiter import RateLimitMiddleware
from backend.middleware.security import SecurityMiddleware
from backend.middleware.security_headers import SecurityHeadersMiddleware
from backend.middleware.validation import ValidationMiddleware
from backend.services.cdn.utils import load_cdn_config, map_cache_rules_to_middleware
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
app.add_middleware(SecurityHeadersMiddleware)  # Security Headers (OWASP)
app.add_middleware(SecurityMiddleware)
app.add_middleware(JWTRotationMiddleware) # JWT Rotation & Blacklist Check

if settings.enable_validation:
    app.add_middleware(ValidationMiddleware)

# Cache Control & Server-Side Caching (Phase 7 - IPO-055)
# Load custom rules from CDN config if available
try:
    cdn_config = load_cdn_config()
    custom_cache_rules = map_cache_rules_to_middleware(cdn_config)
except Exception:
    custom_cache_rules = None

app.add_middleware(CacheControlMiddleware, cache_rules=custom_cache_rules)

if settings.enable_multitenant:
    app.add_middleware(MultiTenantMiddleware)

if settings.enable_rate_limiting:
    # setup_rate_limiting(app) # DEPRECATED
    app.add_middleware(RateLimitMiddleware)

if settings.enable_metrics:
    setup_metrics(app)

# --- Routers ---

# Core Business Domains
app.include_router(swarm_router.router)
app.include_router(revenue_router.router)
app.include_router(ops_router.router)
app.include_router(crm.router)
app.include_router(inventory.router)
app.include_router(kanban.router)
app.include_router(dashboard_router.router)
app.include_router(license_router.router)
app.include_router(team_router.router)
app.include_router(admin_router.router)
app.include_router(agent_router.router)
app.include_router(analytics_router.router)
app.include_router(landing_pages_router.router)
app.include_router(notifications_router.router)
app.include_router(notification_preferences_router.router)
app.include_router(push_subscriptions_router.router)
app.include_router(notification_templates_router.router)
app.include_router(prompts_router.router)
app.include_router(rate_limits_router.router)
app.include_router(binh_phap_router.router)
app.include_router(chatbot_router.router)
app.include_router(executive_router.router)

# Payment Integration
app.include_router(paypal_checkout.router)
app.include_router(stripe_production.router)
app.include_router(search_router.router)

# Utility & Integration
app.include_router(health_router.router)  # Health check & monitoring (first for priority)
app.include_router(backup_router.router)  # Backup Management
app.include_router(i18n.router)
app.include_router(vietnam.router)
app.include_router(scheduler.router)
app.include_router(franchise.router)
app.include_router(code_router.router)
app.include_router(cdn_router.router)
app.include_router(llm_router.router)
app.include_router(webhooks_router.router)
app.include_router(dlq_router.router)
app.include_router(webhook_health_router.router)
app.include_router(analytics_realtime_router.router)
app.include_router(hybrid_router)
app.include_router(websocket_router)

# Legacy / Setup Routes
setup_tenant_routes(app)
# setup_rate_limit_routes(app) # DEPRECATED


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    # Initialize Cache Warmer
    from backend.services.cache.warming import CacheWarmer
    warmer = CacheWarmer()
    await warmer.initialize()
    # Register tasks here if needed, or rely on service-level registration
    # await warmer.warm_up() # Optional: Run in background to not block startup

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    pass


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
