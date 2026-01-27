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

# Initialize Sentry for error tracking and performance monitoring
from backend.core.logging import setup_logging
from backend.core.sentry_config import init_sentry

# Setup structured logging first
setup_logging(os.getenv("LOG_LEVEL", "INFO"))

init_sentry(
    traces_sample_rate=0.1,  # Sample 10% of transactions in production
    profiles_sample_rate=0.1,  # Profile 10% of transactions
)

from backend.api.auth.router import router as auth_router
from backend.api.config import settings
from backend.api.openapi import custom_openapi
from backend.api.routers import (
    accounting,
    affiliates,  # Added
    agents,
    agents_creator,
    analytics,
    audit,
    campaigns,
    developers,  # Added
    dlq,  # Added Advanced Webhooks DLQ
    exports,  # Added Data Exports
    gumroad_webhooks,
    hr,
    inventory,
    invoices,
    jobs,  # Added Job Queue
    kanban,
    license_production,
    mekong_commands,
    monitor,
    notification_preferences,  # Added
    notification_templates,  # Added
    notifications,  # Added
    oauth,  # Added OAuth
    ops,
    payments,
    paypal_webhooks,
    push_subscriptions,  # Added
    rate_limits,  # Added Rate Limits
    revenue,
    stripe_webhooks,
    swarm,
    user_preferences,  # Added User Preferences
    vibes,
    webhook_health,  # Added Advanced Webhooks
    workflow,
)
from backend.api.routers import (
    router as hybrid_router,
)
from backend.api.v1 import router as v1_router  # Added Public API V1
from backend.middleware import (
    LicenseValidatorMiddleware,
    PerformanceMonitoringMiddleware,
    RateLimitMiddleware,
    get_metrics_summary,
)
from backend.middleware.api_auth import ApiAuthMiddleware  # Added
from backend.middleware.audit_middleware import AuditMiddleware  # Added
from backend.middleware.cache_middleware import CacheControlMiddleware  # Added
from backend.middleware.locale_middleware import LocaleMiddleware  # Added
from backend.routes.agentops import router as agentops_router
from backend.services.api_key_service import ApiKeyService  # Added
from backend.websocket.dashboard_routes import router as dashboard_ws_router
from backend.websocket.routes import router as ws_router

# Initialize FastAPI
app = FastAPI(
    title="AgencyOS API",
    description="🌊 Deploy Your Agency in 15 Minutes - Backend API with Clean Architecture",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Override OpenAPI schema
app.openapi = custom_openapi(app)

# Add performance monitoring middleware (before rate limiting for accurate timing)
app.add_middleware(PerformanceMonitoringMiddleware)

# Add Cache Control Middleware
app.add_middleware(CacheControlMiddleware)

# Add Audit Middleware (Log all requests)
app.add_middleware(AuditMiddleware)

# Add Locale Middleware (Detect language/currency)
app.add_middleware(LocaleMiddleware)

# Add Public API Auth Middleware (tracks usage and verifies keys for /api/v1)
# Initialize service
api_key_service = ApiKeyService()
app.add_middleware(ApiAuthMiddleware, api_key_service=api_key_service)

# Add rate limiting middleware (before CORS)
app.add_middleware(
    RateLimitMiddleware,
    redis_url=settings.redis_url
)

# License Validation Middleware (Non-blocking by default, logs usage)
app.add_middleware(LicenseValidatorMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(license_production.router)
app.include_router(analytics.router)
app.include_router(hr.router)
app.include_router(invoices.router)
app.include_router(accounting.router)
app.include_router(inventory.router)
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
app.include_router(paypal_webhooks.router)
app.include_router(stripe_webhooks.router)
app.include_router(gumroad_webhooks.router)
app.include_router(payments.router)
app.include_router(revenue.router)
app.include_router(affiliates.router) # Added
app.include_router(ops.router)
app.include_router(swarm.router)
app.include_router(ws_router)
app.include_router(dashboard_ws_router)
app.include_router(auth_router)
app.include_router(oauth.router) # Added OAuth Router
app.include_router(jobs.router) # Added Job Queue
app.include_router(webhook_health.router) # Added Webhook Health
app.include_router(dlq.router) # Added Webhook DLQ
app.include_router(notifications.router) # Added Notifications
app.include_router(notification_preferences.router) # Added Notification Preferences
app.include_router(notification_templates.router) # Added Notification Templates
app.include_router(push_subscriptions.router) # Added Push Subscriptions
app.include_router(user_preferences.router) # Added User Preferences
app.include_router(exports.router) # Added Data Exports
app.include_router(rate_limits.router) # Added Rate Limits
app.include_router(v1_router) # Added Public API V1

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

@app.get("/metrics")
async def metrics():
    """Performance metrics for dashboard"""
    return get_metrics_summary()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
