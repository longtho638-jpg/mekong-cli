from fastapi import APIRouter

from backend.api.v1 import invoices, subscriptions, usage, webhooks

router = APIRouter(prefix="/api/v1")

router.include_router(subscriptions.router)
router.include_router(invoices.router)
router.include_router(usage.router)
router.include_router(webhooks.router)


# We can also add a root /api/v1 endpoint
@router.get("/")
async def api_root():
    return {
        "version": "v1",
        "documentation": "/api/v1/docs",
        "endpoints": ["/subscriptions", "/invoices", "/usage", "/webhooks"],
    }
