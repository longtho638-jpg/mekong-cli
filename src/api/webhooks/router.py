"""
Unified Webhook Router for Mekong CLI

Aggregates all webhook handlers (Polar, Stripe, etc.) under a single router.
"""

from fastapi import APIRouter

from src.api.polar_webhook import router as polar_router

# Main webhooks router
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Include Polar.sh webhooks
# Routes will be prefixed: /webhooks/api/v1/polar/*
router.include_router(polar_router)

# Future: Include Stripe webhooks
# router.include_router(stripe_router, prefix="/stripe")

# Future: Include GitHub webhooks
# router.include_router(github_router, prefix="/github")


__all__ = ["router"]
