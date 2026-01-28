from fastapi import APIRouter

from . import analytics, audit, cache, settings, system, users, webhooks

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(users.router)
router.include_router(settings.router)
router.include_router(audit.router)
router.include_router(system.router)
router.include_router(analytics.router)
router.include_router(webhooks.router)
router.include_router(cache.router)
